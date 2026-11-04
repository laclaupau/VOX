
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Brain,
  Check,
  ChevronRight,
  Globe2,
  Lightbulb,
  Mic2,
  Search,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import "./App.css";
import Workspace from "./Workspace";

const challenges = [
  {
    id: 1,
    area: "Literature",
    category: "Lengua y Literatura",
    title: "Can one story have many truths?",
    question:
      "¿Podemos interpretar las acciones de un personaje de maneras completamente diferentes?",
    description:
      "Volvé a una historia que hayas leído. Explorá las decisiones de un personaje y construí una interpretación propia.",
    level: "Interpretation",
    time: "5–8 min",
    color: "peach",
    icon: BookOpen,
    prompt: "What makes your interpretation convincing?",
  },
  {
    id: 2,
    area: "English",
    category: "English",
    title: "Who is responsible for misinformation?",
    question:
      "Should social media platforms be responsible for the information people share?",
    description:
      "Consider different points of view, build an argument and support your position with examples.",
    level: "Argumentation",
    time: "5–8 min",
    color: "lavender",
    icon: Lightbulb,
    prompt: "Can you think of a counterargument?",
  },
  {
    id: 3,
    area: "Global Perspectives",
    category: "Global Perspectives",
    title: "Growth or sustainability?",
    question:
      "Should governments prioritise economic growth over environmental protection?",
    description:
      "Explore the tension between economic development, environmental needs and social wellbeing.",
    level: "Multiple perspectives",
    time: "8–10 min",
    color: "mint",
    icon: Globe2,
    prompt: "Whose perspective might be missing?",
  },
];

const filters = ["All challenges", "Literature", "English", "Global Perspectives"];

