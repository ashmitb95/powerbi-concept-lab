import { useState, useMemo } from "react";
import { Zap, ArrowRight } from "lucide-react";
import { c, fmtBy } from "./theme.js";
import { applyContext, distinctValues } from "./lib/model.js";
import { Pill, Slicer, Try, Takeaway, Code, usePager, Pager } from "./ui.jsx";

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const PAGE = 12; // rows per page in trainer tables

// ── FILTER CONTEXT ──────────────────────────────────────────────────────────
export function FilterContext({ ds }) {
  const dims = ds.dims.slice(0, 3);
  const [ctx, setCtx] = useState(Object.fromEntries(dims.map((d) => [d, "All"])));
  const [mId, setMId] = useState(ds.measures[0].id);
  const [override, setOverride] = useState(false);
  const firstDim = dims[0];
  const measure = ds.measures.find((m) => m.id === mId);
  const fmt = fmtBy(measure.fmt);

  const ignore = override ? [firstDim] : [];
  const inCtx = (r) => applyContext([r], ctx, ignore).length === 1;
  const rows = ds.factRows.filter(inCtx);
  const value = measure.eval(rows);
  // Show in-context rows first so the highlight is visible on page 1, then the rest — paginated.
  const ordered = rows.length === ds.factRows.length ? ds.factRows : [...rows, ...ds.factRows.filter((r) => !inCtx(r))];
  const pager = usePager(ordered, PAGE, JSON.stringify(ctx) + override + mId);

  const formula = override
    ? `${measure.label} (ignore ${firstDim}) =\nCALCULATE( [${measure.label}], ALL(${ds.fact}[${firstDim}]) )`
    : measure.dax;

  return (
    <div>
      <p className="text-sm mb-3" style={{ color: c.muted }}>
        A measure has no fixed value — it recomputes against whatever rows survive the current filters. That gap is exactly why a card total never equals a single row in a table.
      </p>
      <Try>Pick a {firstDim}, then add another slicer, and watch the highlighted rows — and the big number — shrink. Then hit the override to ignore the {firstDim} filter with <code>ALL()</code>.</Try>

      <div className="flex flex-wrap gap-4 mb-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: c.muted }}>Measure</div>
          <div className="flex gap-1.5 flex-wrap">
            {ds.measures.map((m) => <Pill key={m.id} active={mId === m.id} onClick={() => setMId(m.id)}>{m.label}</Pill>)}
          </div>
        </div>
        {dims.map((d) => (
          <Slicer key={d} label={`${d} slicer`} options={distinctValues(ds.factRows, d)} value={ctx[d]} onChange={(v) => setCtx({ ...ctx, [d]: v })} />
        ))}
      </div>

      <button
        onClick={() => setOverride((o) => !o)}
        className="mb-4 inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition"
        style={{ background: override ? c.amber : c.paper, color: c.ink, border: `1px solid ${override ? c.rust : c.line}` }}
      >
        <Zap size={14} /> {override ? `CALCULATE override ON — ${firstDim} filter ignored` : `Wrap in CALCULATE( …, ALL(${firstDim}) )`}
      </button>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${c.line}` }}>
            <table className="w-full text-xs">
              <thead><tr style={{ background: c.canvas }}>
                {dims.map((h) => <th key={h} className="text-left px-2.5 py-2 font-bold">{h}</th>)}
                {ds.rowValue && <th className="text-left px-2.5 py-2 font-bold" style={{ color: c.muted }}>{ds.rowValue.label}</th>}
              </tr></thead>
              <tbody>
                {pager.slice.map((r, i) => {
                  const on = inCtx(r);
                  return (
                    <tr key={i} style={{ background: on ? c.violetSoft : c.paper, opacity: on ? 1 : 0.38 }}>
                      {dims.map((d) => <td key={d} className="px-2.5 py-2">{String(r[d])}</td>)}
                      {ds.rowValue && <td className="px-2.5 py-2" style={{ color: c.muted }}>{fmtBy(ds.rowValue.fmt)(ds.rowValue.expr(r))}</td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="text-xs mt-1.5 flex items-center gap-1.5" style={{ color: c.muted }}>
            <span className="inline-block w-3 h-3 rounded" style={{ background: c.violetSoft }} /> highlighted = inside the current filter context
          </div>
          <Pager pager={pager} note={ds.factRows.length > PAGE ? "full dataset opens in Power BI" : ""} />
        </div>

        <div className="rounded-xl p-4 flex flex-col justify-center" style={{ background: c.ink }}>
          <code className="text-xs mb-3 block whitespace-pre-wrap" style={{ color: c.apricot, fontFamily: c.mono }}>{formula}</code>
          <div className="text-4xl font-bold mb-2" style={{ color: "#fff" }}>{fmt(value)}</div>
          <div className="text-xs" style={{ color: c.dim, fontFamily: c.mono }}>
            {rows.length} of {ds.factRows.length} rows in context{override ? ` · ${firstDim} overridden by ALL()` : ""}
          </div>
        </div>
      </div>
      <Takeaway>A measure is a formula <em>plus</em> the filters currently around it. Change the filters, change the answer — and <code>CALCULATE</code> is how you deliberately rewrite those filters.</Takeaway>
    </div>
  );
}

// ── MEASURE VS COLUMN ───────────────────────────────────────────────────────
export function MeasureVsColumn({ ds }) {
  const [mode, setMode] = useState("column");
  const dim = ds.dims[0];
  const [val, setVal] = useState("All");
  const rv = ds.rowValue;
  const fmt = fmtBy(rv.fmt);
  const rows = ds.factRows.filter((r) => val === "All" || String(r[dim]) === String(val));
  const measureVal = rows.reduce((s, r) => s + rv.expr(r), 0);
  const rhs = rv.dax.split("=").slice(1).join("=").trim();
  const pager = usePager(ds.factRows, PAGE, mode + val);

  return (
    <div>
      <p className="text-sm mb-3" style={{ color: c.muted }}>
        Same formula, two different things. A <strong>calculated column</strong> runs once per row at refresh and is stored (row context). A <strong>measure</strong> runs at query time over whatever's on screen and stores nothing (filter context).
      </p>
      <Try>Switch between the two. The column drops a value into <em>every</em> row; the measure shows one number that reacts to the slicer.</Try>

      <div className="flex gap-1.5 mb-4">
        <Pill active={mode === "column"} onClick={() => setMode("column")}>As a calculated column</Pill>
        <Pill active={mode === "measure"} onClick={() => setMode("measure")}>As a measure</Pill>
      </div>

      {mode === "measure" && (
        <div className="mb-3"><Slicer label={`${dim} slicer`} options={distinctValues(ds.factRows, dim)} value={val} onChange={setVal} /></div>
      )}

      <Code>{mode === "column" ? rv.dax + "   (new column — stored per row)" : `Total = SUMX(${ds.fact}, ${rhs})   (measure — reacts to filters)`}</Code>

      <div className="rounded-xl overflow-hidden mt-3" style={{ border: `1px solid ${c.line}` }}>
        <table className="w-full text-xs">
          <thead><tr style={{ background: c.canvas }}>
            {ds.dims.slice(0, 2).map((h) => <th key={h} className="text-left px-2.5 py-2 font-bold">{h}</th>)}
            {mode === "column" && <th className="text-left px-2.5 py-2 font-bold" style={{ color: c.rust }}>{rv.label} ▸ stored per row</th>}
          </tr></thead>
          <tbody>
            {pager.slice.map((r, i) => (
              <tr key={i} style={{ background: c.paper }}>
                {ds.dims.slice(0, 2).map((d) => <td key={d} className="px-2.5 py-2">{String(r[d])}</td>)}
                {mode === "column" && <td className="px-2.5 py-2 font-semibold" style={{ color: c.rust }}>{fmt(rv.expr(r))}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager pager={pager} note={ds.factRows.length > PAGE ? "full dataset opens in Power BI" : ""} />

      {mode === "measure" && (
        <div className="rounded-xl p-4 mt-3 flex items-center justify-between" style={{ background: c.violetSoft }}>
          <span className="text-xs font-semibold" style={{ color: c.ink }}>One number, no column, reacts to the slicer →</span>
          <span className="text-2xl font-bold" style={{ color: c.ink }}>{fmt(measureVal)}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
        <div className="rounded-xl p-3" style={{ background: c.paper, border: `1px solid ${c.line}` }}>
          <div className="font-bold mb-1">Calculated column</div>
          <ul className="space-y-0.5" style={{ color: c.muted }}><li>Row context — sees its own row</li><li>Computed at refresh, stored</li><li>Takes memory; can bloat the model</li><li>Good for slicing / grouping keys</li></ul>
        </div>
        <div className="rounded-xl p-3" style={{ background: c.paper, border: `1px solid ${c.line}` }}>
          <div className="font-bold mb-1">Measure</div>
          <ul className="space-y-0.5" style={{ color: c.muted }}><li>Filter context — sees the visual</li><li>Computed at query time, stored nowhere</li><li>Near-zero memory</li><li>Good for every aggregation / KPI</li></ul>
        </div>
      </div>
      <Takeaway>Aggregating a number for a chart or card? Reach for a measure. Save calculated columns for things you slice or group <em>by</em>.</Takeaway>
    </div>
  );
}

// ── RELATIONSHIPS ───────────────────────────────────────────────────────────
export function Relationships({ ds }) {
  const rel = ds.rel;
  const [val, setVal] = useState("All");
  const [both, setBoth] = useState(false);
  const measure = ds.measures[0];
  const fmt = fmtBy(measure.fmt);
  const dimVals = distinctValues(ds.tables[rel.dimTable], rel.dimKey);
  const factRows = ds.factRows.filter((r) => val === "All" || String(r[rel.factKey]) === String(val));
  const total = measure.eval(factRows);
  const filtered = val !== "All";

  return (
    <div>
      <p className="text-sm mb-3" style={{ color: c.muted }}>
        Relationships are one-way streets. A filter on the dimension ({rel.dimTable}) flows <em>down the arrow</em> into the fact ({rel.factTable}). Filtering the fact doesn't flow back — unless you force it bidirectional, which you usually shouldn't.
      </p>
      <Try>Pick a single {rel.dimKey} and watch the filter cross the arrow into {rel.factTable} and shrink its total. Then flip cross-filter to <strong>Both</strong>.</Try>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: c.muted }}>Slice {rel.dimTable}:</span>
        {["All", ...dimVals].map((r) => <Pill key={r} active={val === r} onClick={() => setVal(r)}>{r}</Pill>)}
      </div>

      <div className="flex items-center justify-center gap-3 md:gap-6 my-6 flex-wrap">
        <div className="rounded-xl overflow-hidden" style={{ border: `2px solid ${filtered ? c.rust : c.line}` }}>
          <div className="px-3 py-1.5 text-xs font-bold" style={{ background: c.violetSoft, color: c.ink }}>{rel.dimLabel}</div>
          {dimVals.map((r) => <div key={r} className="px-3 py-1.5 text-xs" style={{ background: val === r ? c.rust : c.paper, color: val === r ? "#fff" : c.ink }}>{r}</div>)}
        </div>
        <div className="flex flex-col items-center">
          <ArrowRight size={26} color={filtered ? c.rust : c.dim} />
          <span className="text-xs mt-1" style={{ color: filtered ? c.rust : c.dim }}>1 → ∗</span>
          {both && <span className="text-xs" style={{ color: c.rust }}>← both</span>}
        </div>
        <div className="rounded-xl overflow-hidden" style={{ border: `2px solid ${c.line}` }}>
          <div className="px-3 py-1.5 text-xs font-bold" style={{ background: c.canvas }}>{rel.factLabel}</div>
          {ds.factRows.map((r, i) => {
            const on = val === "All" || String(r[rel.factKey]) === String(val);
            return (
              <div key={i} className="px-3 py-1.5 text-xs flex gap-3" style={{ background: on ? c.paper : c.canvas, opacity: on ? 1 : 0.35 }}>
                <span className="w-20 truncate">{String(r[rel.factKey])}</span>
                <span style={{ color: c.muted }}>{fmtBy(ds.rowValue.fmt)(ds.rowValue.expr(r))}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl p-3" style={{ background: c.ink }}>
        <button onClick={() => setBoth((b) => !b)} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: both ? c.amber : "#33343a", color: both ? c.ink : "#fff" }}>
          Cross-filter: {both ? "Both directions" : "Single (default)"}
        </button>
        <div className="text-right">
          <div className="text-xs" style={{ color: c.dim }}>{rel.factTable} total in context</div>
          <div className="text-2xl font-bold" style={{ color: "#fff" }}>{fmt(total)}</div>
        </div>
      </div>
      {both && <p className="text-xs mt-2" style={{ color: c.muted }}>With both-direction cross-filtering, filtering {rel.factTable} would also shrink {rel.dimTable} — handy occasionally, but it invites ambiguous filter paths and slower models. Default to single.</p>}
      <Takeaway>Filters travel from the “one” side to the “many” side along the relationship arrow. The dimension filters the fact, not the reverse.</Takeaway>
    </div>
  );
}

// ── RANKX / CONTEXT TRANSITION ──────────────────────────────────────────────
export function RankX({ ds }) {
  const dims = ds.dims;
  const [dim, setDim] = useState(dims[dims.length - 1] || dims[0]);
  const [mId, setMId] = useState(ds.measures[0].id);
  const [asc, setAsc] = useState(false);
  const [dense, setDense] = useState(false);
  const measure = ds.measures.find((m) => m.id === mId);
  const fmt = fmtBy(measure.fmt);

  const members = distinctValues(ds.factRows, dim).map((v) => ({ v, val: measure.eval(ds.factRows.filter((r) => String(r[dim]) === String(v))) }));
  members.sort((a, b) => (asc ? a.val - b.val : b.val - a.val));
  let skip = 0, dn = 0, prev = null;
  members.forEach((m, i) => { if (prev === null || m.val !== prev) { skip = i + 1; dn += 1; prev = m.val; } m.rank = dense ? dn : skip; });

  const dax = `Rank by ${measure.label} =\nRANKX(\n    ALL(${ds.fact}[${dim}]),\n    [${measure.label}], ,\n    ${asc ? "ASC" : "DESC"}, ${dense ? "DENSE" : "SKIP"}\n)`;
  const maxVal = Math.max(...members.map((m) => m.val), 1);
  const pager = usePager(members, PAGE, dim + mId + asc + dense);

  return (
    <div>
      <p className="text-sm mb-3" style={{ color: c.muted }}>
        RANKX walks every {dim} and ranks it by a measure. The subtle bit: each row's measure is evaluated <em>for that {dim}</em> — that's <strong>context transition</strong> turning the row into a filter.
      </p>
      <Try>Switch the order and the tie-handling and watch the rank column change. SKIP leaves gaps after ties (1, 2, 2, 4); DENSE doesn't (1, 2, 2, 3).</Try>

      <div className="flex flex-wrap gap-4 mb-4">
        <div><div className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: c.muted }}>Rank by</div>
          <div className="flex gap-1.5 flex-wrap">{ds.measures.map((m) => <Pill key={m.id} active={mId === m.id} onClick={() => setMId(m.id)}>{m.label}</Pill>)}</div></div>
        {dims.length > 1 && <div><div className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: c.muted }}>Of each</div>
          <div className="flex gap-1.5 flex-wrap">{dims.map((d) => <Pill key={d} active={dim === d} onClick={() => setDim(d)}>{d}</Pill>)}</div></div>}
        <div><div className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: c.muted }}>Order</div>
          <div className="flex gap-1.5"><Pill active={!asc} onClick={() => setAsc(false)}>DESC</Pill><Pill active={asc} onClick={() => setAsc(true)}>ASC</Pill></div></div>
        <div><div className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: c.muted }}>Ties</div>
          <div className="flex gap-1.5"><Pill active={!dense} onClick={() => setDense(false)}>SKIP</Pill><Pill active={dense} onClick={() => setDense(true)}>DENSE</Pill></div></div>
      </div>

      <Code>{dax}</Code>

      <div className="rounded-xl overflow-hidden mt-3" style={{ border: `1px solid ${c.line}` }}>
        <table className="w-full text-xs">
          <thead><tr style={{ background: c.canvas }}>
            <th className="text-left px-2.5 py-2 font-bold" style={{ width: 50 }}>Rank</th>
            <th className="text-left px-2.5 py-2 font-bold">{dim}</th>
            <th className="text-left px-2.5 py-2 font-bold">{measure.label}</th>
          </tr></thead>
          <tbody>
            {pager.slice.map((m, i) => (
              <tr key={i} style={{ background: c.paper }}>
                <td className="px-2.5 py-2 font-bold" style={{ color: c.rust }}>{m.rank}</td>
                <td className="px-2.5 py-2">{String(m.v)}</td>
                <td className="px-2.5 py-2"><div className="flex items-center gap-2">
                  <span style={{ display: "inline-block", height: 8, borderRadius: 3, background: c.violetSoft, width: `${(m.val / maxVal) * 100}px` }} />
                  <span style={{ color: c.muted }}>{fmt(m.val)}</span>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager pager={pager} />

      <div className="rounded-lg p-2.5 mt-3 text-xs" style={{ background: c.apricot }}>
        <strong>Context transition:</strong> inside <code>RANKX</code>, referencing <code>[{measure.label}]</code> silently wraps it in CALCULATE, so each row is filtered to its own {dim}. Without that, every row would show the grand total.
      </div>
      <Takeaway>RANKX = iterate members, evaluate a measure per member (context transition), then rank. The 4th/5th args set direction and how ties are counted.</Takeaway>
    </div>
  );
}

// ── TIME INTELLIGENCE (DATEADD / YoY / YTD) ─────────────────────────────────
function Metric({ label, value, sub, accent }) {
  return (
    <div className="rounded-xl p-3" style={{ background: accent ? c.ink : c.paper, border: `1px solid ${accent ? c.ink : c.line}` }}>
      <div className="text-xs" style={{ color: accent ? c.dim : c.muted }}>{label}</div>
      <div className="text-lg font-bold" style={{ color: accent ? "#fff" : c.ink }}>{value}</div>
      {sub && <div className="text-xs" style={{ color: accent ? c.apricot : c.muted }}>{sub}</div>}
    </div>
  );
}

export function TimeIntel({ ds }) {
  const measure = ds.measures[0];
  const fmt = fmtBy(measure.fmt);
  const periods = useMemo(() => {
    const map = new Map();
    ds.factRows.forEach((r) => {
      const d = new Date(r[ds.dateCol]);
      const y = d.getFullYear(), m = d.getMonth() + 1;
      const key = `${y}-${String(m).padStart(2, "0")}`;
      if (!map.has(key)) map.set(key, { key, y, m, label: `${MON[m - 1]} ${y}`, rows: [] });
      map.get(key).rows.push(r);
    });
    return [...map.values()].sort((a, b) => a.key.localeCompare(b.key)).map((p) => ({ ...p, val: measure.eval(p.rows) }));
  }, [ds]);

  const [sel, setSel] = useState(periods.length - 1);
  const cur = periods[sel];
  const byKey = Object.fromEntries(periods.map((p) => [p.key, p]));
  const pm = periods[sel - 1];
  const py = byKey[`${cur.y - 1}-${String(cur.m).padStart(2, "0")}`];
  const yoy = py ? (cur.val - py.val) / py.val : null;
  const mom = pm ? (cur.val - pm.val) / pm.val : null;
  const ytd = periods.filter((p) => p.y === cur.y && p.m <= cur.m).reduce((s, p) => s + p.val, 0);
  const maxVal = Math.max(...periods.map((p) => p.val), 1);
  const L = measure.label;

  return (
    <div>
      <p className="text-sm mb-3" style={{ color: c.muted }}>
        Time intelligence compares one period to another. Pick a month, then read its prior-year, prior-month and year-to-date values — exactly what DATEADD and TOTALYTD compute for you.
      </p>
      <Try>Click a bar to pick a month. The current month is rust; the same month last year is highlighted so you can see what YoY is comparing.</Try>

      <div className="flex items-end gap-1 mb-1" style={{ height: 120 }}>
        {periods.map((p, i) => {
          const isCur = i === sel, isPy = py && p.key === py.key;
          return <button key={p.key} onClick={() => setSel(i)} title={`${p.label}: ${fmt(p.val)}`} className="flex-1 rounded-t transition" style={{ height: `${(p.val / maxVal) * 100}%`, background: isCur ? c.rust : isPy ? c.apricot : c.violetSoft, minWidth: 4 }} />;
        })}
      </div>
      <div className="text-xs mb-4" style={{ color: c.muted }}>{periods[0].label} → {periods[periods.length - 1].label} · selected <strong style={{ color: c.ink }}>{cur.label}</strong></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        <Metric label={cur.label} value={fmt(cur.val)} accent />
        <Metric label="Prior year" value={py ? fmt(py.val) : "—"} sub={yoy != null ? `YoY ${(yoy * 100).toFixed(1)}%` : "no prior year"} />
        <Metric label="Prior month" value={pm ? fmt(pm.val) : "—"} sub={mom != null ? `MoM ${(mom * 100).toFixed(1)}%` : "—"} />
        <Metric label="Year to date" value={fmt(ytd)} sub={`through ${cur.label}`} />
      </div>

      <Code>{`${L} PY  = CALCULATE([${L}], DATEADD('Date'[Date], -1, YEAR))\nYoY %   = DIVIDE([${L}] - [${L} PY], [${L} PY])\n${L} YTD = TOTALYTD([${L}], 'Date'[Date])`}</Code>
      <Takeaway>DATEADD shifts the whole filter context by a period (and works at any level); TOTALYTD accumulates from the start of the year. Both need a real, marked Date table.</Takeaway>
    </div>
  );
}

export const TRAINERS = {
  "filter-context": { title: "Filter context", comp: FilterContext, blurb: "Why one measure shows different numbers in different places." },
  "measure-vs-column": { title: "Measure vs column", comp: MeasureVsColumn, blurb: "Same formula, two behaviours — and when to use each." },
  "relationships": { title: "Relationships", comp: Relationships, blurb: "How a filter travels from one table to another." },
  "ranking": { title: "Ranking (RANKX)", comp: RankX, blurb: "Rank members by a measure — and meet context transition." },
  "time-intelligence": { title: "Time intelligence", comp: TimeIntel, blurb: "YoY, MoM and YTD with DATEADD and a date table." },
};
