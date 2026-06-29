import { useState, useRef } from "react";
import { useLocalStorage } from "./lib/store.js";
import { Database, Upload, ArrowLeft, ExternalLink, Copy, Check, Camera, ChevronRight, FileSpreadsheet, Sparkles, GraduationCap, MousePointerClick, ArrowRight, MonitorPlay } from "lucide-react";
import { c } from "./theme.js";
import { Card, Pill, CopyBtn, Code, Tag, WatchRefs, GuideMeButton } from "./ui.jsx";
import { TRAINERS } from "./trainers.jsx";
import { datasetFromCsv } from "./lib/csv.js";
import { PRACTICE } from "./data/datasets.js";
import { conceptDoc } from "./data/reference.js";

// ── DATASET PICKER (home / front door) ──────────────────────────────────────
export function DatasetPicker({ datasets, onPick, onUpload }) {
  const fileRef = useRef();
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleFile(file) {
    if (!file) return;
    setBusy(true); setErr("");
    try { onPick(await onUpload(file)); }
    catch (e) { setErr(e.message || "Couldn't read that file."); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-1" style={{ color: c.ink }}>Pick a dataset to learn on</h2>
      <p className="text-sm mb-5" style={{ color: c.muted }}>Every concept below re-skins to the data you choose, so the examples use real columns and values — not abstract placeholders. Then open the same data in Power BI Desktop and try it for real.</p>

      <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: c.rust }}>Interactive — learn the concepts live in here</div>
      <div className="grid md:grid-cols-2 gap-3 mb-6">
        {datasets.map((d) => (
          <button key={d.id} onClick={() => onPick(d)} className="text-left rounded-2xl p-4 transition hover:shadow-sm" style={{ background: c.paper, border: `1px solid ${c.line}` }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold flex items-center gap-1.5" style={{ color: c.ink }}><Database size={14} color={c.rust} /> {d.name}</span>
              <Tag>{d.tag}</Tag>
            </div>
            <p className="text-xs mb-2" style={{ color: c.muted }}>{d.blurb}</p>
            <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: c.rust }}>
              {d.concepts.length} concept{d.concepts.length > 1 ? "s" : ""} tuned to this data <ChevronRight size={13} />
            </div>
          </button>
        ))}

        {/* BYO upload */}
        <div className="rounded-2xl p-4 flex flex-col justify-center items-center text-center" style={{ background: c.canvas, border: `1.5px dashed ${c.dim}` }}>
          <FileSpreadsheet size={20} color={c.rust} />
          <div className="text-sm font-bold mt-1.5" style={{ color: c.ink }}>Bring your own CSV</div>
          <p className="text-xs mt-0.5 mb-2" style={{ color: c.muted }}>Drop a file — it's parsed in your browser and never uploaded. Concepts tune to your columns.</p>
          <button onClick={() => fileRef.current?.click()} disabled={busy} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold" style={{ background: c.violet, color: "#fff" }}>
            <Upload size={13} /> {busy ? "Reading…" : "Choose CSV"}
          </button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
          {err && <p className="text-xs mt-2" style={{ color: c.rust }}>{err}</p>}
        </div>
      </div>

      <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: c.muted }}>Practice targets — open these straight in Power BI Desktop</div>
      <div className="grid md:grid-cols-2 gap-3">
        {PRACTICE.map((d) => (
          <Card key={d.id} pad="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold" style={{ color: c.ink }}>{d.name}</span>
              <Tag soft>{d.tag}</Tag>
            </div>
            <p className="text-xs mb-2" style={{ color: c.muted }}>{d.blurb}</p>
            <AccessLine access={d.access} />
            <p className="text-xs mt-2" style={{ color: c.ink }}><span className="font-semibold">Challenge: </span><span style={{ color: c.muted }}>{d.challenge}</span></p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AccessLine({ access }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <div className="text-xs mb-1 flex items-center gap-1" style={{ color: c.muted }}><ExternalLink size={11} /> {access.connector}</div>
      <button onClick={() => { navigator.clipboard?.writeText(access.url); setCopied(true); setTimeout(() => setCopied(false), 1200); }} className="w-full flex items-center justify-between gap-2 p-2 rounded-lg" style={{ background: c.ink }}>
        <span className="text-xs truncate" style={{ color: "#D8D8E8", fontFamily: c.mono }}>{access.url}</span>
        <span className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold" style={{ color: copied ? c.apricot : "#fff" }}>{copied ? <Check size={12} /> : <Copy size={12} />}{copied ? "Copied" : "Copy"}</span>
      </button>
    </div>
  );
}

// ── DATASET HOME (overview + open in PBI + concept lessons) ──────────────────
export function DatasetHome({ ds, progress = {}, onConcept, onBack }) {
  return (
    <div>
      <button onClick={onBack} className="inline-flex items-center gap-1 text-xs font-semibold mb-3" style={{ color: c.rust }}><ArrowLeft size={13} /> All datasets</button>
      <div className="flex items-center gap-2 mb-1"><h2 className="text-xl font-bold" style={{ color: c.ink }}>{ds.name}</h2><Tag>{ds.tag}</Tag></div>
      <p className="text-sm mb-4" style={{ color: c.muted }}>{ds.blurb}</p>

      <div className="grid md:grid-cols-2 gap-4 mb-5">
        <Card pad="p-4">
          <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: c.muted }}>What's in here (sample)</div>
          {Object.entries(ds.tables).map(([name, rows]) => (
            <div key={name} className="mb-2">
              <span className="text-xs font-bold" style={{ color: c.ink }}>{name}</span>
              <span className="text-xs" style={{ color: c.muted }}> — {rows.length} rows · {Object.keys(rows[0]).join(", ")}</span>
            </div>
          ))}
          {ds.rel && <p className="text-xs mt-1" style={{ color: c.muted }}>Related on <code>{ds.rel.dimKey}</code> (1 → ∗).</p>}
        </Card>
        <Card pad="p-4">
          <div className="text-xs font-bold uppercase tracking-wide mb-2 flex items-center gap-1.5" style={{ color: c.rust }}><ExternalLink size={13} /> Open the full dataset in Power BI</div>
          <AccessLine access={ds.access} />
          <ol className="mt-2 space-y-1">
            {ds.access.steps.map((s, i) => (
              <li key={i} className="flex gap-2 text-xs"><span className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center font-bold" style={{ background: c.apricot, color: c.ink, fontSize: "10px" }}>{i + 1}</span><span style={{ color: c.muted }}>{s}</span></li>
            ))}
          </ol>
        </Card>
      </div>

      <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: c.muted }}>Concepts tuned to {ds.name}</div>
      <div className="grid md:grid-cols-3 gap-3">
        {ds.concepts.map((id) => {
          const t = TRAINERS[id];
          if (!t) return null;
          const done = progress[`${ds.id}/${id}`];
          return (
            <button key={id} onClick={() => onConcept(id)} className="text-left rounded-2xl p-4 transition hover:shadow-sm" style={{ background: c.paper, border: `1px solid ${done ? c.rust : c.line}` }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold" style={{ color: c.ink }}>{t.title}</span>
                {done && <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: c.rust }}><Check size={12} /> explored</span>}
              </div>
              <p className="text-xs mb-2" style={{ color: c.muted }}>{t.blurb}</p>
              <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: c.rust }}>{done ? "Revisit" : "Open lesson"} <ChevronRight size={13} /></span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── CONCEPT LESSON (trainer + go-deeper doc + tutor) ─────────────────────────
export function ConceptLesson({ ds, conceptId, onBack }) {
  const t = TRAINERS[conceptId];
  const Comp = t.comp;
  const doc = conceptDoc(conceptId);
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button onClick={onBack} className="inline-flex items-center gap-1 text-xs font-semibold mb-3" style={{ color: c.rust }}><ArrowLeft size={13} /> {ds.name}</button>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Card><h2 className="text-lg font-bold mb-3" style={{ color: c.ink }}>{t.title} · <span style={{ color: c.muted }}>{ds.name}</span></h2><Comp ds={ds} /></Card>

          <div className="mt-3"><WatchRefs ids={conceptId} /></div>

          {doc && (
            <Card className="mt-4">
              <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between">
                <span className="text-sm font-bold" style={{ color: c.ink }}>Go deeper: {doc.title}</span>
                <ChevronRight size={16} style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform .15s" }} />
              </button>
              {open && (
                <div className="mt-3">
                  <p className="text-xs italic mb-2" style={{ color: c.muted }}>{doc.gist}</p>
                  {doc.body.map((p, i) => <p key={i} className="text-sm mb-2" style={{ color: c.ink }} dangerouslySetInnerHTML={{ __html: mdBold(p) }} />)}
                  {doc.examples?.map((ex, i) => <div key={i} className="mt-2"><Code>{ex.dax}</Code><p className="text-xs mt-1" style={{ color: c.muted }}>{ex.note} {ex.verified && <span style={{ color: c.rust }}>· ✓ verified on-screen</span>}</p></div>)}
                  <p className="text-xs mt-2" style={{ color: c.dim }}>Source: {doc.src}</p>
                </div>
              )}
            </Card>
          )}
        </div>
        <div className="md:col-span-1"><CaptureCoach conceptId={conceptId} ds={ds} /></div>
      </div>
    </div>
  );
}

