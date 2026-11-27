
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
import TeacherDashboard from "./TeacherDashboard";
import StudentDashboard from "./StudentDashboard";

const challenges = [
  {
    id: 1,
    area: "Literature",
    category: "Literature",
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

  {
    id: 4, area: "Literature", category: "Literature", title: "What is left unsaid?",
    question: "Choose a moment in a story when a character does not say what they really think or feel. What might the silence reveal?",
    description: "Interpret a silence, gesture or omission and support your reading with details from the story.", level: "Interpretation", time: "5–8 min", color: "peach", icon: BookOpen,
    prompt: "What detail in the story supports your interpretation?", thinkingActivators: ["Clarify", "Develop"]
  },
  {
    id: 5, area: "Literature", category: "Literature", title: "A character's turning point",
    question: "Identify a decision that changes a character's path. Was it inevitable, or could the character have chosen differently? Explain your interpretation.",
    description: "Explore a character's decision, alternatives and consequences, using specific moments from the text.", level: "Interpretation and reasoning", time: "5–8 min", color: "peach", icon: BookOpen,
    prompt: "What in the text makes you think another choice was possible?", thinkingActivators: ["Develop", "Challenge"]
  },
  {
    id: 6, area: "Literature", category: "Literature", title: "Who tells the story—and who doesn't?",
    question: "How would the meaning of a story change if it were told by another character, or by someone who is absent from the story?",
    description: "Explore how perspective shapes what readers know, notice and interpret.", level: "Perspective", time: "5–8 min", color: "peach", icon: BookOpen,
    prompt: "What might the alternative narrator notice or interpret differently?", thinkingActivators: ["Connect", "Challenge"]
  },
  {
    id: 7, area: "Literature", category: "Literature", title: "The object that means more",
    question: "Choose an object, image or repeated detail in a literary text. What meaning might it acquire beyond its literal role?",
    description: "Develop a symbolic interpretation and connect it to events, characters or themes in the text.", level: "Inference", time: "5–8 min", color: "peach", icon: BookOpen,
    prompt: "Which moments in the text help the object acquire this meaning?", thinkingActivators: ["Clarify", "Connect"]
  },
  {
    id: 8, area: "English", category: "English", title: "Is convenience always worth it?",
    question: "Think of a technology or service that makes everyday life easier. What might we lose when we rely on it too much?",
    description: "Weigh benefits and drawbacks and develop a position with examples.", level: "Argumentation", time: "5–8 min", color: "lavender", icon: Lightbulb,
    prompt: "Can you identify a situation in which the opposite could be true?", thinkingActivators: ["Develop", "Challenge"]
  },
  {
    id: 9, area: "English", category: "English", title: "Should mistakes be public?",
    question: "When people learn something new, should they be encouraged to make mistakes publicly or practise privately first? Why?",
    description: "Consider different learning contexts and support your position with examples or reasoning.", level: "Argumentation", time: "5–8 min", color: "lavender", icon: Lightbulb,
    prompt: "Whose experience might lead to a different answer?", thinkingActivators: ["Connect", "Challenge"]
  },
  {
    id: 10, area: "English", category: "English", title: "What makes an apology meaningful?",
    question: "Is saying 'I'm sorry' enough to repair harm? What else might be necessary, and does it depend on the situation?",
    description: "Explore responsibility, intentions, actions and consequences through a reasoned response.", level: "Explanation and argumentation", time: "5–8 min", color: "lavender", icon: Lightbulb,
    prompt: "What would count as evidence that the apology has led to change?", thinkingActivators: ["Clarify", "Develop"]
  },
  {
    id: 11, area: "English", category: "English", title: "One rule, different realities",
    question: "Imagine a rule applied equally to everyone. Could it still be unfair to some people? Explain using a concrete example.",
    description: "Distinguish equality from fairness and explore how context can change the impact of a rule.", level: "Multiple perspectives", time: "5–8 min", color: "lavender", icon: Lightbulb,
    prompt: "What contextual factor could change how fair the rule is?", thinkingActivators: ["Connect", "Challenge"]
  },
  {
    id: 12, area: "Global Perspectives", category: "Global Perspectives", title: "Who should decide what is progress?",
    question: "When a community changes in the name of progress, whose priorities should guide the decision?",
    description: "Explore stakeholder perspectives and develop a position that acknowledges competing needs.", level: "Multiple perspectives", time: "8–10 min", color: "mint", icon: Globe2,
    prompt: "Which stakeholder's perspective have you not considered yet?", thinkingActivators: ["Connect", "Challenge"]
  },
  {
    id: 13, area: "Global Perspectives", category: "Global Perspectives", title: "Can individual choices solve collective problems?",
    question: "Choose a shared problem. How much can individual actions change it, and what requires collective or institutional action?",
    description: "Consider different scales of action and explain how they might interact.", level: "Reasoning", time: "8–10 min", color: "mint", icon: Globe2,
    prompt: "How might individual and collective actions reinforce one another?", thinkingActivators: ["Develop", "Connect"]
  },
  {
    id: 14, area: "Global Perspectives", category: "Global Perspectives", title: "What makes information trustworthy?",
    question: "When two sources disagree about an issue, how would you decide which claims are more trustworthy?",
    description: "Develop criteria for evaluating claims and explain how you would use them.", level: "Critical thinking", time: "8–10 min", color: "mint", icon: Globe2,
    prompt: "What evidence would make you reconsider your judgement about a source?", thinkingActivators: ["Clarify", "Challenge"]
  },
  {
    id: 15, area: "Global Perspectives", category: "Global Perspectives", title: "The unintended consequence",
    question: "Think of a solution to a social or environmental problem. What unintended consequence could it produce, and how might that affect your decision?",
    description: "Explore consequences beyond the immediate outcome and revise or qualify a proposed solution.", level: "Consequences and revision", time: "8–10 min", color: "mint", icon: Globe2,
    prompt: "Could a different perspective reveal another unintended consequence?", thinkingActivators: ["Develop", "Challenge"]
  },
  {
    id: 16, area: "Literature", category: "Literature", title: "Would you defend this character?",
    question: "Choose a character whose actions are questionable. Under what circumstances, if any, could you defend their choices?",
    description: "Build a nuanced interpretation by considering context, consequences and evidence from the text.", level: "Argumentation and interpretation", time: "5–8 min", color: "peach", icon: BookOpen,
    prompt: "What evidence complicates or weakens your defence?", thinkingActivators: ["Develop", "Challenge"]
  },

];

const filters = ["All challenges", "Literature", "English", "Global Perspectives"];

function App() {
  const [activeFilter, setActiveFilter] = useState("All challenges");
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [showTeacher, setShowTeacher] = useState(false);
  const [showStudent, setShowStudent] = useState(false);

  if (showStudent) return (
    <StudentDashboard
      onBack={() => setShowStudent(false)}
      availableChallenges={challenges.map((challenge) => ({
        ...challenge,
        id: `library-${challenge.id}`,
        source: "VOX library",
      }))}
    />
  );

  if (showTeacher) return (
    <TeacherDashboard
      onBack={() => setShowTeacher(false)}
      availableChallenges={challenges.map((challenge) => ({
        ...challenge,
        id: `library-${challenge.id}`,
        source: "VOX library",
      }))}
    />
  );

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

        <div className="profile-actions" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button className="profile-button student-profile-button" aria-label="Open student space" onClick={() => setShowStudent(true)}>
            <span className="profile-avatar">S</span>
            <span>Student space</span>
          </button>
          <button className="profile-button" aria-label="Open teacher space" onClick={() => setShowTeacher(true)}>
            <span className="profile-avatar">T</span>
            <span>Teacher space</span>
          </button>
        </div>
      </header>

      <main id="home">
        <section className="hero">
          <div className="hero-content">
            <div className="eyebrow">
              <Sparkles size={15} />
              <span>A LAB FOR IDEAS AND VOICES</span>
            </div>

            <h1>
              Make thinking
              <br />
              visible. <span>Enter the conversation.</span>
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
