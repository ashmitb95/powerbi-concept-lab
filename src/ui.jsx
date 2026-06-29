import { useState, useEffect } from "react";
import { Copy, Check, MousePointerClick, Lightbulb, Play, Sparkles, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { c } from "./theme.js";
import { VIDEO_REFS, ytUrl, srcTitle } from "./data/reference.js";

export function Pill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition"
      style={{ background: active ? c.violet : c.paper, color: active ? "#fff" : c.ink, border: `1px solid ${active ? c.violet : c.line}` }}
    >
      {children}
    </button>
  );
}

export function Tag({ children, soft }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-md font-semibold" style={{ background: soft ? c.apricot : c.violetSoft, color: c.ink }}>
      {children}
    </span>
  );
}

export function CopyBtn({ text, label = "Copy" }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard?.writeText(text); setDone(true); setTimeout(() => setDone(false), 1400); }}
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition shrink-0"
      style={{ background: done ? c.green : c.violet, color: "#fff" }}
    >
      {done ? <Check size={14} /> : <Copy size={14} />} {done ? "Copied" : label}
    </button>
  );
}

export function Try({ children }) {
  return (
    <div className="flex items-start gap-2 rounded-lg p-2.5 mb-4 text-xs" style={{ background: c.violetSoft }}>
      <MousePointerClick size={14} color={c.rust} className="shrink-0 mt-0.5" />
      <span style={{ color: c.ink }}><strong>Try it: </strong>{children}</span>
    </div>
  );
}

export function Takeaway({ children }) {
  return (
    <div className="flex items-start gap-2 rounded-lg p-2.5 mt-4 text-xs" style={{ background: c.apricot }}>
      <Lightbulb size={14} color={c.rust} className="shrink-0 mt-0.5" />
      <span style={{ color: c.ink }}><strong>The takeaway: </strong>{children}</span>
    </div>
  );
}

export function Code({ children, dark = true }) {
  return (
    <pre
      className="text-xs p-3 rounded-lg overflow-x-auto whitespace-pre-wrap"
      style={{ background: dark ? c.ink : c.canvas, color: dark ? c.apricot : c.ink, fontFamily: c.mono, border: dark ? "none" : `1px solid ${c.line}` }}
    >
      <code>{children}</code>
    </pre>
  );
}

export function Card({ children, className = "", pad = "p-5" }) {
  return (
    <div className={`rounded-2xl ${pad} ${className}`} style={{ background: c.paper, border: `1px solid ${c.line}` }}>
      {children}
    </div>
  );
}

// Clickable "watch this on YouTube at timestamp" chips for a concept/pattern id.
export function WatchRefs({ ids, compact }) {
  const list = (Array.isArray(ids) ? ids : [ids]).flatMap((id) => VIDEO_REFS[id] || []);
  if (!list.length) return null;
  return (
    <div className="flex items-center gap-1.5 flex-wrap mt-2">
      {!compact && <span className="text-xs font-semibold inline-flex items-center gap-1" style={{ color: c.muted }}><Play size={13} color={c.rust} /> Watch:</span>}
      {list.map((v, i) => (
        <a
          key={i}
          href={ytUrl(v.src, v.t)}
          target="_blank"
          rel="noopener"
          title={`${srcTitle(v.src)} — ${v.t}`}
          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md transition hover:underline"
          style={{ background: c.violetSoft, color: c.ink }}
        >
          {compact && <Play size={11} color={c.rust} />}
          {v.label} <span style={{ color: c.muted }}>· {v.src} {v.t}</span>
        </a>
      ))}
    </div>
  );
}

// Render a function's source tags ("V6·V5", "PRO+") with each V-id deep-linking to its timestamp.
export function SrcLinks({ src, at }) {
  const ids = src.match(/V\d/g) || [];
  if (!ids.length) return <span style={{ color: c.dim }}>{src}</span>;
  const extra = /PRO\+/.test(src) ? " · PRO+" : "";
  return (
    <span style={{ color: c.dim }}>
      {ids.map((id, i) => {
        const t = at?.[id];
        return (
          <span key={id}>
            {i > 0 && " · "}
            <a href={ytUrl(id, t)} target="_blank" rel="noopener" title={`${srcTitle(id)}${t ? " — " + t : ""}`} style={{ color: c.rust }}>
              {id}{t && <span style={{ color: c.dim, fontWeight: 400 }}> {t}</span>}
            </a>
          </span>
        );
      })}
      {extra}
    </span>
  );
}

// The prompt a learner pastes into Claude Desktop / claude.ai to be guided through the app.
export function guidePrompt() {
  const url = typeof window !== "undefined" ? window.location.origin : "(the app URL)";
  return `I'm learning Power BI with an interactive app called "Power BI Concept Lab" ( ${url} ).

About me: I can already build simple dashboards and want to reach intermediate/advanced — especially DAX (filter context, CALCULATE, time intelligence) and data modeling.

About the app, so you can guide me:
- Tabs: Start here, Datasets, Reference, Tutor.
- I pick a dataset (Northwind, Coffee Shop, SaaS Revenue, or my own CSV) and learn concepts tuned to that data: filter context, measure vs calculated column, relationships, ranking (RANKX), and time intelligence (YoY/MoM/YTD).
- Each concept is an interactive trainer. The Reference tab is a searchable library of concepts, patterns and ~50 DAX functions, each linking to the source YouTube timestamp.
- The real building happens in Power BI Desktop — the app gives me the connector + URL to open each dataset there.
- A machine-readable map of the app is at ${url}/llms.txt — fetch it if you can.

What I want from you:
1. FIRST, before recommending anything: give me a 2-3 line orientation, then ask me three short questions — my comfort level, my specific goal, and my time per session. Don't assume I want the "recommended path"; "guide me" is not a goal. Wait for my answers.
2. THEN build me a Markdown checklist (a curated, ordered path for my goal, using the lesson ids from the file) and coach me through it one concept at a time, ticking items off.
3. When I paste DAX, an error, or a screenshot, decode it in plain English and give corrected, copy-pasteable DAX — always tying it back to filter/row context and relationships.
4. Push me toward the "why", keep it concise, and don't re-explain basics unless I ask.

Start with ONLY the orientation + the three questions. Do not recommend a concept or dataset until I answer.`;
}