const mdBold = (s) => s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/`(.+?)`/g, '<code style="background:#f0eee9;padding:1px 5px;border-radius:4px">$1</code>');

// ── CAPTURE COACH ────────────────────────────────────────────────────────────
function CaptureCoach({ conceptId, ds }) {
  const grabs = {
    "filter-context": ["Screenshot the visual that's wrong — include the Fields and Filters panes. That panel IS the filter context.", "Copy the measure text from the formula bar.", "Note what you expected vs what you got."],
    "measure-vs-column": ["Copy the DAX, and say whether it's a measure or a calculated column.", "Say what you're trying to do (aggregate? slice? group?)."],
    "relationships": ["Screenshot Model view so cardinality (1, ∗) and the cross-filter arrows are visible.", "Say which table you're filtering and which total looks wrong."],
  }[conceptId] || [];
  const prompt = `I'm learning Power BI using my "${ds.name}" data and I'm stuck on ${TRAINERS[conceptId].title.toLowerCase()}.\n\nMeasure / DAX (from the formula bar):\n[paste your DAX]\n\nContext: it's in a [card / table / matrix], slicers applied are: [list them — or see the screenshot].\nI expected [X] but got [Y].\n\nWalk me through it in terms of filter context / relationships, and give me corrected DAX.`;

  return (
    <Card pad="p-4">
      <div className="flex items-center gap-2 mb-3"><Camera size={15} color={c.rust} /><span className="text-sm font-bold" style={{ color: c.ink }}>Get unstuck in Claude</span></div>
      <div className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: c.muted }}>Capture this first</div>
      <ul className="space-y-2 mb-4">
        {grabs.map((g, i) => <li key={i} className="flex gap-2 text-xs"><span className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center font-bold" style={{ background: c.apricot, color: c.ink, fontSize: "10px" }}>{i + 1}</span><span style={{ color: c.muted }}>{g}</span></li>)}
      </ul>
      <CopyBtn text={prompt} label="Copy help prompt" />
      <p className="text-xs mt-3" style={{ color: c.muted }}>Paste it into your Claude Project (set that up in <strong>Tutor</strong>) with the screenshot. For Power BI, an image beats a description nearly every time.</p>
    </Card>
  );
}