function App() {
  const [activeFilter, setActiveFilter] = useState("All challenges");
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeWorkspace, setActiveWorkspace] = useState(null);

  const visibleChallenges = challenges.filter((challenge) => {
    const matchesFilter =
      activeFilter === "All challenges" ||
      challenge.area === activeFilter;

    const matchesSearch =
      challenge.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      challenge.description.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  function exploreChallenges() {
    document
      .getElementById("challenge-explorer")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="VOX home">
          <span className="brand-symbol">v.</span>
          <span className="brand-name">VOX</span>
        </a>

        <nav className="main-nav">
          <a className="nav-link active" href="#challenge-explorer">
            Explore
          </a>
          <a className="nav-link" href="#how-it-works">
            How it works
          </a>
          <a className="nav-link" href="#about">
            About VOX
          </a>
        </nav>

        <button className="profile-button" aria-label="Student profile">
          <span className="profile-avatar">S</span>
          <span>Student space</span>
        </button>
      </header>

      <main id="home">
        <section className="hero">
          <div className="hero-content">
            <div className="eyebrow">
              <Sparkles size={15} />
              <span>A LAB FOR IDEAS AND VOICES</span>
            </div>

            <h1>
              Don't just have
              <br />
              an idea. <span>Make it heard.</span>
            </h1>

            <p className="hero-description">
              Think deeper. Build your ideas. Find your voice.
              VOX is your space to explore questions, develop arguments
              and make your contribution count.
            </p>

            <button className="primary-button" onClick={exploreChallenges}>
              Explore challenges <ArrowRight size={18} />
            </button>

            <div className="hero-note">
              <span className="note-line" />
              <span>YOUR IDEAS DESERVE MORE THAN A YES OR NO.</span>
            </div>
          </div>

          <div className="hero-art" aria-label="Illustration of an idea in progress">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="art-sticker sticker-top">THINK!</div>
            <div className="art-sticker sticker-bottom">SAY IT YOUR WAY</div>

            <div className="idea-card">
              <span className="idea-label">AN IDEA IS...</span>
              <div className="idea-word">A starting<br />point<span>.</span></div>
              <div className="idea-underline" />
              <div className="idea-footer">
                <span>QUESTION</span>
                <ArrowUpRight size={18} />
              </div>
            </div>

            <div className="floating-dot dot-one" />
            <div className="floating-dot dot-two" />
            <div className="floating-dot dot-three" />
            <div className="floating-star">✳</div>
          </div>
        </section>

        <section className="process-strip" id="how-it-works">
          <div className="process-intro">
            <span className="section-kicker">THE VOX METHOD</span>
            <h2>From a first thought<br />to a stronger voice.</h2>
          </div>

          <div className="process-step">
            <span className="step-number">01</span>
            <Brain size={23} />
            <h3>Think</h3>
            <p>Explore the question and form an idea.</p>
          </div>

          <div className="process-step">
            <span className="step-number">02</span>
            <Lightbulb size={23} />
            <h3>Build</h3>
            <p>Develop your reasoning and examples.</p>
          </div>

          <div className="process-step">
            <span className="step-number">03</span>
            <Mic2 size={23} />
            <h3>Speak</h3>
            <p>Share your contribution and go further.</p>
          </div>
        </section>

        <section className="explorer-section" id="challenge-explorer">
          <div className="section-heading">
            <div>
              <span className="section-kicker">YOUR NEXT BIG QUESTION</span>
              <h2>Explore challenges<span>.</span></h2>
              <p>
                Choose a starting point. There is more than one way to think
                about every question.
              </p>
            </div>
            <div className="challenge-count">
              <span>{visibleChallenges.length.toString().padStart(2, "0")}</span>
              <small>CHALLENGES</small>
            </div>
          </div>

          <div className="explorer-controls">
            <div className="filter-list">
              {filters.map((filter) => (
                <button
                  key={filter}
                  className={`filter-button ${activeFilter === filter ? "selected" : ""
                    }`}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>

            <label className="search-box">
              <Search size={17} />
              <input
                type="search"
                placeholder="Find a challenge..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>
          </div>

          <div className="challenge-grid">
            {visibleChallenges.map((challenge) => {
              const Icon = challenge.icon;

              return (
                <article
                  className={`challenge-card ${challenge.color}`}
                  key={challenge.id}
                >
                  <div className="card-topline">
                    <span className="area-label">{challenge.category}</span>
                    <span className="card-icon">
                      <Icon size={21} />
                    </span>
                  </div>

                  <div className="card-content">
                    <span className="challenge-level">{challenge.level}</span>
                    <h3>{challenge.title}</h3>
                    <p>{challenge.description}</p>
                  </div>

                  <div className="card-footer">
                    <span className="time-label">{challenge.time}</span>
                    <button
                      className="card-action"
                      onClick={() => setSelectedChallenge(challenge)}
                      aria-label={`Explore ${challenge.title}`}
                    >
                      <ArrowUpRight size={20} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {visibleChallenges.length === 0 && (
            <div className="empty-state">
              <Search size={25} />
              <h3>No challenges found</h3>
              <p>Try another search or select a different area.</p>
              <button
                className="text-button"
                onClick={() => {
                  setSearchTerm("");
                  setActiveFilter("All challenges");
                }}
              >
                Clear filters
              </button>
            </div>
          )}
        </section>

        <section className="closing-banner" id="about">
          <div className="closing-icon">
            <Target size={27} />
          </div>
          <div>
            <span className="section-kicker">A SPACE TO GROW</span>
            <h2>Your voice gets stronger when your ideas go further.</h2>
          </div>
          <button className="closing-button" onClick={exploreChallenges}>
            Find your challenge <ChevronRight size={18} />
          </button>
        </section>
      </main>

      <footer className="footer">
        <a className="footer-brand" href="#home">VOX<span>.</span></a>
        <p>A laboratory for thinking, speaking and growing.</p>
        <span className="footer-credit">THINK IT. BUILD IT. SAY IT.</span>
      </footer>

      {activeWorkspace && (
        <Workspace
          challenge={activeWorkspace}
          onBack={() => setActiveWorkspace(null)}
        />
      )}

      {selectedChallenge && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedChallenge(null)}
        >
          <section
            className="challenge-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setSelectedChallenge(null)}
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <span className="section-kicker">
              YOUR CHALLENGE · {selectedChallenge.category}
            </span>
            <h2 id="modal-title">{selectedChallenge.title}</h2>
            <p className="modal-question">{selectedChallenge.question}</p>

            <div className="thinking-prompt">
              <span><Sparkles size={16} /> START THINKING</span>
              <p>{selectedChallenge.prompt}</p>
            </div>

            <div className="modal-steps">
              <span><Check size={15} /> Explore the question</span>
              <span><Check size={15} /> Build your ideas</span>
              <span><Mic2 size={15} /> Prepare to speak</span>
            </div>

            <button
              className="primary-button modal-button"
              onClick={() => {
                setActiveWorkspace(selectedChallenge);
                setSelectedChallenge(null);
              }}
            >
              Start challenge <ArrowRight size={18} />
            </button>
            <p className="modal-note">
              This is a preview. The guided activity will be developed in the
              next stages of VOX.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
