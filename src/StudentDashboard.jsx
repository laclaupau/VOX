import { useMemo, useState } from "react";
import { ArrowLeft, BookOpen, CalendarDays, Clock3, GraduationCap, Mic2, Sparkles, ClipboardList, ArrowRight, CheckCircle2 } from "lucide-react";
import Workspace from "./Workspace";
import "./StudentDashboard.css";

const readStore = (key) => {
  try { return JSON.parse(localStorage.getItem(key) || "[]"); }
  catch { return []; }
};

function toWorkspaceChallenge(challenge) {
  if (!challenge) return null;
  if (challenge.source === "teacher") {
    return {
      ...challenge,
      category: challenge.area || "VOX challenge",
      question: challenge.prompt || challenge.topic || challenge.title,
      description: challenge.description || `Explore ${challenge.topic || challenge.title} and develop your thinking.`,
      level: challenge.objective || "Interpretation",
      time: "5–8 min",
      color: "peach",
      prompt: challenge.prompt || "What makes your thinking convincing?",
    };
  }
  return challenge;
}

export default function StudentDashboard({ onBack, availableChallenges = [] }) {
  const [assignments] = useState(() => readStore("vox.teacher.assignments.v1"));
  const [courses] = useState(() => readStore("vox.teacher.courses.v1"));
  const [createdChallenges] = useState(() => readStore("vox.teacher.challenges.v1"));
  const [activeChallenge, setActiveChallenge] = useState(null);

  const assignedItems = useMemo(() => assignments.map((assignment) => {
    const challenge = [...availableChallenges, ...createdChallenges].find(
      (item) => String(item.id) === String(assignment.challengeId)
    );
    const course = courses.find((item) => String(item.id) === String(assignment.courseId));
    return { ...assignment, challenge: toWorkspaceChallenge(challenge), courseName: course?.name || assignment.courseName || "Your course" };
  }).filter((item) => item.challenge), [assignments, availableChallenges, createdChallenges, courses]);

  if (activeChallenge) {
    return <Workspace challenge={activeChallenge} onBack={() => setActiveChallenge(null)} />;
  }

  return <div className="student-shell">
    <header className="student-topbar">
      <a className="student-brand" href="#student-home"><span className="student-brand-mark">v.</span> VOX <span className="student-space-label">STUDENT SPACE</span></a>
      <button className="student-back" onClick={onBack}><ArrowLeft size={16}/> Explore VOX</button>
    </header>
    <main className="student-main" id="student-home">
      <section className="student-welcome">
        <div>
          <span className="student-kicker"><Sparkles size={14}/> YOUR IDEAS. YOUR VOICE.</span>
          <h1>Your learning<br/>space<span>.</span></h1>
          <p>Challenges assigned to your group, ready for you to explore, think and speak.</p>
        </div>
        <div className="student-welcome-mark"><Mic2 size={34}/><span>THINK IT.<br/>BUILD IT.<br/>SAY IT.</span></div>
      </section>

      <section className="student-summary">
        <div><strong>{assignedItems.length.toString().padStart(2,"0")}</strong><span>ASSIGNED CHALLENGES</span></div>
        <div><strong>{courses.length.toString().padStart(2,"0")}</strong><span>COURSES ON THIS DEVICE</span></div>
      </section>

      <section className="student-assignments">
        <div className="student-section-heading">
          <div><span className="student-kicker">YOUR NEXT STEPS</span><h2>Assigned to you<span>.</span></h2><p>Choose a challenge and start building your response.</p></div>
          <ClipboardList size={26}/>
        </div>
        {assignedItems.length === 0 ? <div className="student-empty">
          <div className="student-empty-icon"><BookOpen size={25}/></div>
          <h3>No assignments yet</h3>
          <p>When your teacher assigns a VOX challenge to your course, it will appear here.</p>
          <button onClick={onBack}>Explore available challenges <ArrowRight size={16}/></button>
        </div> : <div className="student-assignment-grid">
          {assignedItems.map((item) => <article className="student-assignment-card" key={item.id}>
            <div className="student-card-meta"><span><GraduationCap size={14}/> {item.courseName}</span><span><CalendarDays size={14}/> {item.dueDate ? new Date(`${item.dueDate}T12:00:00`).toLocaleDateString() : "No due date"}</span></div>
            <span className="student-card-kicker">{item.challenge.category || item.challenge.area || "VOX CHALLENGE"}</span>
            <h3>{item.challenge.title}</h3>
            <p className="student-card-question">{item.challenge.question || item.challenge.prompt}</p>
            {item.instructions && <p className="student-card-instructions"><strong>Teacher's instructions:</strong> {item.instructions}</p>}
            <div className="student-card-footer"><span><Clock3 size={14}/> {item.challenge.time || "5–8 min"}</span><button onClick={() => setActiveChallenge(item.challenge)}>Start challenge <ArrowRight size={16}/></button></div>
          </article>)}
        </div>}
      </section>
      <footer className="student-storage-note"><CheckCircle2 size={15}/> Your assignments are shown from the courses stored in this browser. Individual student accounts and shared access come in a later stage.</footer>
    </main>
  </div>;
}
