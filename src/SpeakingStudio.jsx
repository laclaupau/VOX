import { useEffect, useRef, useState } from "react";
import {
  Mic,
  Square,
  RotateCcw,
  Headphones,
  AlertCircle,
  CheckCircle2,
  Info,
  Brain,
  Lightbulb,
  Link2,
  Compass,
  Save,
  Sparkles,
} from "lucide-react";
import "./SpeakingStudio.css";

const reflectionLenses = [
  {
    id: "clarify",
    title: "Clarify",
    description: "Make your idea easier to understand.",
    prompt:
      "What exactly do I mean? Which part of my contribution could I explain more clearly?",
    routine: "Inspired by: What Makes You Say That?",
    icon: Lightbulb,
  },
  {
    id: "develop",
    title: "Develop",
    description: "Give your idea more depth.",
    prompt:
      "What makes me say that? What reason, example or evidence could make my idea stronger?",
    routine: "Inspired by: What Makes You Say That?",
    icon: Brain,
  },
  {
    id: "connect",
    title: "Connect",
    description: "Link your idea to something else.",
    prompt:
      "How does my idea connect with the text, another idea, an experience or something I already know?",
    routine: "Inspired by: Connect–Extend–Challenge",
    icon: Link2,
  },
  {
    id: "challenge",
    title: "Challenge",
    description: "Explore another point of view.",
    prompt:
      "What might someone with a different point of view say? Is there an assumption I could question?",
    routine: "Inspired by: Connect–Extend–Challenge",
    icon: Compass,
  },
];

