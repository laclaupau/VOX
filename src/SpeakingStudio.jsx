
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
const MAX_AUDIO_SIZE = 3 * 1024 * 1024;

function SpeakingStudio({
  question,
  cefrLevel = "B1",
  language = "English",
  subject = "General",
  onBack,
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

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (firstAudioUrl) URL.revokeObjectURL(firstAudioUrl);
      if (secondAudioUrl) URL.revokeObjectURL(secondAudioUrl);
    };
  }, [firstAudioUrl, secondAudioUrl]);

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
      setError("Your browser does not support audio recording.");
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
            "This recording is too large to analyse. Please record a shorter contribution."
          );
          setRecording(false);
          setStage(attemptRef.current === 1 ? "first" : "second");
        } else {
          const url = URL.createObjectURL(blob);

          if (attemptRef.current === 1) {
            if (firstAudioUrl) URL.revokeObjectURL(firstAudioUrl);
            setFirstAudio(blob);
            setFirstAudioUrl(url);
            setStage("first-ready");
          } else {
            if (secondAudioUrl) URL.revokeObjectURL(secondAudioUrl);
            setSecondAudio(blob);
            setSecondAudioUrl(url);
            setStage("second-ready");
          }
        }

        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setRecording(false);
        setSeconds(0);
      };

      recorder.start();
      setRecording(true);

      timerRef.current = setInterval(() => {
        setSeconds((previous) => {
          if (previous + 1 >= TIME_LIMIT) {
            clearInterval(timerRef.current);
            if (recorder.state === "recording") recorder.stop();
            return TIME_LIMIT;
          }

          return previous + 1;
        });
      }, 1000);
    } catch (err) {
      setError(
        err.name === "NotAllowedError"
          ? "Microphone access was denied. Check your browser permissions."
          : "We couldn't access your microphone. Please try again."
      );
    }
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);

    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
  }

  function discardCurrentAudio() {
    if (stage === "first-ready") {
      if (firstAudioUrl) URL.revokeObjectURL(firstAudioUrl);
      setFirstAudio(null);
      setFirstAudioUrl("");
      setStage("first");
    }

    if (stage === "second-ready") {
      if (secondAudioUrl) URL.revokeObjectURL(secondAudioUrl);
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
        firstAudio?.type || currentAudio?.type || "audio/webm"
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
        payload.firstAudio = await blobToBase64(firstAudio);
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
        throw new Error(data.error || "Gemini could not analyse the audio.");
      }

      if (action === "analyze") {
        setFeedback(data.result);
        setStage("first-feedback");
      } else {
        setComparison(data.result);
        setStage("comparison");
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function startSecondAttempt() {
    setSecondAudio(null);
    setSecondAudioUrl("");
    setError("");
    setStage("second");
  }

  function restartActivity() {
    if (firstAudioUrl) URL.revokeObjectURL(firstAudioUrl);
    if (secondAudioUrl) URL.revokeObjectURL(secondAudioUrl);

    setFirstAudio(null);
    setFirstAudioUrl("");
    setSecondAudio(null);
    setSecondAudioUrl("");
    setFeedback(null);
    setComparison(null);
    setError("");
    setSeconds(0);
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
      ["strengths", "What worked well"],
      ["development", "What you could develop"],
      ["oralCommunication", "Oral communication"],
      ["nextQuestion", "A question to think further"],
      ["nextStep", "Your next step"],
      ["changes", "What changed"],
      ["reasoning", "Development of your ideas"],
      ["pending", "What still needs attention"],
      ["evidence", "Evidence from the recordings"],
    ];

    return (
      <section className="vox-feedback-card">
        <div className="vox-feedback-title">
          <Sparkles size={19} />
          <h3>{title}</h3>
        </div>

        {fields.map(([key, label]) =>
          data[key] ? (
            <div className="vox-feedback-item" key={key}>
              <h4>{label}</h4>
              <p>{data[key]}</p>
            </div>
          ) : null
        )}

        {data.message && <p>{data.message}</p>}
      </section>
    );
  }

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
        <span>YOUR CHALLENGE</span>
        <p>{question}</p>
      </div>

      {(stage === "first" || stage === "second") && (
        <div className="recording-panel">
          <div className="recording-status">
            <span
              className={`recording-indicator ${
                recording ? "is-recording" : ""
              }`}
            />
            {recording ? "Recording in progress" : "Ready when you are"}
          </div>

          <div className="recording-timer">
            {formatTime(seconds)}
            <span className="timer-limit"> / {formatTime(TIME_LIMIT)}</span>
          </div>

          {!recording ? (
            <button className="record-button" onClick={startRecording}>
              <Mic size={19} />
              {stage === "first" ? "Start recording" : "Record second attempt"}
            </button>
          ) : (
            <button
              className="record-button stop-button"
              onClick={stopRecording}
            >
              <Square size={17} />
              Stop recording
            </button>
          )}

          <p className="time-limit-notice">
            Maximum duration: {formatTime(TIME_LIMIT)}.
          </p>
        </div>
      )}

      {stage === "first-ready" && (
        <div className="recording-panel">
          <div className="audio-result-heading">
            <CheckCircle2 size={18} />
            Your first contribution is ready.
          </div>

          {renderAudioPlayer("First attempt", firstAudioUrl)}

          <div className="vox-action-row">
            <button className="retry-button" onClick={discardCurrentAudio}>
              <RotateCcw size={16} />
              Record again
            </button>

            <button
              className="ai-reflection-button"
              onClick={() => sendToGemini("analyze")}
              disabled={loading}
            >
              <Sparkles size={16} />
              {loading ? "Gemini is analysing..." : "Send to Gemini"}
            </button>
          </div>
        </div>
      )}

      {stage === "first-feedback" && (
        <>
          {renderAudioPlayer("Listen to your first attempt", firstAudioUrl)}
          {renderFeedbackSection("Feedback on your first attempt", feedback)}

          <button className="ai-reflection-button" onClick={startSecondAttempt}>
            <RotateCcw size={16} />
            Try again
            <ArrowRight size={16} />
          </button>
        </>
      )}

      {stage === "second-ready" && (
        <div className="recording-panel">
          <div className="audio-result-heading">
            <CheckCircle2 size={18} />
            Your second contribution is ready.
          </div>

          {renderAudioPlayer("First attempt", firstAudioUrl)}
          {renderAudioPlayer("Second attempt", secondAudioUrl)}

          <div className="vox-action-row">
            <button className="retry-button" onClick={discardCurrentAudio}>
              <RotateCcw size={16} />
              Record second attempt again
            </button>

            <button
              className="ai-reflection-button"
              onClick={() => sendToGemini("compare")}
              disabled={loading}
            >
              <Sparkles size={16} />
              {loading ? "Comparing recordings..." : "Compare both attempts"}
            </button>
          </div>
        </div>
      )}

      {stage === "comparison" && (
        <>
          <section className="vox-recordings">
            <h3>Your recordings</h3>
            {renderAudioPlayer("First attempt", firstAudioUrl)}
            {renderAudioPlayer("Second attempt", secondAudioUrl)}
          </section>

          {renderFeedbackSection("Your progress: a comparison", comparison)}

          <div className="vox-action-row">
            <button className="retry-button" onClick={restartActivity}>
              <RotateCcw size={16} />
              New attempt
            </button>

            {onBack && (
              <button className="ai-reflection-button" onClick={onBack}>
                Back to Challenges
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
            ? "VOX is listening to your contribution..."
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
          Your recordings are used to generate feedback for this activity.
        </span>
      </div>
    </section>
  );
}

export default SpeakingStudio;
