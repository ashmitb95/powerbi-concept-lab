import { useState, useMemo, useEffect, useRef } from "react";
import { Search, X, CornerDownRight, BookOpen } from "lucide-react";
import { c } from "./theme.js";
import { Card, Tag, Code, WatchRefs, SrcLinks } from "./ui.jsx";
import { CONCEPTS, PATTERNS, FUNCTIONS, FN_CATS } from "./data/reference.js";

const slug = (s) => s.replace(/[^a-z0-9]+/gi, "-").toLowerCase().replace(/^-|-$/g, "");
const stripMd = (s) => s.replace(/\*\*/g, "").replace(/`/g, "");
const mdHtml = (s) =>
  s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/`(.+?)`/g, '<code style="background:#f0eee9;padding:1px 5px;border-radius:4px">$1</code>');

// ── Build a flat search index over EVERYTHING in the reference ───────────────
function buildIndex() {
  const rec = [];
  CONCEPTS.forEach((x) => {
    rec.push({ kind: "Concept", title: x.title, text: stripMd(`${x.gist} ${x.body.join(" ")}`), anchor: `concept-${x.id}`, meta: x.src });
    (x.examples || []).forEach((ex) => rec.push({ kind: "DAX", title: `${x.title} · example`, text: `${ex.dax} ${ex.note}`, code: ex.dax, anchor: `concept-${x.id}`, meta: ex.src || x.src }));
  });
  PATTERNS.forEach((p) => {
    rec.push({ kind: "Pattern", title: p.title, text: stripMd(`${p.note} ${p.items.map((i) => i.note).join(" ")}`), anchor: `pattern-${p.id}`, meta: p.src });
    p.items.forEach((it) => rec.push({ kind: "DAX", title: p.title, text: `${it.dax} ${it.note}`, code: it.dax, anchor: `pattern-${p.id}`, meta: p.src }));
  });
  FUNCTIONS.forEach((f) => rec.push({ kind: "Function", title: f.name, text: `${f.name} ${f.cat} ${f.syntax} ${f.example}`, code: f.example, anchor: `fncat-${slug(f.cat)}`, meta: f.cat }));
  return rec;
}
const INDEX = buildIndex();

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function runSearch(q) {
  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) return [];
  return INDEX
    .map((r) => {
      const title = r.title.toLowerCase();
      const hay = (r.title + " " + r.text).toLowerCase();
      if (!tokens.every((t) => hay.includes(t))) return null;
      let score = 0;
      tokens.forEach((t) => {
        if (title === t) score += 120;
        else if (title.startsWith(t)) score += 80;
        else if (title.includes(t)) score += 50;
        if (r.text.toLowerCase().includes(t)) score += 10;
      });
      if (r.kind === "Function") score += 5;
      return { r, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 40)
    .map((x) => x.r);
}

function Highlight({ text, tokens }) {
  if (!tokens.length) return text;
  const re = new RegExp("(" + tokens.map(escapeRe).join("|") + ")", "ig");
  return text.split(re).map((p, i) =>
    tokens.some((t) => p.toLowerCase() === t) ? (
      <mark key={i} style={{ background: c.apricot, color: c.ink, borderRadius: 3, padding: "0 2px" }}>{p}</mark>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}

function snippet(text, tokens) {
  const lower = text.toLowerCase();
  let idx = -1;
  for (const t of tokens) { const i = lower.indexOf(t); if (i >= 0 && (idx < 0 || i < idx)) idx = i; }
  if (idx < 0) return text.slice(0, 120);
  const start = Math.max(0, idx - 45);
  return (start > 0 ? "… " : "") + text.slice(start, start + 150) + (start + 150 < text.length ? " …" : "");
}

const KIND_COLOR = { Concept: c.rust, Pattern: c.violet, Function: c.ink, DAX: c.graphite };

// ── Component ────────────────────────────────────────────────────────────────
export function Reference() {
  const [q, setQ] = useState("");
  const [active, setActive] = useState("");
  const [flash, setFlash] = useState("");
  const searchRef = useRef();

  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
  const results = useMemo(() => runSearch(q), [q]);

  const legend = [
    { group: "Concepts", items: CONCEPTS.map((x) => ({ id: `concept-${x.id}`, label: x.title })) },
    { group: "Patterns", items: PATTERNS.map((x) => ({ id: `pattern-${x.id}`, label: x.title })) },
    { group: "Functions", items: FN_CATS.map((k) => ({ id: `fncat-${slug(k)}`, label: k })) },
  ];

  // scroll-spy (only when not searching)
  useEffect(() => {
    if (q) return;
    const els = [...document.querySelectorAll("[data-spy]")];
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [q]);

  function jumpTo(id) {
    setQ("");
    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); setActive(id); setFlash(id); setTimeout(() => setFlash(""), 1300); }
    });
  }

  // keyboard: "/" focuses search
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault(); searchRef.current?.focus();
      }
      if (e.key === "Escape") setQ("");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const byCat = (k) => FUNCTIONS.filter((f) => f.cat === k);

  return (
    <div>
      <h2 className="text-xl font-bold mb-1" style={{ color: c.ink }}>Reference</h2>
      <p className="text-sm mb-4" style={{ color: c.muted }}>
        Distilled from the analyzed courses — concepts, patterns and a searchable function library. <span style={{ color: c.rust }}>✓ verified</span> items were read off-screen; PRO+ items were added to reach advanced level.
      </p>

      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-5" style={{ background: c.paper, border: `1px solid ${q ? c.rust : c.line}`, boxShadow: q ? "0 4px 16px rgba(0,0,0,.06)" : "none" }}>
        <Search size={16} color={c.muted} />
        <input
          ref={searchRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search concepts, patterns, functions, DAX…  ( press / )"
          className="flex-1 text-sm outline-none"
          style={{ background: "transparent", color: c.ink }}
        />
        {q && <button onClick={() => setQ("")} className="p-1 rounded-md" style={{ color: c.muted }}><X size={15} /></button>}
      </div>

      <div className="grid" style={{ gridTemplateColumns: "190px 1fr", gap: "24px" }}>
        {/* Legend */}
        <nav className="hidden md:block" style={{ position: "sticky", top: 12, alignSelf: "start", maxHeight: "calc(100vh - 24px)", overflowY: "auto" }}>
          {legend.map((g) => (
            <div key={g.group} className="mb-4">
              <div className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: c.rust }}>{g.group}</div>
              {g.items.map((it) => (
                <button
                  key={it.id}
                  onClick={() => jumpTo(it.id)}
                  className="block w-full text-left text-xs py-1 px-2 rounded-md transition"
                  style={{ color: active === it.id ? c.ink : c.muted, background: active === it.id ? c.violetSoft : "transparent", fontWeight: active === it.id ? 700 : 400, borderLeft: `2px solid ${active === it.id ? c.rust : "transparent"}` }}
                >
                  {it.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Content */}
        <div style={{ minWidth: 0 }}>
          {q ? (
            <SearchResults results={results} tokens={tokens} onJump={jumpTo} />
          ) : (
            <>
              {/* Concepts */}
              <h3 className="text-base font-bold mb-2" style={{ color: c.ink }}>Core concepts</h3>
              <div className="grid md:grid-cols-2 gap-3 mb-7">
                {CONCEPTS.map((x) => (
                  <div key={x.id} id={`concept-${x.id}`} data-spy className="scroll-mt-4">
                    <Card pad="p-4" className={flash === `concept-${x.id}` ? "ring-2" : ""}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-bold" style={{ color: c.ink }}>{x.title}</span>
                        <Tag soft>{x.src}</Tag>
                      </div>
                      <p className="text-xs italic mb-2" style={{ color: c.muted }}>{x.gist}</p>
                      {x.body.map((p, i) => <p key={i} className="text-xs mb-1.5" style={{ color: c.ink }} dangerouslySetInnerHTML={{ __html: mdHtml(p) }} />)}
                      {x.examples?.map((ex, i) => <div key={i} className="mt-2"><Code>{ex.dax}</Code><p className="text-xs mt-1" style={{ color: c.muted }}>{ex.note}{ex.verified && <span style={{ color: c.rust }}> · ✓ verified</span>}</p></div>)}
                      <WatchRefs ids={x.id} />
                    </Card>
                  </div>
                ))}
              </div>

              {/* Patterns */}
              <h3 className="text-base font-bold mb-2" style={{ color: c.ink }}>Patterns</h3>
              <div className="space-y-3 mb-7">
                {PATTERNS.map((p) => (
                  <div key={p.id} id={`pattern-${p.id}`} data-spy className="scroll-mt-4">
                    <Card pad="p-4" className={flash === `pattern-${p.id}` ? "ring-2" : ""}>
                      <div className="flex items-center justify-between mb-1"><span className="text-sm font-bold" style={{ color: c.ink }}>{p.title}</span><Tag soft>{p.src}</Tag></div>
                      <p className="text-xs mb-2" style={{ color: c.muted }}>{p.note}</p>
                      {p.items.map((it, i) => <div key={i} className="mb-2"><Code>{it.dax}</Code><p className="text-xs mt-1" style={{ color: c.muted }}>{it.note}{it.verified && <span style={{ color: c.rust }}> · ✓ verified</span>}</p></div>)}
                      <WatchRefs ids={p.id} />
                    </Card>
                  </div>
                ))}
              </div>

              {/* Function library */}
              <h3 className="text-base font-bold mb-2" style={{ color: c.ink }}>Function library</h3>
              {FN_CATS.map((k) => {
                const fns = byCat(k);
                if (!fns.length) return null;
                return (
                  <div key={k} id={`fncat-${slug(k)}`} data-spy className="scroll-mt-4 mb-5">
                    <div className={`flex items-center gap-2 mb-1.5 rounded-md ${flash === `fncat-${slug(k)}` ? "ring-2" : ""}`}>
                      <CornerDownRight size={14} color={c.rust} />
                      <span className="text-sm font-bold" style={{ color: c.ink }}>{k}</span>
                      <span className="text-xs" style={{ color: c.dim }}>· {fns.length}</span>
                    </div>
                    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${c.line}` }}>
                      <table className="w-full text-xs">
                        <tbody>
                          {fns.map((f, i) => (
                            <tr key={i} style={{ background: c.paper, borderTop: i ? `1px solid ${c.line}` : "none" }}>
                              <td className="px-2.5 py-2 font-bold align-top" style={{ color: c.rust, fontFamily: c.mono, whiteSpace: "nowrap" }}>{f.name}</td>
                              <td className="px-2.5 py-2 align-top" style={{ fontFamily: c.mono, color: c.ink }}>{f.syntax}</td>
                              <td className="px-2.5 py-2 align-top" style={{ fontFamily: c.mono, color: c.muted }}>{f.example}</td>
                              <td className="px-2.5 py-2 align-top text-right" style={{ whiteSpace: "nowrap" }}><SrcLinks src={f.src} at={f.at} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
              <p className="text-xs mt-1" style={{ color: c.dim }}>{FUNCTIONS.length} functions. PRO+ = added beyond the videos; verify against Microsoft Learn (Power BI updates monthly).</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SearchResults({ results, tokens, onJump }) {
  if (!results.length)
    return <div className="text-sm py-10 text-center" style={{ color: c.muted }}><BookOpen size={20} className="mx-auto mb-2" color={c.dim} />No matches. Try a function name, a concept, or a keyword like "filter", "YTD", "rank".</div>;
  return (
    <div>
      <div className="text-xs mb-2" style={{ color: c.muted }}>{results.length} result{results.length > 1 ? "s" : ""}</div>
      <div className="space-y-2">
        {results.map((r, i) => (
          <button key={i} onClick={() => onJump(r.anchor)} className="block w-full text-left rounded-xl p-3 transition hover:shadow-sm" style={{ background: c.paper, border: `1px solid ${c.line}` }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: c.violetSoft, color: KIND_COLOR[r.kind] || c.ink }}>{r.kind}</span>
              <span className="text-sm font-bold" style={{ color: c.ink, fontFamily: r.kind === "Function" ? c.mono : undefined }}><Highlight text={r.title} tokens={tokens} /></span>
              {r.meta && <span className="text-xs ml-auto" style={{ color: c.dim }}>{r.meta}</span>}
            </div>
            {r.code ? (
              <code className="text-xs block" style={{ color: c.muted, fontFamily: c.mono }}><Highlight text={r.code} tokens={tokens} /></code>
            ) : (
              <p className="text-xs" style={{ color: c.muted }}><Highlight text={snippet(r.text, tokens)} tokens={tokens} /></p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