// ── SETUP TUTOR ──────────────────────────────────────────────────────────────
export function SetupTutor({ ds }) {
  const [dataDesc, setDataDesc] = useLocalStorage("pbil.tutor.data", "");
  const [goal, setGoal] = useLocalStorage("pbil.tutor.goal", "");
  const d = dataDesc.trim() || (ds ? `${ds.name} — ${Object.keys(ds.tables).join(" + ")}` : "retail sales with separate Products and Regions tables");
  const g = goal.trim() || "get fluent with DAX measures, filter context, relationships and time intelligence";
  const instructions = `You are my personal Power BI coach. I can already build simple dashboards and I'm pushing into intermediate/advanced territory — assume that level and don't re-explain basics unless I ask.\n\nWhen I paste DAX, decode it line by line in plain English, then tell me whether it's the right approach. When I paste an error, diagnose it and give the fix. When I share a screenshot, read the Fields and Filters panes to reason about filter context. Always connect explanations back to filter context, row context, and relationships. Give me copy-pasteable DAX in code blocks, and push me toward the "why", not just the "what".\n\nMy data: ${d}\nMy current goal: ${g}\n\nKeep answers concise and concrete. Push me; don't coddle.`;

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-bold mb-1" style={{ color: c.ink }}>Set up your Claude tutor</h2>
      <p className="text-sm mb-5" style={{ color: c.muted }}>Set this up once and every question lands in primed context. Describe your data, generate the instructions, and paste them into a new Claude Project. Free, no keys — it uses your own Claude subscription.</p>
      <div className="space-y-3 mb-5">
        <div><label className="text-xs font-bold uppercase tracking-wide" style={{ color: c.muted }}>What's your data about?</label>
          <textarea value={dataDesc} onChange={(e) => setDataDesc(e.target.value)} rows={2} placeholder={d} className="w-full mt-1 text-sm p-2.5 rounded-lg resize-none outline-none" style={{ background: c.canvas, border: `1px solid ${c.line}` }} /></div>
        <div><label className="text-xs font-bold uppercase tracking-wide" style={{ color: c.muted }}>What are you trying to get good at?</label>
          <textarea value={goal} onChange={(e) => setGoal(e.target.value)} rows={2} placeholder={g} className="w-full mt-1 text-sm p-2.5 rounded-lg resize-none outline-none" style={{ background: c.canvas, border: `1px solid ${c.line}` }} /></div>
      </div>
      <div className="rounded-xl p-4 mb-4" style={{ background: c.ink }}>
        <div className="flex items-center justify-between mb-2"><span className="text-xs font-bold uppercase tracking-wide" style={{ color: c.apricot }}>Your project instructions</span><CopyBtn text={instructions} label="Copy" /></div>
        <pre className="text-xs whitespace-pre-wrap" style={{ color: "#D8D8E8", fontFamily: c.mono }}>{instructions}</pre>
      </div>
      <Card pad="p-4">
        <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: c.muted }}>Create the project</div>
        <ol className="space-y-2">
          {["Open Claude (desktop or claude.ai). Sidebar: Projects → New project. Name it \"Power BI Coach\".", "Paste the instructions above into the project's instructions box and save.", "When stuck, start a chat inside that project and use the \"Copy help prompt\" buttons in each lesson — plus a screenshot."].map((s, i) => (
            <li key={i} className="flex gap-2 text-sm"><span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: c.apricot, color: c.ink }}>{i + 1}</span><span style={{ color: c.ink }}>{s}</span></li>
          ))}
        </ol>
        <p className="text-xs mt-3" style={{ color: c.muted }}>Projects are a paid-plan feature. On the free plan, paste these as your <em>first message</em> in a normal chat — it works almost as well.</p>
      </Card>
    </div>
  );
}

