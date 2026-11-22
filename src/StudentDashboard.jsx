import { useMemo, useState } from "react";
import { ArrowLeft, BookOpen, CalendarDays, Clock3, GraduationCap, Mic2, Sparkles, ClipboardList, ArrowRight, CheckCircle2, CircleDot } from "lucide-react";
import Workspace from "./Workspace";
import "./StudentDashboard.css";

const PROGRESS_KEY = "vox.student.progress.v1";
const readStore = (key) => { try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; } };
const makeId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const saveProgress = (items) => localStorage.setItem(PROGRESS_KEY, JSON.stringify(items));

function toWorkspaceChallenge(challenge) {
  if (!challenge) return null;
  if (challenge.source === "teacher") return {
    ...challenge,
    category: challenge.area || "VOX challenge",
    question: challenge.prompt || challenge.topic || challenge.title,
    description: challenge.description || `Explore ${challenge.topic || challenge.title} and develop your thinking.`,
    level: challenge.objective || "Interpretation",
    time: "5–8 min",
    color: "peach",
    prompt: challenge.prompt || "What makes your thinking convincing?",
  };
  return challenge;
}

export default function StudentDashboard({ onBack, availableChallenges = [] }) {
  const [assignments] = useState(() => readStore("vox.teacher.assignments.v1"));
  const [courses] = useState(() => readStore("vox.teacher.courses.v1"));
  const [createdChallenges] = useState(() => readStore("vox.teacher.challenges.v1"));
  const [progress, setProgress] = useState(() => readStore(PROGRESS_KEY));
  const [activeSession, setActiveSession] = useState(null);

  const assignedItems = useMemo(() => assignments.map((assignment) => {
    const challenge = [...availableChallenges, ...createdChallenges].find(item => String(item.id) === String(assignment.challengeId));
    const course = courses.find(item => String(item.id) === String(assignment.courseId));
    const challengeProgress = progress.filter(item => item.assignmentId === assignment.id);
    return {
      ...assignment,
      challenge: toWorkspaceChallenge(challenge),
      courseName: course?.name || assignment.courseName || "Your course",
      attempts: challengeProgress.length,
      completions: challengeProgress.filter(item => item.status === "completed").length,
      latestStatus: challengeProgress.length ? challengeProgress[challengeProgress.length - 1].status : "not-started",
    };
  }).filter(item => item.challenge), [assignments, availableChallenges, createdChallenges, courses, progress]);

  function startAssignment(item) {
    const previousAttempts = progress.filter(p => p.assignmentId === item.id).length;
    const session = {
      id: makeId(),
      assignmentId: item.id,
      challengeId: item.challenge.id,
      challengeTitle: item.challenge.title,
      courseId: item.courseId,
      courseName: item.courseName,
      startedAt: new Date().toISOString(),
      completedAt: null,
      status: "started",
      attemptNumber: previousAttempts + 1,
    };
    const next = [...progress, session];
    saveProgress(next);
    setProgress(next);
    setActiveSession({ ...session, challenge: item.challenge });
  }

  function completeSession(thinking) {
    if (!activeSession) return;
    const next = progress.map(item => item.id === activeSession.id
      ? { ...item, status: "completed", completedAt: new Date().toISOString(), thinking }
      : item
    );
    saveProgress(next);
    setProgress(next);
    setActiveSession(null);
  }

  if (activeSession) {
    return <Workspace
      challenge={activeSession.challenge}
      onBack={() => setActiveSession(null)}
      onComplete={completeSession}
    />;
  }

  return <div className="student-shell">
    <header className="student-topbar">
      <a className="student-brand" href="#student-home"><span className="student-brand-mark">v.</span> VOX <span className="student-space-label">STUDENT SPACE</span></a>
      <button className="student-back" onClick={onBack}><ArrowLeft size={16}/> Explore VOX</button>
    </header>
    <main className="student-main" id="student-home">
      <section className="student-welcome">
        <div><span className="student-kicker"><Sparkles size={14}/> YOUR IDEAS. YOUR VOICE.</span><h1>Your learning<br/>space<span>.</span></h1><p>Challenges assigned to your group, ready for you to explore, think and speak.</p></div>
        <div className="student-welcome-mark"><Mic2 size={34}/><span>THINK IT.<br/>BUILD IT.<br/>SAY IT.</span></div>
      </section>

      <section className="student-summary">
        <div><strong>{assignedItems.length.toString().padStart(2,"0")}</strong><span>ASSIGNED CHALLENGES</span></div>
        <div><strong>{progress.filter(item => item.status === "completed").length.toString().padStart(2,"0")}</strong><span>COMPLETED ACTIVITIES</span></div>
      </section>

      <section className="student-assignments">
        <div className="student-section-heading"><div><span className="student-kicker">YOUR NEXT STEPS</span><h2>Assigned to you<span>.</span></h2><p>Choose a challenge and continue building your response.</p></div><ClipboardList size={26}/></div>
        {assignedItems.length === 0 ? <div className="student-empty"><div className="student-empty-icon"><BookOpen size={25}/></div><h3>No assignments yet</h3><p>When your teacher assigns a VOX challenge to your course, it will appear here.</p><button onClick={onBack}>Explore available challenges <ArrowRight size={16}/></button></div> :
          <div className="student-assignment-grid">
            {assignedItems.map(item => <article className="student-assignment-card" key={item.id}>
              <div className="student-card-meta"><span><GraduationCap size={14}/> {item.courseName}</span><span><CalendarDays size={14}/> {item.dueDate ? new Date(`${item.dueDate}T12:00:00`).toLocaleDateString() : "No due date"}</span></div>
              <span className="student-card-kicker">{item.challenge.category || item.challenge.area || "VOX CHALLENGE"}</span>
              <h3>{item.challenge.title}</h3>
              <p className="student-card-question">{item.challenge.question || item.challenge.prompt}</p>
              {item.instructions && <p className="student-card-instructions"><strong>Teacher's instructions:</strong> {item.instructions}</p>}
              <div className="student-progress-line">
                <span><CircleDot size={14}/> {item.attempts} {item.attempts === 1 ? "attempt" : "attempts"} · {item.completions} completed</span>
                <span className={`student-status ${item.latestStatus}`}>{item.latestStatus === "completed" ? "Completed" : item.latestStatus === "started" ? "In progress" : "Not started"}</span>
              </div>
              <div className="student-card-footer"><span><Clock3 size={14}/> {item.challenge.time || "5–8 min"}</span><button onClick={() => startAssignment(item)}>{item.latestStatus === "started" ? "Try again" : item.completions ? "Try again" : "Start challenge"} <ArrowRight size={16}/></button></div>
            </article>)}
          </div>}
      </section>
      <footer className="student-storage-note"><CheckCircle2 size={15}/> Progress is stored in this browser. Attempts and written thinking are visible in Teacher Space on this device; individual student accounts and cloud synchronisation are a later stage.</footer>
    </main>
  </div>;
}
