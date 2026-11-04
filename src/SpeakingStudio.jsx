import { useEffect, useRef, useState } from "react";
import {
  Mic,
  Square,
  RotateCcw,
  Headphones,
  AlertCircle,
  CheckCircle2,
  Info, 
} from "lucide-react";
import "./SpeakingStudio.css";

function SpeakingStudio({ question }) {
  const [status, setStatus] = useState("idle");
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState(""); // mensaje automático de "Time's up!"
  const [seconds, setSeconds] = useState(0);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  const TIME_LIMIT = 90; // 1:30 minutos en segundos

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  useEffect(() => {
    if (status !== "recording") return;

    // Si se alcanza el límite exacto de tiempo
    if (seconds >= TIME_LIMIT) {
      setInfoMessage("Time's up! Your audio was automatically saved."); // Setear el mensaje requerido
      stopRecording();
      return;
    }

    const interval = setInterval(() => {
      setSeconds((previous) => previous + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [status, seconds]);

  function formatTime(time) {
    const minutes = Math.floor(time / 60);
    const remainingSeconds = time % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  }

  async function startRecording() {
    setError("");
    setInfoMessage(""); // Limpia el mensaje al iniciar una nueva grabación

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

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

        const newAudioUrl = URL.createObjectURL(audioBlob);

        setAudioUrl(newAudioUrl);
        setStatus("finished");

        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };

      recorder.start();
      setSeconds(0);
      setStatus("recording");
    } catch (err) {
      if (err.name === "NotAllowedError") {
        setError("Microphone access was denied. Check your browser permissions.");
      } else {
        setError("We couldn't access your microphone. Please try again.");
      }
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      setStatus("processing");
    }
  }

  function recordAgain() {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    setAudioUrl(null);
    setSeconds(0);
    setError("");
    setInfoMessage(""); // Limpiam el mensaje al reiniciar todo
    setStatus("idle");
  }

  return (
    <section className="speaking-studio">
      <div className="speaking-heading">
        <div className="speaking-icon">
          <Mic size={21} />
        </div>

        <div>
          <span className="speaking-kicker">STEP 04 · SPEAK</span>
          <h2>Give your ideas a voice.</h2>
          <p>
            Use your notes to speak naturally. You don't need to read a script.
          </p>
        </div>
      </div>

      <div className="speaking-prompt">
        <span>YOUR CHALLENGE</span>
        <p>{question}</p>
      </div>

      <div className="recording-panel">
  <div className="recording-status">
    <span
      className={`recording-indicator ${
        status === "recording" ? "is-recording" : ""
      }`}
    />
    {status === "recording"
      ? "Recording in progress"
      : status === "finished"
        ? "Recording completed"
        : status === "processing"
          ? "Preparing your audio..."
          : "Ready when you are"}
  </div>

  {/* Aplica 'near-limit' si restan 10 segundos o menos */}
  <div className={`recording-timer ${status === "recording" && (TIME_LIMIT - seconds) <= 10 ? "near-limit" : ""}`}>
    {formatTime(seconds)}{" "}
    <span className="timer-limit">/ {formatTime(TIME_LIMIT)}</span>
  </div>

  {status === "idle" && (
    <>
      <button className="record-button" onClick={startRecording}>
        <Mic size={19} />
        Start recording
      </button>
      {/* Aviso antes de que el usuario empiece a grabar */}
      <p className="time-limit-notice">
        Maximum duration: {formatTime(TIME_LIMIT)} minutes.
      </p>
    </>
  )}

  {status === "recording" && (
    <button className="record-button stop-button" onClick={stopRecording}>
      <Square size={17} />
      Stop recording
    </button>
  )}

  {status === "processing" && (
    <p className="recording-message">Please wait...</p>
  )}

  {status === "finished" && audioUrl && (
    <div className="audio-result">
      <div className="audio-result-heading">
        <CheckCircle2 size={18} />
        Your contribution is ready to listen to.
      </div>
      <audio controls src={audioUrl} />
      <button className="retry-button" onClick={recordAgain}>
        <RotateCcw size={16} />
        Record again
      </button>
    </div>
  )}

  {infoMessage && (
    <div className="recording-info-message">
      <Info size={17} />
      <span>{infoMessage}</span>
    </div>
  )}

  {error && (
    <div className="recording-error">
      <AlertCircle size={17} />
      <span>{error}</span>
    </div>
  )}
</div>


      <div className="speaking-privacy">
        <Headphones size={17} />
        <span>
          Your recording stays in this browser session. It is not uploaded to a
          server.
        </span>
      </div>
    </section>
  );
}

export default SpeakingStudio;
