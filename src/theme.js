// Semantic color object mapped onto the supplied @theme palette (see index.css).
// Keys are kept stable so components style via inline tokens; values are the new palette.
export const c = {
  ink: "#17191c",          // near-black text / dark panels
  canvas: "#f7f7f8",       // fog — page background
  paper: "#ffffff",        // cards
  violet: "#5d2a1a",       // rust — primary interactive accent
  violetSoft: "#d3e3fc",   // sky-wash — selection / "in context" highlight + chips
  amber: "#fbe1d1",        // apricot-wash — warm secondary highlight (CALCULATE override)
  green: "#17191c",        // ink — "copied" confirmation
  line: "#e6e6e8",         // hairline borders
  muted: "#4c4c4c",        // ash — secondary text
  graphite: "#777b86",     // dimmer text
  dim: "#a3a6af",          // dove — faint
  rust: "#5d2a1a",
  apricot: "#fbe1d1",
  sky: "#d3e3fc",
  fontSans: "'Sohne', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  fontSerif: "'Signifier', ui-serif, Georgia, serif",
  mono: "ui-monospace, Menlo, Consolas, monospace",
};

export const fmtMoney = (n) => "$" + Math.round(n).toLocaleString();
export const fmtInt = (n) => Math.round(n).toLocaleString();
export const fmtNum = (n) =>
  Number.isInteger(n) ? n.toLocaleString() : n.toLocaleString(undefined, { maximumFractionDigits: 2 });
export const fmtPct = (n) => (n * 100).toFixed(1) + "%";

export const fmtBy = (kind) => (kind === "money" ? fmtMoney : kind === "int" ? fmtInt : fmtNum);
