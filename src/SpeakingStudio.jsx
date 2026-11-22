import { useEffect, useRef, useState } from "react";
import {
  Mic,
  Square,
  RotateCcw,
  Headphones,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Volume2,
} from "lucide-react";
import "./SpeakingStudio.css";

const TIME_LIMIT = 90;
const MAX_AUDIO_SIZE = 2.5 * 1024 * 1024;

function SpeakingStudio({
  question,
  cefrLevel = "B1",
  language = "English",
  subject = "General",
  onBack,
  onComplete,
}) {
  const [stage, setStage] = useState("first");
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const [firstAudio, setFirstAudio] = useState(null);
  const [firstAudioUrl, setFirstAudioUrl] = useState("");
  const [secondAudio, setSecondAudio] = useState(null);
  const [secondAudioUrl, setSecondAudioUrl] = useState("");

  const [feedback, setFeedback] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const attemptRef = useRef(1);

  // Keep track of audio URLs independently from React state.
  // This prevents the first recording from being revoked
  // when the second recording is created.
  const audioUrlsRef = useRef({
    first: "",
    second: "",
  });

  const isSpanish = language?.toLowerCase().startsWith("spanish");

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (audioUrlsRef.current.first) {
        URL.revokeObjectURL(audioUrlsRef.current.first);
      }

      if (audioUrlsRef.current.second) {
        URL.revokeObjectURL(audioUrlsRef.current.second);
      }
    };
  }, []);

  function formatTime(value) {
    const minutes = Math.floor(value / 60);
    const secondsLeft = value % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      secondsLeft
    ).padStart(2, "0")}`;
  }

  async function startRecording() {
    setError("");
    setSeconds(0);

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError(
        isSpanish
          ? "Tu navegador no permite grabar audio."
          : "Your browser does not support audio recording."
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      attemptRef.current = stage === "first" ? 1 : 2;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

        if (blob.size > MAX_AUDIO_SIZE) {
          setError(
            isSpanish
              ? "La grabación es demasiado grande para analizarla. Grabá una intervención más breve."
              : "This recording is too large to analyse. Please record a shorter contribution."
          );

          setRecording(false);
          setStage(attemptRef.current === 1 ? "first" : "second");
        } else {
          const url = URL.createObjectURL(blob);

          if (attemptRef.current === 1) {
            if (audioUrlsRef.current.first) {
              URL.revokeObjectURL(audioUrlsRef.current.first);
            }

            audioUrlsRef.current.first = url;

            setFirstAudio(blob);
            setFirstAudioUrl(url);
            setStage("first-ready");
          } else {
            if (audioUrlsRef.current.second) {
              URL.revokeObjectURL(audioUrlsRef.current.second);
            }

            audioUrlsRef.current.second = url;

            setSecondAudio(blob);
            setSecondAudioUrl(url);
            setStage("second-ready");
          }
        }

        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        setRecording(false);
        setSeconds(0);

        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };

      recorder.start();
      setRecording(true);

      timerRef.current = setInterval(() => {
        setSeconds((previous) => {
          if (previous + 1 >= TIME_LIMIT) {
            clearInterval(timerRef.current);
            timerRef.current = null;

            if (recorder.state === "recording") {
              recorder.stop();
            }

            return TIME_LIMIT;
          }

          return previous + 1;
        });
      }, 1000);
    } catch (err) {
      setError(
        err.name === "NotAllowedError"
          ? isSpanish
            ? "No se permitió el acceso al micrófono. Revisá los permisos del navegador."
            : "Microphone access was denied. Check your browser permissions."
          : isSpanish
            ? "No pudimos acceder al micrófono. Intentá nuevamente."
            : "We couldn't access your microphone. Please try again."
      );
    }
  }

  function stopRecording() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
  }

  function discardCurrentAudio() {
    if (stage === "first-ready") {
      if (audioUrlsRef.current.first) {
        URL.revokeObjectURL(audioUrlsRef.current.first);
      }

      audioUrlsRef.current.first = "";

      setFirstAudio(null);
      setFirstAudioUrl("");
      setStage("first");
    }

    if (stage === "second-ready") {
      if (audioUrlsRef.current.second) {
        URL.revokeObjectURL(audioUrlsRef.current.second);
      }

      audioUrlsRef.current.second = "";

      setSecondAudio(null);
      setSecondAudioUrl("");
      setStage("second");
    }

    setError("");
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        const result = reader.result;
        resolve(result.split(",")[1]);
      };

      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async function sendToGemini(action) {
    setLoading(true);
    setError("");

    try {
      const currentAudio = action === "analyze" ? firstAudio : secondAudio;

      const mimeType = (
        currentAudio?.type || firstAudio?.type || "audio/webm"
      ).split(";")[0];

      const payload = {
        action,
        question,
        cefrLevel,
        language,
        subject,
        mimeType,
      };

      if (action === "analyze") {
        payload.audio = await blobToBase64(firstAudio);
      } else {
        if (!feedback?.transcription) {
          throw new Error(
            isSpanish
              ? "No encontramos la transcripción del primer intento. Volvé a analizarlo antes de comparar."
              : "The first attempt transcription is missing. Please analyse it again before comparing."
          );
        }

        payload.firstTranscript = feedback.transcription;
        payload.secondAudio = await blobToBase64(secondAudio);
      }

      const response = await fetch("/api/reflect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            (isSpanish
              ? "Gemini no pudo analizar el audio."
              : "Gemini could not analyse the audio.")
        );
      }

      if (action === "analyze") {
        setFeedback(data.result);
        setStage("first-feedback");
      } else {
        setComparison(data.result);
        setStage("comparison");
        onComplete?.({
          firstTranscription: feedback?.transcription || "",
          secondTranscription: data.result?.transcriptions?.second || "",
          comparison: data.result,
          firstAttemptFeedback: feedback,
          completedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      setError(
        err.message ||
          (isSpanish
            ? "Ocurrió un error. Intentá nuevamente."
            : "Something went wrong. Please try again.")
      );
    } finally {
      setLoading(false);
    }
  }

  function startSecondAttempt() {
    if (audioUrlsRef.current.second) {
      URL.revokeObjectURL(audioUrlsRef.current.second);
    }

    audioUrlsRef.current.second = "";

    setSecondAudio(null);
    setSecondAudioUrl("");
    setComparison(null);
    setError("");
    setSeconds(0);
    setStage("second");
  }

  function restartActivity() {
    if (audioUrlsRef.current.first) {
      URL.revokeObjectURL(audioUrlsRef.current.first);
    }

    if (audioUrlsRef.current.second) {
      URL.revokeObjectURL(audioUrlsRef.current.second);
    }

    audioUrlsRef.current = {
      first: "",
      second: "",
    };

    setFirstAudio(null);
    setFirstAudioUrl("");
    setSecondAudio(null);
    setSecondAudioUrl("");
    setFeedback(null);
    setComparison(null);
    setError("");
    setSeconds(0);
    setRecording(false);
    setStage("first");
  }

  function renderAudioPlayer(label, url) {
    if (!url) return null;

    return (
      <div className="vox-audio-player">
        <div className="vox-audio-label">
          <Volume2 size={17} />
          <strong>{label}</strong>
        </div>

        <audio controls src={url} />
      </div>
    );
  }

  function renderFeedbackSection(title, data) {
    if (!data) return null;

    const fields = [
      [
        "strengths",
        isSpanish ? "Lo que hiciste bien" : "What worked well",
      ],
      [
        "development",
        isSpanish ? "Qué podés desarrollar" : "What you could develop",
      ],
      [
        "oralCommunication",
        isSpanish ? "Comunicación oral" : "Oral communication",
      ],
      [
        "nextQuestion",
        isSpanish
          ? "Una pregunta para seguir pensando"
          : "A question to think further",
      ],
      [
        "nextStep",
        isSpanish ? "Tu próximo paso" : "Your next step",
      ],
      [
        "changes",
        isSpanish ? "Qué cambió" : "What changed",
      ],
      [
        "reasoning",
        isSpanish
          ? "Desarrollo de tus ideas"
          : "Development of your ideas",
      ],
      [
        "pending",
        isSpanish
          ? "Qué queda por trabajar"
          : "What still needs attention",
      ],
      [
        "evidence",
        isSpanish
          ? "Evidencias de las grabaciones"
          : "Evidence from the recordings",
      ],
    ];

    return (
      <section className="vox-feedback-card">
        <div className="vox-feedback-title">
          <Sparkles size={19} />
          <h3>{title}</h3>
        </div>

        {fields.map(([key, label]) => {
          const value = data[key];

          const hasContent = Array.isArray(value)
            ? value.length > 0
            : typeof value === "string" && value.trim().length > 0;

          if (!hasContent) {
            return null;
          }

          return (
            <div className="vox-feedback-item" key={key}>
              <h4>{label}</h4>

              {Array.isArray(value) ? (
                <ul>
                  {value.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p>{value}</p>
              )}
            </div>
          );
        })}

        {data.transcription && (
          <div className="vox-feedback-item">
            <h4>{isSpanish ? "Lo que VOX entendió" : "What VOX understood"}</h4>
            <p>{data.transcription}</p>
          </div>
        )}

        {data.transcriptions && (
          <div className="vox-feedback-item">
            <h4>{isSpanish ? "Transcripciones para comparar" : "Transcripts being compared"}</h4>
            <p>
              <strong>{isSpanish ? "Primer intento: " : "First attempt: "}</strong>
              {data.transcriptions.first}
            </p>
            <p>
              <strong>{isSpanish ? "Segundo intento: " : "Second attempt: "}</strong>
              {data.transcriptions.second}
            </p>
          </div>
        )}

        {data.message && <p>{data.message}</p>}
      </section>
    );
  }

  const showFirstFeedback =
    feedback &&
    ["second", "second-ready", "comparison"].includes(stage);

  return (
    <section className="speaking-studio">
      <div className="speaking-heading">
        <div className="speaking-icon">
          <Mic size={21} />
        </div>

        <div>
          <span className="speaking-kicker">SPEAKING STUDIO</span>
          <h2>Give your ideas a voice.</h2>
          <p>Think it through. Say it. Listen. Try again.</p>
        </div>
      </div>

      <div className="speaking-prompt">
        <span>{isSpanish ? "TU DESAFÍO" : "YOUR CHALLENGE"}</span>
        <p>{question}</p>
      </div>

      {showFirstFeedback && (
        <div className="vox-previous-feedback">
          {renderAudioPlayer(
            isSpanish ? "Tu primera intervención" : "Your first attempt",
            firstAudioUrl
          )}

          {renderFeedbackSection(
            isSpanish
              ? "Devolución del primer intento"
              : "Feedback on your first attempt",
            feedback
          )}
        </div>
      )}

      {(stage === "first" || stage === "second") && (
        <div className="recording-panel">
          <div className="recording-status">
            <span
              className={`recording-indicator ${
                recording ? "is-recording" : ""
              }`}
            />

            {recording
              ? isSpanish
                ? "Grabando..."
                : "Recording in progress"
              : isSpanish
                ? "Cuando quieras, empezá"
                : "Ready when you are"}
          </div>

          <div className="recording-timer">
            {formatTime(seconds)}
            <span className="timer-limit"> / {formatTime(TIME_LIMIT)}</span>
          </div>

          {!recording ? (
            <button className="record-button" onClick={startRecording}>
              <Mic size={19} />
              {stage === "first"
                ? isSpanish
                  ? "Empezar a grabar"
                  : "Start recording"
                : isSpanish
                  ? "Grabar segundo intento"
                  : "Record second attempt"}
            </button>
          ) : (
            <button
              className="record-button stop-button"
              onClick={stopRecording}
            >
              <Square size={17} />
              {isSpanish ? "Detener grabación" : "Stop recording"}
            </button>
          )}

          <p className="time-limit-notice">
            {isSpanish ? "Duración máxima: " : "Maximum duration: "}
            {formatTime(TIME_LIMIT)}.
          </p>
        </div>
      )}

      {stage === "first-ready" && (
        <div className="recording-panel">
          <div className="audio-result-heading">
            <CheckCircle2 size={18} />
            {isSpanish
              ? "Tu primera intervención está lista."
              : "Your first contribution is ready."}
          </div>

          {renderAudioPlayer(
            isSpanish ? "Primer intento" : "First attempt",
            firstAudioUrl
          )}

          <div className="vox-action-row">
            <button className="retry-button" onClick={discardCurrentAudio}>
              <RotateCcw size={16} />
              {isSpanish ? "Grabar nuevamente" : "Record again"}
            </button>

            <button
              className="ai-reflection-button"
              onClick={() => sendToGemini("analyze")}
              disabled={loading}
            >
              <Sparkles size={16} />
              {loading
                ? isSpanish
                  ? "Analizando..."
                  : "Gemini is analysing..."
                : isSpanish
                  ? "Analizar mi intervención"
                  : "Send to Gemini"}
            </button>
          </div>
        </div>
      )}

      {stage === "first-feedback" && (
        <>
          {renderAudioPlayer(
            isSpanish ? "Escuchá tu primer intento" : "Listen to your first attempt",
            firstAudioUrl
          )}

          {renderFeedbackSection(
            isSpanish
              ? "Devolución del primer intento"
              : "Feedback on your first attempt",
            feedback
          )}

          <button
            className="ai-reflection-button"
            onClick={startSecondAttempt}
          >
            <RotateCcw size={16} />
            {isSpanish ? "Intentar nuevamente" : "Try again"}
            <ArrowRight size={16} />
          </button>
        </>
      )}

      {stage === "second-ready" && (
        <div className="recording-panel">
          <div className="audio-result-heading">
            <CheckCircle2 size={18} />
            {isSpanish
              ? "Tu segundo intento está listo."
              : "Your second contribution is ready."}
          </div>

          {renderAudioPlayer(
            isSpanish ? "Primer intento" : "First attempt",
            firstAudioUrl
          )}

          {renderAudioPlayer(
            isSpanish ? "Segundo intento" : "Second attempt",
            secondAudioUrl
          )}

          <div className="vox-action-row">
            <button className="retry-button" onClick={discardCurrentAudio}>
              <RotateCcw size={16} />
              {isSpanish
                ? "Grabar el segundo intento nuevamente"
                : "Record second attempt again"}
            </button>

            <button
              className="ai-reflection-button"
              onClick={() => sendToGemini("compare")}
              disabled={loading}
            >
              <Sparkles size={16} />
              {loading
                ? isSpanish
                  ? "Comparando..."
                  : "Comparing recordings..."
                : isSpanish
                  ? "Comparar ambos intentos"
                  : "Compare both attempts"}
            </button>
          </div>
        </div>
      )}

      {stage === "comparison" && (
        <>
          <section className="vox-recordings">
            <h3>{isSpanish ? "Tus grabaciones" : "Your recordings"}</h3>

            {renderAudioPlayer(
              isSpanish ? "Primer intento" : "First attempt",
              firstAudioUrl
            )}

            {renderAudioPlayer(
              isSpanish ? "Segundo intento" : "Second attempt",
              secondAudioUrl
            )}
          </section>

          {renderFeedbackSection(
            isSpanish
              ? "Comparación de tus intervenciones"
              : "Your progress: a comparison",
            comparison
          )}

          <div className="vox-action-row">
            <button className="retry-button" onClick={restartActivity}>
              <RotateCcw size={16} />
              {isSpanish ? "Nuevo intento" : "New attempt"}
            </button>

            {onBack && (
              <button className="ai-reflection-button" onClick={onBack}>
                {isSpanish ? "Volver a los desafíos" : "Back to Challenges"}
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </>
      )}

      {loading && (
        <div className="ai-loading">
          <Sparkles size={17} />
          {stage === "first-ready"
            ? isSpanish
              ? "VOX está escuchando tu intervención..."
              : "VOX is listening to your contribution..."
            : isSpanish
              ? "VOX está comparando ambas grabaciones..."
              : "VOX is comparing both recordings..."}
        </div>
      )}

      {error && (
        <div className="recording-error">
          <AlertCircle size={17} />
          <span>{error}</span>
        </div>
      )}

      <div className="speaking-privacy">
        <Headphones size={17} />
        <span>
          {isSpanish
            ? "Tus grabaciones se utilizan para generar la devolución de esta actividad."
            : "Your recordings are used to generate feedback for this activity."}
        </span>
      </div>
    </section>
  );
}

export default SpeakingStudio;