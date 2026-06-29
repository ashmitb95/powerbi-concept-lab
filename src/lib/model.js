// ── The model abstraction ───────────────────────────────────────────────
// Every dataset (built-in or uploaded CSV) is normalized into this shape so the
// concept trainers can run generically against any data. This is the "DAX-lite"
// core: real enough to teach filter context on her actual columns, NOT the real
// VertiPaq engine (that lives in Power BI Desktop — see the "Open in Power BI" step).

const DATE_RE = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}|^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/;

export function inferType(values) {
  const sample = values.filter((v) => v !== null && v !== undefined && v !== "").slice(0, 40);
  if (sample.length === 0) return "text";
  const nums = sample.filter((v) => typeof v === "number" || (typeof v === "string" && v.trim() !== "" && !isNaN(Number(v.replace(/[$,%]/g, "")))));
  const dates = sample.filter((v) => typeof v === "string" && DATE_RE.test(v.trim()));
  if (dates.length >= sample.length * 0.8) return "date";
  if (nums.length >= sample.length * 0.8) return "number";
  return "text";
}

export function inferColumns(rows) {
  if (!rows.length) return [];
  return Object.keys(rows[0]).map((name) => ({
    name,
    type: inferType(rows.map((r) => r[name])),
  }));
}

export const distinctValues = (rows, col) =>
  [...new Set(rows.map((r) => r[col]).filter((v) => v !== null && v !== undefined && v !== ""))];

// ── Aggregations over a set of rows (the building blocks of the measures) ──
export const agg = {
  sum: (rows, col) => rows.reduce((s, r) => s + (Number(r[col]) || 0), 0),
  sumProduct: (rows, a, b) => rows.reduce((s, r) => s + (Number(r[a]) || 0) * (Number(r[b]) || 0), 0),
  count: (rows) => rows.length,
  distinctCount: (rows, col) => distinctValues(rows, col).length,
  average: (rows, col) => (rows.length ? agg.sum(rows, col) / rows.length : 0),
  max: (rows, col) => rows.reduce((m, r) => Math.max(m, Number(r[col]) || -Infinity), -Infinity),
};

// Apply a filter context (a map of column -> selected value, "All" = no filter).
export function applyContext(rows, ctx, ignore = []) {
  return rows.filter((r) =>
    Object.entries(ctx).every(([col, val]) =>
      ignore.includes(col) || val === "All" || String(r[col]) === String(val)
    )
  );
}
