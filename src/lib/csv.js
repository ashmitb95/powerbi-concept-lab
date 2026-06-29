import Papa from "papaparse";
import { inferColumns } from "./model.js";

// Parse an uploaded CSV File into a live dataset the trainers can use.
// Everything happens in the browser — her file never leaves the machine.
export function datasetFromCsv(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: ({ data }) => {
        const rows = data.filter((r) => Object.values(r).some((v) => v !== null && v !== ""));
        if (!rows.length) return reject(new Error("No rows found in that file."));
        resolve(buildByoDataset(file.name.replace(/\.[^.]+$/, ""), rows));
      },
      error: reject,
    });
  });
}

function buildByoDataset(name, rows) {
  const cols = inferColumns(rows);
  const dims = cols.filter((c) => c.type === "text").map((c) => c.name);
  const nums = cols.filter((c) => c.type === "number").map((c) => c.name);
  const dateCol = cols.find((c) => c.type === "date")?.name || null;

  const measures = [];
  if (nums.length) {
    const m = nums[0];
    measures.push({
      id: "sum0",
      label: `Total ${m}`,
      dax: `Total ${m} = SUM('${name}'[${m}])`,
      eval: (rs) => rs.reduce((s, r) => s + (Number(r[m]) || 0), 0),
      fmt: "num",
    });
  }
  if (nums.length >= 2) {
    const [a, b] = nums;
    measures.push({
      id: "prod",
      label: `Total ${a}×${b}`,
      dax: `Total ${a}×${b} = SUMX('${name}', '${name}'[${a}] * '${name}'[${b}])`,
      eval: (rs) => rs.reduce((s, r) => s + (Number(r[a]) || 0) * (Number(r[b]) || 0), 0),
      fmt: "num",
    });
  }
  measures.push({
    id: "count",
    label: "Row Count",
    dax: `Row Count = COUNTROWS('${name}')`,
    eval: (rs) => rs.length,
    fmt: "int",
  });

  const rowValue = nums.length
    ? {
        label: nums.length >= 2 ? `${nums[0]} × ${nums[1]}` : nums[0],
        expr: nums.length >= 2 ? (r) => (Number(r[nums[0]]) || 0) * (Number(r[nums[1]]) || 0) : (r) => Number(r[nums[0]]) || 0,
        dax:
          nums.length >= 2
            ? `Value = '${name}'[${nums[0]}] * '${name}'[${nums[1]}]`
            : `Value = '${name}'[${nums[0]}]`,
        fmt: "num",
      }
    : null;

  const concepts = ["filter-context"];
  if (rowValue) concepts.push("measure-vs-column");

  return {
    id: "byo-" + name.toLowerCase().replace(/\s+/g, "-"),
    name,
    blurb: `Your uploaded data — ${rows.length} rows, ${cols.length} columns. Concepts below are tuned to your real columns.`,
    tag: "Your data",
    builtIn: false,
    access: {
      kind: "byo",
      connector: "Get Data → Text/CSV",
      url: file_hint(name),
      steps: [
        "In Power BI Desktop: Home → Get Data → Text/CSV.",
        "Pick the same file you just dropped here.",
        "Click Transform Data to clean it, then Close & Apply.",
      ],
    },
    tables: { [name]: rows },
    fact: name,
    factRows: rows,
    dims: dims.slice(0, 3),
    numCols: nums,
    dateCol,
    rel: null, // single uploaded table — relationships trainer needs 2+ related tables
    measures,
    rowValue,
    concepts,
  };
}

const file_hint = (n) => `${n}.csv (the file you dropped in)`;