function SpeakingStudio({ question }) {
  const [status, setStatus] = useState("idle");
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [seconds, setSeconds] = useState(0);

  const [selectedLens, setSelectedLens] = useState(null);
  const [reflection, setReflection] = useState("");
  const [reflectionSaved, setReflectionSaved] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState("");
  const [aiError, setAiError] = useState("");

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  const TIME_LIMIT = 90;

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

    if (seconds >= TIME_LIMIT) {
      setInfoMessage(
        "Time's up! Your audio was automatically saved."
      );
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
    setInfoMessage("");

    if (
      !navigator.mediaDevices?.getUserMedia ||
      !window.MediaRecorder
    ) {
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
        setError(
          "Microphone access was denied. Check your browser permissions."
        );
      } else {
        setError(
          "We couldn't access your microphone. Please try again."
        );
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
    setInfoMessage("");
    setSelectedLens(null);
    setReflection("");
    setReflectionSaved(false);
    setStatus("idle");
  }

  function chooseLens(lensId) {
    setSelectedLens(lensId);
    setReflection("");
    setReflectionSaved(false);
  }

  function saveReflection() {
    if (reflection.trim()) {
      setReflectionSaved(true);
    }
  }

  async function exploreThinking() {
    if (!reflection.trim() || !activeLens) return;

    setAiLoading(true);
    setAiFeedback("");
    setAiError("");

    try {
      const response = await fetch("/api/reflect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          lens: activeLens.title,
          reflection: reflection.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setAiFeedback(data.feedback);
    } catch (error) {
      setAiError(
        error.message || "The AI companion is unavailable. Please try again."
      );
    } finally {
      setAiLoading(false);
    }
  }

  const activeLens = reflectionLenses.find(
    (lens) => lens.id === selectedLens
  );

  return (
    <section className="speaking-studio">
      <div className="speaking-heading">
        <div className="speaking-icon">
          <Mic size={21} />
        </div>

        <div>
          <span className="speaking-kicker">
            STEP 03 · SPEAK
          </span>

          <h2>Give your ideas a voice.</h2>

          <p>
            Use your notes to speak naturally. You don't need
            to read a script.
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
            className={`recording-indicator ${status === "recording" ? "is-recording" : ""
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

        <div
          className={`recording-timer ${status === "recording" &&
            TIME_LIMIT - seconds <= 10
            ? "near-limit"
            : ""
            }`}
        >
          {formatTime(seconds)}
          <span className="timer-limit">
            {" "}/ {formatTime(TIME_LIMIT)}
          </span>
        </div>

        {status === "idle" && (
          <>
            <button
              className="record-button"
              onClick={startRecording}
            >
              <Mic size={19} />
              Start recording
            </button>

            <p className="time-limit-notice">
              Maximum duration: {formatTime(TIME_LIMIT)}.
            </p>
          </>
        )}

        {status === "recording" && (
          <button
            className="record-button stop-button"
            onClick={stopRecording}
          >
            <Square size={17} />
            Stop recording
          </button>
        )}

        {status === "processing" && (
          <p className="recording-message">
            Please wait...
          </p>
        )}

        {status === "finished" && audioUrl && (
          <div className="audio-result">
            <div className="audio-result-heading">
              <CheckCircle2 size={18} />
              Your contribution is ready to listen to.
            </div>

            <audio controls src={audioUrl} />

            <button
              className="retry-button"
              onClick={recordAgain}
            >
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

      {status === "finished" && audioUrl && (
        <section className="reflection-section">
          <div className="reflection-heading">
            <span className="speaking-kicker">
              STEP 04 · REFLECT
            </span>

            <h3>Go further with your thinking.</h3>

            <p>
              Listen to your contribution. Choose one lens
              and think about what you could clarify,
              develop or reconsider.
            </p>
          </div>

          <div className="reflection-lenses">
            {reflectionLenses.map((lens) => {
              const Icon = lens.icon;

              return (
                <button
                  type="button"
                  key={lens.id}
                  className={`reflection-lens ${selectedLens === lens.id
                    ? "selected"
                    : ""
                    }`}
                  onClick={() => chooseLens(lens.id)}
                  aria-pressed={selectedLens === lens.id}
                >
                  <span className="reflection-lens-icon">
                    <Icon size={18} />
                  </span>

                  <span className="reflection-lens-copy">
                    <strong>{lens.title}</strong>
                    <small>{lens.description}</small>
                  </span>
                </button>
              );
            })}
          </div>

          {activeLens && (
            <div className="reflection-prompt-card">
              <span className="reflection-prompt-label">
                YOUR THINKING PROMPT
              </span>

              <p>{activeLens.prompt}</p>

              <small>{activeLens.routine}</small>

              <label className="reflection-field">
                <span>MY REFLECTION</span>

                <textarea
                  rows={4}
                  value={reflection}
                  onChange={(event) => {
                    setReflection(event.target.value);
                    setReflectionSaved(false);
                    setAiFeedback("");
                    setAiError("");
                  }}
                  placeholder="After listening to my contribution, I think..."
                />
              </label>

              <div className="reflection-actions">
                {reflectionSaved && (
                  <span className="reflection-saved">
                    <CheckCircle2 size={16} />
                    Reflection saved in this activity.
                  </span>
                )}

                <div className="reflection-buttons">
                  <button
                    type="button"
                    className="reflection-save-button"
                    onClick={saveReflection}
                    disabled={!reflection.trim()}
                  >
                    <Save size={16} />
                    Save reflection
                  </button>

                  <button
                    type="button"
                    className="ai-reflection-button"
                    onClick={exploreThinking}
                    disabled={!reflection.trim() || aiLoading}
                  >
                    <Sparkles size={16} />
                    {aiLoading ? "Thinking..." : "Explore my thinking"}
                  </button>
                </div>
              </div>

              {aiLoading && (
                <div className="ai-loading">
                  <Sparkles size={17} />
                  VOX is exploring your idea...
                </div>
              )}

              {aiFeedback && (
                <div className="ai-feedback">
                  <div className="ai-feedback-heading">
                    <Sparkles size={17} />
                    <strong>A question to take your thinking further</strong>
                  </div>

                  <p>{aiFeedback}</p>
                </div>
              )}

              {aiError && (
                <div className="ai-error">
                  <AlertCircle size={17} />
                  {aiError}
                </div>
              )}
            </div>
          )}

          <div className="reflection-footer">
            <Brain size={17} />

            <p>
              There are no scores here. The goal is to notice
              how your thinking develops and decide what
              you might try next.
            </p>
          </div>
        </section>
      )}

      <div className="speaking-privacy">
        <Headphones size={17} />

        <span>
          Your recording and reflection stay in this browser
          session. They are not uploaded to a server.
        </span>
      </div>
    </section>
  );
}

export default SpeakingStudio;