// ── START HERE (first-session walkthrough) ───────────────────────────────────
const PATH = [
  { ds: "northwind", dsName: "Northwind", concept: "filter-context", title: "Filter context", why: "The idea everything else builds on." },
  { ds: "northwind", dsName: "Northwind", concept: "measure-vs-column", title: "Measure vs column", why: "Stop bloating models with the wrong tool." },
  { ds: "northwind", dsName: "Northwind", concept: "relationships", title: "Relationships", why: "How a filter travels between tables." },
  { ds: "coffee", dsName: "Coffee Shop", concept: "ranking", title: "Ranking (RANKX)", why: "Meet context transition — the trickiest idea in DAX." },
  { ds: "saas", dsName: "SaaS Revenue", concept: "time-intelligence", title: "Time intelligence", why: "YoY, MoM and YTD the right way." },
];

const LOOP = [
  { icon: MousePointerClick, title: "1 · Learn it here", text: "Pick a dataset and play with a concept on real data — see filter context actually move." },
  { icon: MonitorPlay, title: "2 · Try it in Power BI", text: "Open the same dataset in Power BI Desktop and rebuild it for real. This app is the companion, not a replacement." },
  { icon: GraduationCap, title: "3 · Get unstuck", text: "Stuck on a measure or an error? Paste it (and a screenshot) into your Claude tutor." },
];

