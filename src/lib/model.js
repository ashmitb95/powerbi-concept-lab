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

// A numeric column is really a *dimension* (something you slice/group BY) — not a
// measure to sum — when it's a year/month/etc., or a low-cardinality integer code.
// (Summing a Year column is meaningless; it should behave like a category.)
function looksDimensionalNumber(name, rows) {
  if (/\b(year|yr|fy|quarter|qtr|month|week|weekday|day|dayofweek|hour|rating|stars?)\b/i.test(name)) return true;
  const vals = rows.map((r) => r[name]).filter((v) => v !== null && v !== undefined && v !== "");
  if (!vals.length) return false;
  const allInt = vals.slice(0, 200).every((v) => Number.isInteger(Number(v)));
  return allInt && new Set(vals).size <= 24;
}

// Split a table's columns into dimensions (slice/group by), measures (aggregate),
// and a date column — smarter than "text=dim, number=measure".
export function classifyColumns(rows) {
  const cols = inferColumns(rows);
  const dims = [], nums = [];
  let dateCol = null;
  for (const col of cols) {
    if (col.type === "date") { if (!dateCol) dateCol = col.name; continue; }
    if (col.type === "number" && !looksDimensionalNumber(col.name, rows)) nums.push(col.name);
    else dims.push(col.name);
  }
  return { cols, dims, nums, dateCol };
}

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
