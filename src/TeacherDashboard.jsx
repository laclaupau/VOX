import { useMemo, useState } from "react";
import { ArrowLeft, BookOpen, CalendarDays, GraduationCap, Plus, Trash2, Save, Sparkles, Pencil, X, Users } from "lucide-react";
import "./TeacherDashboard.css";

const AREAS = ["Language & Literature", "Social Sciences", "History", "Ethics", "Citizenship", "Global Perspectives", "Natural Sciences", "Geography", "Philosophy", "Art", "Other"];
const CEFR = ["A1", "A2", "A2+", "B1", "B1+", "B2", "B2+", "C1"];
const CONTENT_TYPES = ["Story", "Article", "News report", "Problem / Issue"];
const OBJECTIVES = ["Interpret", "Argue", "Compare perspectives", "Evaluate evidence", "Explain", "Reflect", "Create connections"];
const ROUTES = ["Explore", "Interpret", "Investigate", "Debate"];
const ACTIVATORS = ["Clarify", "Develop", "Connect", "Challenge"];
const CHALLENGES_KEY = "vox.teacher.challenges.v1";
const COURSES_KEY = "vox.teacher.courses.v1";
const ASSIGNMENTS_KEY = "vox.teacher.assignments.v1";
const PROGRESS_KEY = "vox.student.progress.v1";
const emptyForm = { title: "", area: "History", language: "English", cefrLevel: "B1", contentType: "Article", topic: "", objective: "Interpret", route: "Investigate", activators: ["Connect"], prompt: "", description: "" };
const readStore = (key) => { try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; } };
const makeId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function TeacherDashboard({ onBack, availableChallenges = [] }) {
  const [challenges, setChallenges] = useState(() => readStore(CHALLENGES_KEY));
  const [courses, setCourses] = useState(() => readStore(COURSES_KEY));
  const [assignments, setAssignments] = useState(() => readStore(ASSIGNMENTS_KEY));
  const [progress] = useState(() => readStore(PROGRESS_KEY));
  const assignmentChallenges = [...availableChallenges, ...challenges];
  const [form, setForm] = useState(emptyForm);
  const [courseForm, setCourseForm] = useState({ name: "", level: "", description: "" });
  const [editingCourse, setEditingCourse] = useState(null);
  const [assignmentForm, setAssignmentForm] = useState({ challengeId: "", courseId: "", dueDate: "", instructions: "" });
  const [activeTab, setActiveTab] = useState("challenges");
  const [saved, setSaved] = useState(false);
  const isEnglish = form.language === "English";
  const update = (key, value) => { setForm(current => ({ ...current, [key]: value })); setSaved(false); };
  const canSave = Boolean(form.title.trim() && form.topic.trim() && form.prompt.trim() && form.activators.length);
  const countLabel = useMemo(() => `${challenges.length} ${challenges.length === 1 ? "challenge created" : "challenges created"}`, [challenges.length]);
  const persist = (key, value, setter) => { setter(value); localStorage.setItem(key, JSON.stringify(value)); };

  function saveChallenge(event) {
    event.preventDefault();
    if (!canSave) return;
    const challenge = { ...form, cefrLevel: isEnglish ? form.cefrLevel : null, activators: [...form.activators], id: makeId(), createdAt: new Date().toISOString(), source: "teacher" };
    persist(CHALLENGES_KEY, [challenge, ...challenges], setChallenges);
    setForm(emptyForm); setSaved(true);
  }
  function removeChallenge(id) {
    if (assignments.some(item => String(item.challengeId) === String(id))) { window.alert("This challenge is assigned to a course. Remove its assignments first."); return; }
    persist(CHALLENGES_KEY, challenges.filter(item => item.id !== id), setChallenges);
  }
  function toggleActivator(value) { update("activators", form.activators.includes(value) ? form.activators.filter(item => item !== value) : [...form.activators, value]); }

  function saveCourse(event) {
    event.preventDefault();
    if (!courseForm.name.trim()) return;
    if (editingCourse) {
      const next = courses.map(course => course.id === editingCourse ? { ...course, ...courseForm } : course);
      persist(COURSES_KEY, next, setCourses);
    } else {
      persist(COURSES_KEY, [{ ...courseForm, id: makeId(), createdAt: new Date().toISOString() }, ...courses], setCourses);
    }
    setCourseForm({ name: "", level: "", description: "" }); setEditingCourse(null);
  }
  function startEditCourse(course) { setEditingCourse(course.id); setCourseForm({ name: course.name, level: course.level || "", description: course.description || "" }); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function removeCourse(id) {
    if (assignments.some(item => item.courseId === id)) { window.alert("This course has assignments. Remove its assignments first."); return; }
    persist(COURSES_KEY, courses.filter(course => course.id !== id), setCourses);
  }
  function saveAssignment(event) {
    event.preventDefault();
    if (!assignmentForm.challengeId || !assignmentForm.courseId) return;
    const challenge = assignmentChallenges.find(item => String(item.id) === String(assignmentForm.challengeId));
    const course = courses.find(item => item.id === assignmentForm.courseId);
    persist(ASSIGNMENTS_KEY, [{ ...assignmentForm, id: makeId(), challengeTitle: challenge?.title || "Challenge", courseName: course?.name || "Course", createdAt: new Date().toISOString() }, ...assignments], setAssignments);
    setAssignmentForm({ challengeId: "", courseId: "", dueDate: "", instructions: "" });
  }
  function removeAssignment(id) { persist(ASSIGNMENTS_KEY, assignments.filter(item => item.id !== id), setAssignments); }

  return <div className="teacher-shell">
    <header className="teacher-topbar"><a className="teacher-brand" href="#teacher-top"><span className="teacher-brand-mark">v.</span> VOX <span className="teacher-space-label">TEACHER SPACE</span></a><button className="teacher-back" onClick={onBack}><ArrowLeft size={16}/> Student space</button></header>
    <main className="teacher-main" id="teacher-top">
      <div className="teacher-heading"><div><span className="teacher-kicker"><Sparkles size={14}/> DESIGN LEARNING EXPERIENCES</span><h1>Teacher space<span>.</span></h1><p>Create challenges, organise your groups and plan learning experiences.</p></div><div className="teacher-stat"><strong>{String(challenges.length).padStart(2,"0")}</strong><span>MY CHALLENGES</span></div></div>
      <nav className="teacher-tabs" aria-label="Teacher workspace sections">
        <button className={activeTab === "challenges" ? "active" : ""} onClick={() => setActiveTab("challenges")}><BookOpen size={16}/> Challenges</button>
        <button className={activeTab === "courses" ? "active" : ""} onClick={() => setActiveTab("courses")}><Users size={16}/> My courses <span>{courses.length}</span></button>
        <button className={activeTab === "assignments" ? "active" : ""} onClick={() => setActiveTab("assignments")}><CalendarDays size={16}/> Assignments <span>{assignments.length}</span></button>
        <button className={activeTab === "progress" ? "active" : ""} onClick={() => setActiveTab("progress")}><Sparkles size={16}/> Student progress <span>{progress.filter(item => item.status === "completed").length}</span></button>
      </nav>

      {activeTab === "challenges" && <>
        <div className="teacher-layout">
          <form className="challenge-form" onSubmit={saveChallenge}>
            <div className="form-section-title"><span>01</span><div><h2>Challenge identity</h2><p>Start with the subject, language and material.</p></div></div>
            <label className="teacher-field"><span>Challenge title *</span><input value={form.title} onChange={e=>update("title",e.target.value)} placeholder="e.g. Who benefits from industrialisation?" required /></label>
            <div className="teacher-form-grid">
              <label className="teacher-field"><span>Curricular area *</span><select value={form.area} onChange={e=>update("area",e.target.value)}>{AREAS.map(x=><option key={x}>{x}</option>)}</select></label>
              <label className="teacher-field"><span>Challenge language *</span><select value={form.language} onChange={e=>{const language=e.target.value;setForm(c=>({...c,language,cefrLevel:language==="English"?(c.cefrLevel||"B1"):null}));setSaved(false);}}><option>English</option><option>Spanish</option></select></label>
            </div>
            {isEnglish && <label className="teacher-field cefr-field"><span>CEFR level *</span><select value={form.cefrLevel || "B1"} onChange={e=>update("cefrLevel",e.target.value)}>{CEFR.map(x=><option key={x} value={x}>{x}</option>)}</select><small>Choose the language level expected of the target students. This is independent of the curricular area.</small></label>}
            <div className="teacher-form-grid"><label className="teacher-field"><span>Content type *</span><select value={form.contentType} onChange={e=>update("contentType",e.target.value)}>{CONTENT_TYPES.map(x=><option key={x}>{x}</option>)}</select></label><label className="teacher-field"><span>Topic / source material *</span><input value={form.topic} onChange={e=>update("topic",e.target.value)} placeholder="Text, article, issue or topic" required /></label></div>
            <div className="form-section-title form-section-spaced"><span>02</span><div><h2>Learning design</h2><p>Define what students will do with their thinking.</p></div></div>
            <label className="teacher-field"><span>Learning objective *</span><select value={form.objective} onChange={e=>update("objective",e.target.value)}>{OBJECTIVES.map(x=><option key={x}>{x}</option>)}</select></label>
            <label className="teacher-field"><span>Inquiry route *</span><select value={form.route} onChange={e=>update("route",e.target.value)}>{ROUTES.map(x=><option key={x}>{x}</option>)}</select></label>
            <fieldset className="teacher-field activator-field"><legend>Thinking activators *</legend><div className="activator-options">{ACTIVATORS.map(x=><label key={x} className={form.activators.includes(x)?"activator-chip active":"activator-chip"}><input type="checkbox" checked={form.activators.includes(x)} onChange={()=>toggleActivator(x)}/>{x}</label>)}</div></fieldset>
            <div className="form-section-title form-section-spaced"><span>03</span><div><h2>Student invitation</h2><p>Give students a meaningful starting point.</p></div></div>
            <label className="teacher-field"><span>Challenge prompt *</span><textarea rows="3" value={form.prompt} onChange={e=>update("prompt",e.target.value)} placeholder="What question will students respond to?" required /></label>
            <label className="teacher-field"><span>Additional context <em>Optional</em></span><textarea rows="3" value={form.description} onChange={e=>update("description",e.target.value)} placeholder="Add background, instructions or materials..." /></label>
            <div className="teacher-form-footer"><span>* Required fields</span><button className="teacher-save" type="submit" disabled={!canSave}><Save size={16}/> Save challenge</button></div>
            {saved && <p className="teacher-success" role="status">Challenge saved in this browser.</p>}
          </form>
          <aside className="teacher-side"><div className="preview-card"><span className="preview-kicker"><BookOpen size={15}/> LIVE DESIGN SUMMARY</span><h3>{form.title || "Your challenge title"}</h3><p>{form.area} · {form.language}{isEnglish ? ` · ${form.cefrLevel}` : ""}</p><div className="preview-divider"/><span className="preview-label">CONTENT</span><strong>{form.contentType}</strong><span className="preview-label">INQUIRY ROUTE</span><strong>{form.route}</strong><span className="preview-label">THINKING ACTIVATORS</span><div className="preview-tags">{form.activators.length ? form.activators.map(x=><span key={x}>{x}</span>) : <small>Select at least one</small>}</div></div><div className="teacher-note"><strong>Design principle</strong><p>Curricular area and challenge language are independent. CEFR is required only when the challenge language is English.</p></div></aside>
        </div>
        <section className="teacher-library"><div className="library-heading"><div><span className="teacher-kicker">YOUR WORKSPACE</span><h2>My challenges</h2><p>{countLabel} · saved locally in this browser for now.</p></div></div>
          {challenges.length===0 ? <div className="teacher-empty">Your created challenges will appear here after you save them.</div> : <div className="teacher-challenge-list">{challenges.map(item=><article className="teacher-challenge-item" key={item.id}><div><span>{item.area} · {item.language}{item.cefrLevel?` · ${item.cefrLevel}`:""}</span><h3>{item.title}</h3><p>{item.contentType} · {item.topic} · {item.route}</p></div><button onClick={()=>removeChallenge(item.id)} aria-label={`Delete ${item.title}`}><Trash2 size={17}/></button></article>)}</div>}
        </section>
      </>}

      {activeTab === "courses" && <section className="teacher-panel-grid">
        <form className="challenge-form compact-form" onSubmit={saveCourse}><div className="form-section-title"><span>01</span><div><h2>{editingCourse ? "Edit course" : "Create a course"}</h2><p>Organise students into classes or learning groups.</p></div></div>
          <label className="teacher-field"><span>Course / group name *</span><input value={courseForm.name} onChange={e=>setCourseForm(c=>({...c,name:e.target.value}))} placeholder="e.g. Year 9 · English B1+" required /></label>
          <label className="teacher-field"><span>Year / level</span><input value={courseForm.level} onChange={e=>setCourseForm(c=>({...c,level:e.target.value}))} placeholder="e.g. Secondary · Year 9" /></label>
          <label className="teacher-field"><span>Description <em>Optional</em></span><textarea rows="3" value={courseForm.description} onChange={e=>setCourseForm(c=>({...c,description:e.target.value}))} placeholder="Add a short description of this group..." /></label>
          <div className="teacher-form-footer"><span>{editingCourse ? "Update the course details" : "You can edit these details later"}</span><div className="form-actions">{editingCourse && <button type="button" className="teacher-cancel" onClick={()=>{setEditingCourse(null);setCourseForm({name:"",level:"",description:""});}}>Cancel</button>}<button className="teacher-save" type="submit"><Save size={16}/>{editingCourse ? "Save changes" : "Create course"}</button></div></div>
        </form>
        <div className="teacher-list-panel"><div className="library-heading"><div><span className="teacher-kicker">YOUR GROUPS</span><h2>My courses</h2><p>{courses.length} {courses.length===1?"course":"courses"} created</p></div></div>
          {courses.length===0 ? <div className="teacher-empty">Your courses will appear here. Create your first group to start assigning challenges.</div> : <div className="teacher-challenge-list">{courses.map(course=><article className="teacher-challenge-item" key={course.id}><div><span>{course.level || "COURSE / GROUP"}</span><h3>{course.name}</h3><p>{course.description || "No description added"} · {assignments.filter(a=>a.courseId===course.id).length} assignments</p></div><div className="item-actions"><button onClick={()=>startEditCourse(course)} aria-label={`Edit ${course.name}`}><Pencil size={16}/></button><button onClick={()=>removeCourse(course.id)} aria-label={`Delete ${course.name}`}><Trash2 size={16}/></button></div></article>)}</div>}
        </div>
      </section>}

      {activeTab === "assignments" && <section className="teacher-panel-grid">
        <form className="challenge-form compact-form" onSubmit={saveAssignment}><div className="form-section-title"><span>01</span><div><h2>Assign a challenge</h2><p>Choose an activity and the group that will work on it.</p></div></div>
          {assignmentChallenges.length===0 || courses.length===0 ? <div className="teacher-empty">To create an assignment, you need at least one challenge and one course. Create a course, or use one of the challenges already available in the VOX library.</div> : <>
            <label className="teacher-field"><span>Challenge *</span><select value={assignmentForm.challengeId} onChange={e=>setAssignmentForm(a=>({...a,challengeId:e.target.value}))} required><option value="">Select a challenge</option><optgroup label="VOX challenge library">{availableChallenges.map(ch=><option key={ch.id} value={ch.id}>{ch.title}</option>)}</optgroup><optgroup label="My created challenges">{challenges.map(ch=><option key={ch.id} value={ch.id}>{ch.title}</option>)}</optgroup></select></label>
            <label className="teacher-field"><span>Course / group *</span><select value={assignmentForm.courseId} onChange={e=>setAssignmentForm(a=>({...a,courseId:e.target.value}))} required><option value="">Select a course</option>{courses.map(course=><option key={course.id} value={course.id}>{course.name}</option>)}</select></label>
            <label className="teacher-field"><span>Due date <em>Optional</em></span><input type="date" value={assignmentForm.dueDate} onChange={e=>setAssignmentForm(a=>({...a,dueDate:e.target.value}))} /></label>
            <label className="teacher-field"><span>Instructions for students <em>Optional</em></span><textarea rows="3" value={assignmentForm.instructions} onChange={e=>setAssignmentForm(a=>({...a,instructions:e.target.value}))} placeholder="Add any specific instructions for this group..." /></label>
            <div className="teacher-form-footer"><span>Choose from the VOX library or your own challenges</span><button className="teacher-save" type="submit"><Plus size={16}/> Create assignment</button></div>
          </>}
        </form>
        <div className="teacher-list-panel"><div className="library-heading"><div><span className="teacher-kicker">PLANNING</span><h2>Assigned challenges</h2><p>{assignments.length} {assignments.length===1?"assignment":"assignments"}</p></div></div>
          {assignments.length===0 ? <div className="teacher-empty">Your assignments will appear here once you assign a challenge to a course.</div> : <div className="teacher-challenge-list">{assignments.map(item=><article className="teacher-challenge-item assignment-item" key={item.id}><div><span>{item.courseName}</span><h3>{item.challengeTitle}</h3><p>{item.dueDate ? `Due ${new Date(`${item.dueDate}T12:00:00`).toLocaleDateString()}` : "No due date"}{item.instructions ? ` · ${item.instructions}` : ""}</p></div><button onClick={()=>removeAssignment(item.id)} aria-label={`Remove assignment ${item.challengeTitle}`}><Trash2 size={17}/></button></article>)}</div>}
        </div>
      </section>}

      {activeTab === "progress" && <section className="teacher-progress-panel">
        <div className="library-heading"><div><span className="teacher-kicker">LEARNING EVIDENCE</span><h2>Student progress</h2><p>Review starts, completed thinking activities and written contributions recorded on this device.</p></div></div>
        <div className="progress-overview">
          <div><strong>{progress.length}</strong><span>ATTEMPTS STARTED</span></div>
          <div><strong>{progress.filter(item => item.status === "completed").length}</strong><span>ACTIVITIES COMPLETED</span></div>
          <div><strong>{assignments.length}</strong><span>ASSIGNMENTS</span></div>
        </div>
        {progress.length === 0 ? <div className="teacher-empty">No student activity recorded yet. Open Student Space, start an assigned challenge and finish the thinking activity. The results will appear here.</div> :
          <div className="teacher-progress-list">{[...progress].sort((a,b) => new Date(b.startedAt) - new Date(a.startedAt)).map(item => <article className="teacher-progress-item" key={item.id}>
            <div className="teacher-progress-item-head"><div><span>{item.courseName || "Course"} · Attempt {item.attemptNumber || 1}</span><h3>{item.challengeTitle || "VOX challenge"}</h3></div><span className={`teacher-progress-status ${item.status}`}>{item.status === "completed" ? "Completed" : "In progress"}</span></div>
            <p className="teacher-progress-date">Started {new Date(item.startedAt).toLocaleString()}{item.completedAt ? ` · Completed ${new Date(item.completedAt).toLocaleString()}` : ""}</p>
            {item.thinking && <div className="teacher-thinking-evidence">
              <div><span>INITIAL IDEA</span><p>{item.thinking.initialIdea || "Not provided"}</p></div>
              <div><span>REASONING</span><p>{item.thinking.reason || "Not provided"}</p></div>
              <div><span>EXAMPLE / EVIDENCE</span><p>{item.thinking.example || "Not provided"}</p></div>
              <div><span>ANOTHER PERSPECTIVE</span><p>{item.thinking.otherPerspective || "Not provided"}</p></div>
            </div>}
          </article>)}</div>}
        <p className="teacher-progress-disclaimer">This is a local prototype: activity is not linked to an individual student account and is visible only in this browser. Audio recordings and AI feedback are not included in this progress report yet.</p>
      </section>}
      <footer className="teacher-storage-note"><GraduationCap size={16}/> Teacher data is currently stored in this browser only. Shared accounts and cloud synchronisation will be added in a later stage.</footer>
    </main>
  </div>;
}