// Button that copies the guide prompt for pasting into Claude. variant: "top" (compact) | "card".
export function GuideMeButton({ variant = "top" }) {
  const [done, setDone] = useState(false);
  const copy = () => { navigator.clipboard?.writeText(guidePrompt()); setDone(true); setTimeout(() => setDone(false), 1800); };
  if (variant === "card") {
    return (
      <button onClick={copy} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold" style={{ background: done ? c.green : c.violet, color: "#fff" }}>
        {done ? <Check size={14} /> : <Sparkles size={14} />} {done ? "Copied! Paste into Claude Desktop to continue" : "Ask Claude to guide me"}
      </button>
    );
  }
  return (
    <button onClick={copy} title="Copy a prompt to paste into Claude — it'll guide you through the app" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition" style={{ background: done ? c.green : c.paper, color: done ? "#fff" : c.ink, border: `1px solid ${done ? c.green : c.line}` }}>
      {done ? <Check size={14} /> : <Sparkles size={14} color={c.rust} />} {done ? "Copied! Paste into Claude Desktop to continue" : "Ask Claude to guide me"}
    </button>
  );
}

// Slicer: pills for low-cardinality columns, a dropdown once there are many distinct
// values (so a 250-country column doesn't render 250 buttons and freeze the page).
const SLICER_PILL_MAX = 10;
const SLICER_OPTION_MAX = 300;
// Pagination over an in-memory array. Renders only one page's worth of rows, so a
// 38k-row dataset stays snappy. `resetKey` jumps back to page 1 when filters change.
export function usePager(items, pageSize = 12, resetKey = "") {
  const [page, setPage] = useState(0);
  useEffect(() => { setPage(0); }, [resetKey]);
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const p = Math.min(page, pages - 1);
  return {
    page: p, setPage, pages, total, pageSize,
    slice: items.slice(p * pageSize, p * pageSize + pageSize),
    from: total ? p * pageSize + 1 : 0,
    to: Math.min(total, p * pageSize + pageSize),
  };
}

export function Pager({ pager, note }) {
  if (pager.total <= pager.pageSize) return note ? <div className="text-xs mt-1.5" style={{ color: c.muted }}>{note}</div> : null;
  const { page, setPage, pages, from, to, total } = pager;
  const btn = (disabled) => ({ background: c.paper, border: `1px solid ${c.line}`, color: c.ink, opacity: disabled ? 0.35 : 1 });
  return (
    <div className="flex items-center gap-1.5 mt-2 text-xs flex-wrap" style={{ color: c.muted }}>
      <button disabled={page === 0} onClick={() => setPage(0)} className="p-1 rounded-md" style={btn(page === 0)} title="First"><ChevronsLeft size={13} /></button>
      <button disabled={page === 0} onClick={() => setPage(page - 1)} className="p-1 rounded-md" style={btn(page === 0)} title="Previous"><ChevronLeft size={13} /></button>
      <span style={{ minWidth: 120, textAlign: "center" }}>{from.toLocaleString()}–{to.toLocaleString()} of {total.toLocaleString()}</span>
      <button disabled={page >= pages - 1} onClick={() => setPage(page + 1)} className="p-1 rounded-md" style={btn(page >= pages - 1)} title="Next"><ChevronRight size={13} /></button>
      <button disabled={page >= pages - 1} onClick={() => setPage(pages - 1)} className="p-1 rounded-md" style={btn(page >= pages - 1)} title="Last"><ChevronsRight size={13} /></button>
      {note && <span className="ml-1">{note}</span>}
    </div>
  );
}

export function Slicer({ label, options, value, onChange }) {
  const many = options.length > SLICER_PILL_MAX;
  if (many) {
    const sorted = [...options].sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true })).slice(0, SLICER_OPTION_MAX);
    return (
      <div>
        <div className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: c.muted }}>{label} <span style={{ color: c.dim }}>· {options.length}</span></div>
        <select value={value} onChange={(e) => onChange(e.target.value)} className="text-xs rounded-lg px-2.5 py-2 outline-none" style={{ background: c.paper, border: `1px solid ${c.line}`, color: c.ink, maxWidth: 240 }}>
          <option value="All">All ({options.length})</option>
          {sorted.map((o) => <option key={String(o)} value={String(o)}>{String(o)}</option>)}
          {options.length > SLICER_OPTION_MAX && <option disabled>… {options.length - SLICER_OPTION_MAX} more — filter in Power BI</option>}
        </select>
      </div>
    );
  }
  return (
    <div>
      <div className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: c.muted }}>{label}</div>
      <div className="flex gap-1.5 flex-wrap">
        {["All", ...options].map((o) => (
          <Pill key={o} active={value === o} onClick={() => onChange(o)}>{o}</Pill>
        ))}
      </div>
    </div>
  );
}
