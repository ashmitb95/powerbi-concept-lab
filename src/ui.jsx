import { useState } from "react";
import { Copy, Check, MousePointerClick, Lightbulb, Play, Sparkles } from "lucide-react";
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
1. Orient me in 3-4 lines and tell me the very first thing to click.
2. Walk me through a first session step by step (suggest the dataset + concept order), checking in after each.
3. When I paste DAX, an error, or a screenshot, decode it in plain English and give corrected, copy-pasteable DAX — always tying it back to filter/row context and relationships.
4. Push me toward the "why", keep it concise, and don't re-explain basics unless I ask.

Start by orienting me and telling me the first thing to click.`;
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

export function Slicer({ label, options, value, onChange }) {
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