export function StartHere({ progress = {}, onStart, onBrowse, onTutor }) {
  const done = PATH.filter((p) => progress[`${p.ds}/${p.concept}`]).length;
  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2 mb-1"><Sparkles size={18} color={c.rust} /><h2 className="text-xl font-bold" style={{ color: c.ink }}>Welcome — here's how this works</h2></div>
      <p className="text-sm mb-5" style={{ color: c.muted }}>
        You can already build simple dashboards; this gets you to intermediate/advanced by making the <em>invisible</em> parts of Power BI visible — filter context, relationships, measures — on data you choose, then handing you off to Power BI Desktop to build for real.
      </p>

      <div className="grid md:grid-cols-3 gap-3 mb-7">
        {LOOP.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.title} pad="p-4">
              <Icon size={18} color={c.rust} />
              <div className="text-sm font-bold mt-1.5 mb-0.5" style={{ color: c.ink }}>{s.title}</div>
              <p className="text-xs" style={{ color: c.muted }}>{s.text}</p>
            </Card>
          );
        })}
      </div>

      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-bold" style={{ color: c.ink }}>Your first session</h3>
        <span className="text-xs font-semibold" style={{ color: c.muted }}>{done} / {PATH.length} explored</span>
      </div>
      <div className="space-y-2 mb-6">
        {PATH.map((p, i) => {
          const isDone = progress[`${p.ds}/${p.concept}`];
          return (
            <button key={i} onClick={() => onStart(p.ds, p.concept)} className="w-full text-left rounded-xl p-3 flex items-center gap-3 transition hover:shadow-sm" style={{ background: c.paper, border: `1px solid ${isDone ? c.rust : c.line}` }}>
              <span className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: isDone ? c.rust : c.apricot, color: isDone ? "#fff" : c.ink }}>{isDone ? <Check size={14} /> : i + 1}</span>
              <span className="flex-1">
                <span className="text-sm font-bold" style={{ color: c.ink }}>{p.title}</span>
                <span className="text-xs" style={{ color: c.muted }}> · {p.dsName}</span>
                <span className="block text-xs" style={{ color: c.muted }}>{p.why}</span>
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold shrink-0" style={{ color: c.rust }}>{isDone ? "Revisit" : "Start"} <ArrowRight size={13} /></span>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl p-3 mb-4 flex items-center gap-3 flex-wrap" style={{ background: c.apricot }}>
        <Sparkles size={16} color={c.rust} className="shrink-0" />
        <span className="text-xs flex-1" style={{ color: c.ink }}><strong>Feeling like a lot?</strong> Copy a prompt and let Claude walk you through it — paste it into Claude Desktop or claude.ai.</span>
        <GuideMeButton variant="card" />
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={onBrowse} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold" style={{ background: c.violet, color: "#fff" }}><Database size={14} /> Browse all datasets</button>
        <button onClick={onTutor} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold" style={{ background: c.paper, color: c.ink, border: `1px solid ${c.line}` }}><GraduationCap size={14} /> Set up your Claude tutor</button>
      </div>
      <p className="text-xs mt-3" style={{ color: c.muted }}>Tip: the <strong>Reference</strong> tab has every concept, pattern and DAX function — searchable, each with a "watch on YouTube" jump point.</p>
    </div>
  );
}
