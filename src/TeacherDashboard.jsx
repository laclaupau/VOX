import { useMemo, useState } from "react";
import { ArrowLeft, BookOpen, Plus, Trash2, Save, Sparkles } from "lucide-react";
import "./TeacherDashboard.css";

const AREAS = ["Language & Literature", "Social Sciences", "History", "Ethics", "Citizenship", "Global Perspectives", "Natural Sciences", "Geography", "Philosophy", "Art", "Other"];
const CEFR = ["A1", "A2", "A2+", "B1", "B1+", "B2", "B2+", "C1"];
const CONTENT_TYPES = ["Story", "Article", "News report", "Problem / Issue"];
const OBJECTIVES = ["Interpret", "Argue", "Compare perspectives", "Evaluate evidence", "Explain", "Reflect", "Create connections"];
const ROUTES = ["Explore", "Interpret", "Investigate", "Debate"];
const ACTIVATORS = ["Clarify", "Develop", "Connect", "Challenge"];
const STORAGE_KEY = "vox.teacher.challenges.v1";
const emptyForm = { title: "", area: "History", language: "English", cefrLevel: "B1", contentType: "Article", topic: "", objective: "Interpret", route: "Investigate", activators: ["Connect"], prompt: "", description: "" };

export default function TeacherDashboard({ onBack }) {
  const [challenges, setChallenges] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
  });
  const [form, setForm] = useState(emptyForm);
  const [saved, setSaved] = useState(false);
  const isEnglish = form.language === "English";
  const update = (key, value) => { setForm(current => ({ ...current, [key]: value })); setSaved(false); };
  const canSave = form.title.trim() && form.topic.trim() && form.prompt.trim();
  const countLabel = useMemo(() => `${challenges.length} ${challenges.length === 1 ? "challenge created" : "challenges created"}`, [challenges.length]);

  function saveChallenge(event) {
    event.preventDefault();
    if (!canSave) return;
    const challenge = { ...form, cefrLevel: isEnglish ? form.cefrLevel : null, activators: [...form.activators], id: crypto.randomUUID(), createdAt: new Date().toISOString(), source: "teacher" };
    const next = [challenge, ...challenges];
    setChallenges(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setForm(emptyForm);
    setSaved(true);
  }
  function removeChallenge(id) {
    const next = challenges.filter(item => item.id !== id);
    setChallenges(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  function toggleActivator(value) {
    update("activators", form.activators.includes(value) ? form.activators.filter(item => item !== value) : [...form.activators, value]);
  }

  return <div className="teacher-shell">
    <header className="teacher-topbar">
      <a className="teacher-brand" href="#teacher-top"><span className="teacher-brand-mark">v.</span> VOX <span className="teacher-space-label">TEACHER SPACE</span></a>
      <button className="teacher-back" onClick={onBack}><ArrowLeft size={16}/> Student space</button>
    </header>
    <main className="teacher-main" id="teacher-top">
      <div className="teacher-heading"><div><span className="teacher-kicker"><Sparkles size={14}/> DESIGN LEARNING EXPERIENCES</span><h1>Build a challenge<span>.</span></h1><p>Design a space for students to think, develop ideas and make their voices heard.</p></div><div className="teacher-stat"><strong>{String(challenges.length).padStart(2,"0")}</strong><span>MY CHALLENGES</span></div></div>
      <div className="teacher-layout">
        <form className="challenge-form" onSubmit={saveChallenge}>
          <div className="form-section-title"><span>01</span><div><h2>Challenge identity</h2><p>Start with the subject, language and material.</p></div></div>
          <label className="teacher-field"><span>Challenge title *</span><input value={form.title} onChange={e=>update("title",e.target.value)} placeholder="e.g. Who benefits from industrialisation?" required /></label>
          <div className="teacher-form-grid">
            <label className="teacher-field"><span>Curricular area *</span><select value={form.area} onChange={e=>update("area",e.target.value)}>{AREAS.map(x=><option key={x}>{x}</option>)}</select></label>
            <label className="teacher-field"><span>Challenge language *</span><select value={form.language} onChange={e=>{const language=e.target.value;setForm(c=>({...c,language,cefrLevel:language==="English"?(c.cefrLevel||"B1"):null}));setSaved(false);}}><option>English</option><option>Spanish</option></select></label>
          </div>
          {isEnglish && <label className="teacher-field cefr-field"><span>CEFR level *</span><select value={form.cefrLevel || "B1"} onChange={e=>update("cefrLevel",e.target.value)}>{CEFR.map(x=><option key={x} value={x}>{x}</option>)}</select><small>Choose the language level expected of the target students. This is independent of the curricular area.</small></label>}
          <div className="teacher-form-grid">
            <label className="teacher-field"><span>Content type *</span><select value={form.contentType} onChange={e=>update("contentType",e.target.value)}>{CONTENT_TYPES.map(x=><option key={x}>{x}</option>)}</select></label>
            <label className="teacher-field"><span>Topic / source material *</span><input value={form.topic} onChange={e=>update("topic",e.target.value)} placeholder="Text, article, issue or topic" required /></label>
          </div>
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
    </main>
  </div>;
}
