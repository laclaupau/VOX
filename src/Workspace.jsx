
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Lightbulb,
  MessageCircle,
  Sparkles,
  Target,
} from "lucide-react";
import SpeakingStudio from "./SpeakingStudio";
import "./Workspace.css";


const stages = [
  { id: "think", label: "Think", number: "01" },
  { id: "build", label: "Build", number: "02" },
  { id: "ready", label: "Ready to speak", number: "03" },
];

function Workspace({ challenge, onBack }) {
  const [stage, setStage] = useState("think");
  const [initialIdea, setInitialIdea] = useState("");
  const [reason, setReason] = useState("");
  const [example, setExample] = useState("");
  const [otherPerspective, setOtherPerspective] = useState("");

  const currentStageIndex = stages.findIndex(
    (item) => item.id === stage
  );

  const completedFields = [
    initialIdea,
    reason,
    example,
    otherPerspective,
  ].filter((value) => value.trim().length > 0).length;

  function goToNextStage() {
    if (stage === "think") {
      setStage("build");
    } else if (stage === "build") {
      setStage("ready");
    }
  }

  function goToPreviousStage() {
    if (stage === "build") {
      setStage("think");
    } else if (stage === "ready") {
      setStage("build");
    }
  }

  return (
    <div className="workspace-overlay">
      <header className="workspace-topbar">
        <button className="workspace-back" onClick={onBack}>
          <ArrowLeft size={17} />
          <span>Back to challenges</span>
        </button>

        <div className="workspace-brand">
          <span className="workspace-brand-symbol">v.</span>
          <span>VOX</span>
        </div>

        <span className="workspace-progress-label">
          YOUR THINKING SPACE
        </span>
      </header>

      <main className="workspace-main">
        <aside className="workspace-sidebar">
          <span className="workspace-kicker">YOUR JOURNEY</span>

          <div className="workspace-stage-list">
            {stages.map((item, index) => {
              const isActive = item.id === stage;
              const isComplete = index < currentStageIndex;

              return (
                <div
                  className={`workspace-stage ${
                    isActive ? "active" : ""
                  } ${isComplete ? "complete" : ""}`}
                  key={item.id}
                >
                  <span className="workspace-stage-number">
                    {isComplete ? <Check size={15} /> : item.number}
                  </span>
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>

          <div className="workspace-sidebar-note">
            <Sparkles size={18} />
            <p>
              There is no single right way to think. Explore your own
              ideas before deciding what to say.
            </p>
          </div>
        </aside>

        <section className="workspace-content">
          <div className="workspace-challenge-label">
            <BookOpen size={15} />
            {challenge.category}
          </div>

          <div className="workspace-title-row">
            <div>
              <span className="workspace-kicker">
                {stage === "think"
                  ? "STEP 01 · EXPLORE"
                  : stage === "build"
                    ? "STEP 02 · DEVELOP"
                    : "STEP 03 · GET READY"}
              </span>

              <h1>
                {stage === "think"
                  ? "Start with a thought."
                  : stage === "build"
                    ? "Take your idea further."
                    : "Your ideas are taking shape."}
              </h1>
            </div>

            <span className="workspace-step-count">
              {currentStageIndex + 1} / 3
            </span>
          </div>

          <div className="workspace-question-card">
            <span>THE CHALLENGE</span>
            <h2>{challenge.question}</h2>
          </div>

          {stage === "think" && (
            <div className="workspace-form">
              <div className="workspace-instruction">
                <div className="workspace-instruction-icon">
                  <Lightbulb size={20} />
                </div>
                <div>
                  <h3>What's your first reaction?</h3>
                  <p>
                    Don't worry about having the perfect answer.
                    Start with what you think right now.
                  </p>
                </div>
              </div>

              <label className="workspace-field">
                <span>MY INITIAL IDEA</span>
                <textarea
                  value={initialIdea}
                  onChange={(event) => setInitialIdea(event.target.value)}
                  placeholder="I think that..."
                  rows={4}
                />
              </label>

              <div className="workspace-hint">
                <Sparkles size={15} />
                <span>
                  Try to express your own position, even if you are not
                  completely sure yet.
                </span>
              </div>
            </div>
          )}

          {stage === "build" && (
            <div className="workspace-form">
              <div className="workspace-instruction">
                <div className="workspace-instruction-icon">
                  <Target size={20} />
                </div>
                <div>
                  <h3>Let's give your idea some strength.</h3>
                  <p>
                    Strong contributions explain, illustrate and
                    consider different points of view.
                  </p>
                </div>
              </div>

              <label className="workspace-field">
                <span>01 · DEVELOP YOUR REASONING</span>
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="I think this because..."
                  rows={3}
                />
              </label>

              <label className="workspace-field">
                <span>02 · ADD AN EXAMPLE OR EVIDENCE</span>
                <textarea
                  value={example}
                  onChange={(event) => setExample(event.target.value)}
                  placeholder="For example..."
                  rows={3}
                />
              </label>

              <label className="workspace-field">
                <span>03 · CONSIDER ANOTHER PERSPECTIVE</span>
                <textarea
                  value={otherPerspective}
                  onChange={(event) =>
                    setOtherPerspective(event.target.value)
                  }
                  placeholder="However, someone might argue that..."
                  rows={3}
                />
              </label>

              <div className="workspace-hint">
                <MessageCircle size={15} />
                <span>
                  You don't need to agree with every perspective.
                  Understanding it can make your own argument stronger.
                </span>
              </div>
            </div>
          )}

          {stage === "ready" && (
            <div className="workspace-form">
              <div className="workspace-instruction">
                <div className="workspace-instruction-icon">
                  <Check size={20} />
                </div>
                <div>
                  <h3>Look at what you've developed.</h3>
                  <p>
                    These notes are your thinking support. Use them
                    to speak naturally, not to read a script.
                  </p>
                </div>
              </div>

              <div className="thinking-summary">
                <div className="summary-item">
                  <span>MY INITIAL IDEA</span>
                  <p>{initialIdea || "No idea added yet."}</p>
                </div>

                <div className="summary-item">
                  <span>MY REASONING</span>
                  <p>{reason || "No reasoning added yet."}</p>
                </div>

                <div className="summary-item">
                  <span>MY EXAMPLE</span>
                  <p>{example || "No example added yet."}</p>
                </div>

                <div className="summary-item">
                  <span>ANOTHER PERSPECTIVE</span>
                  <p>
                    {otherPerspective || "No alternative perspective added yet."}
                  </p>
                </div>
              </div>

              <SpeakingStudio question={challenge.question} />
            </div>
          )}

          <div className="workspace-navigation">
            {stage !== "think" ? (
              <button
                className="workspace-previous"
                onClick={goToPreviousStage}
              >
                <ArrowLeft size={17} />
                Previous
              </button>
            ) : (
              <span className="workspace-saved-note">
                <Check size={14} /> Your notes stay here while you work.
              </span>
            )}

            {stage !== "ready" ? (
              <button
                className="workspace-next"
                onClick={goToNextStage}
              >
                Continue <ArrowRight size={17} />
              </button>
            ) : (
              <button className="workspace-next" onClick={onBack}>
                Back to challenges <ArrowRight size={17} />
              </button>
            )}
          </div>

          <div className="workspace-footer">
            <span>{completedFields} / 4 thinking elements explored</span>
            <span>VOX · THINK IT. BUILD IT. SAY IT.</span>
          </div>
        </section>
      </main>
    </div>
  );
}

function Mic2Icon() {
  return <MessageCircle size={15} />;
}

export default Workspace;
