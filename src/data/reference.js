// ── Reference library ────────────────────────────────────────────────────────
// Distilled from 6 analyzed courses. "src" tags the source video; PRO+ items are
// added to reach advanced level (verify against Microsoft Learn — Power BI ships
// monthly). DAX marked ✓verified was read off-screen; others reconstructed.

export const CONCEPTS = [
  {
    id: "measure-vs-column",
    title: "Measure vs Calculated Column",
    gist: "Same formula, two different things — and choosing wrong bloats your model.",
    body: [
      "A **calculated column** is computed row-by-row at refresh and stored in the table. It sees its own row (row context). Use it for attributes you slice or group BY (an Age Band, a Full Name key).",
      "A **measure** is computed at query time over whatever is on screen, and stored nowhere. It sees the visual's filters (filter context). Use it for every aggregation / KPI — ~95% of real work.",
      "Rule of thumb: if you're aggregating a number for a chart or card, write a measure. Reserve calculated columns for things you slice, group, or relate by.",
    ],
    src: "V5 · V6",
  },
  {
    id: "row-context",
    title: "Row Context",
    gist: "\"Which row am I on?\" — the context a calculated column or an iterator works in.",
    body: [
      "Row context is created automatically inside a calculated column and inside every iterator (the X-functions). It lets the formula reference 'this row's' values.",
      "Its key side effect: **a bare row context does not follow relationships and does not filter other tables.** That's why `SUM('Fact'[Amount])` inside a calculated column on a dimension returns the grand total on every row — the relationship isn't active yet.",
      "To reach across a relationship from inside a row context, use RELATED (to the one-side) or RELATEDTABLE / an iterator (to the many-side).",
    ],
    src: "V6",
  },
  {
    id: "filter-context",
    title: "Filter Context",
    gist: "The set of filters around a measure when it's evaluated — slicers, rows, columns, page filters.",
    body: [
      "Every measure is evaluated inside a filter context: the filters applied through slicers, the axis/rows/columns of the visual, the Filters pane, and active relationships in the model.",
      "Change the filters, change the answer. This is exactly why a card total never equals a single row in a table — the card sees a different filter context.",
      "Filters flow along relationships from the one-side (dimension) to the many-side (fact). CALCULATE is the only function that can deliberately rewrite this context.",
    ],
    src: "V6 · V4",
  },
  {
    id: "context-transition",
    title: "Context Transition (PRO+)",
    gist: "The bridge none of the courses name: how a row context becomes a filter context.",
    body: [
      "When you reference a **measure** (or wrap an expression in CALCULATE) from inside a **row context** — e.g. inside SUMX, or in a calculated column — DAX performs *context transition*: it turns the current row into an equivalent filter context.",
      "Concretely: `SUMX(Customers, [Total Sales])` does NOT compute total sales once. For each customer row, context transition filters Sales to *that customer*, evaluates [Total Sales], then sums the results.",
      "Mental model: every measure reference is silently wrapped in CALCULATE, and CALCULATE converts the surrounding row context into filters. This is the single most important idea for understanding why iterators-over-measures behave the way they do.",
    ],
    src: "PRO+ (absent in all 6 courses)",
  },
  {
    id: "calculate",
    title: "CALCULATE",
    gist: "The most important DAX function — it evaluates an expression in a filter context you modify.",
    body: [
      "`CALCULATE(expression, filter1, filter2, …)` evaluates the expression after **adding, replacing, or removing** filters. Each filter argument is either a boolean predicate (`Country = \"US\"`) or a table function (`ALL(...)`, `FILTER(...)`).",
      "Method that scales (from V6): *write the English sentence first* — 'total sales, but for the United States only' — and the sentence becomes the structure of the DAX.",
      "Multiple comma-separated filters combine with AND. For OR within one column use `IN { }` or `||`. To clear a filter use `ALL` / `REMOVEFILTERS`.",
    ],
    src: "V6 · V5 · V4",
    examples: [
      { dax: 'Total Sales (All Countries) =\nCALCULATE(\n    [Total Sales],\n    REMOVEFILTERS(\'Sales Territory\'[Country])\n)', note: "Grand-total reference (ignore the Country filter).", verified: true, src: "V6" },
      { dax: '% of Total Sales =\nDIVIDE([Total Sales], [Total Sales (All Countries)])', note: "Percent of total.", verified: true, src: "V6" },
      { dax: 'Total Sales (North America) =\nCALCULATE(\n    [Total Sales],\n    \'Sales Territory\'[Country] IN {"United States", "Canada"}\n)', note: "OR across values with IN.", verified: true, src: "V6" },
    ],
  },
];

export const PATTERNS = [
  {
    id: "time-intelligence",
    title: "Time intelligence (needs a Date table)",
    note: "Mark a contiguous Date table first. DATEADD is the master pattern — it works at every hierarchy level.",
    src: "V6",
    items: [
      { dax: "Total Sales YTD =\nTOTALYTD([Total Sales], 'Date'[Date])", note: "Year-to-date.", verified: true },
      { dax: 'Total Sales YTD (Fiscal) =\nTOTALYTD([Total Sales], \'Date\'[Date], "06/30")', note: "Fiscal year ending June 30.", verified: true },
      { dax: "Total Sales PY =\nCALCULATE([Total Sales], DATEADD('Date'[Date], -1, YEAR))", note: "Prior year (same period).", verified: true },
      { dax: "Total Sales PM =\nCALCULATE([Total Sales], DATEADD('Date'[Date], -1, MONTH))", note: "Prior month.", verified: true },
      { dax: "MoM Growth % =\nDIVIDE([Total Sales] - [Total Sales PM], [Total Sales PM])", note: "Month-over-month growth.", verified: true },
    ],
  },
  {
    id: "ranking",
    title: "Ranking (RANKX)",
    note: "RANKX iterates a table, ranks each row by an expression. 4th/5th args control ascending and tie-handling.",
    src: "V3",
    items: [
      { dax: "Sales Rank = RANKX(orders, orders[sales])", note: "Highest = rank 1 (default DESC).", verified: false },
      { dax: "Sales Rank (Low→High) = RANKX(orders, orders[sales], , ASC)", note: "Ascending.", verified: false },
      { dax: "Sales Rank (Dense) = RANKX(orders, orders[sales], , ASC, DENSE)", note: "No gaps after ties.", verified: false },
    ],
  },
  {
    id: "segmentation",
    title: "Segmentation / banding (SWITCH TRUE)",
    note: "SWITCH(TRUE(), …) reads like a clean if/elseif ladder — the standard way to band a measure.",
    src: "V6",
    items: [
      { dax: 'Region Sales Vol =\nSWITCH(TRUE(),\n    \'Sales Territory\'[Region Sales] >= 3000000, "High",\n    \'Sales Territory\'[Region Sales] >= 1000000, "Med",\n    \'Sales Territory\'[Region Sales] >= 0, "Low",\n    "N/A")', note: "Bucket regions by sales.", verified: true },
    ],
  },
  {
    id: "x-pattern",
    title: "The X-pattern (iterators)",
    note: "An X-function does two things: (1) run an expression on every row → a one-column result, (2) aggregate that column.",
    src: "V6",
    items: [
      { dax: "Region Sales =\nSUMX(\n    RELATEDTABLE('Fact Sales'),\n    'Fact Sales'[Sales Amount])", note: "Sum the related fact rows per dimension row.", verified: true },
      { dax: "LastPurchaseDate =\nMAXX(\n    RELATEDTABLE('Fact Sales'),\n    'Fact Sales'[OrderDate])", note: "Most recent order per customer.", verified: true },
    ],
  },
  {
    id: "visual-calcs",
    title: "Visual calculations (2024+)",
    note: "Written on a visual; they see only the fields in that visual. Great for running totals & deltas without a Date table.",
    src: "V6",
    items: [
      { dax: "Running sum = RUNNINGSUM([Total Sales])", note: "Cumulative total along the axis.", verified: true },
      { dax: "Running sum HP = RUNNINGSUM([Total Sales], , HIGHESTPARENT)", note: "Reset at the highest parent.", verified: true },
      { dax: "Versus previous = [Total Sales] - PREVIOUS([Total Sales])", note: "Delta vs the previous row.", verified: true },
    ],
  },
];

// Function library — filterable in the Reference section.
// `at` maps each source video id to the timestamp where the function is taught.
export const FUNCTIONS = [
  // Aggregators
  { name: "SUM", cat: "Aggregator", syntax: "SUM(column)", example: "Total Sales = SUM(Sales[Amount])", src: "V5·V6", at: { V5: "29:36", V6: "1:00:40" } },
  { name: "AVERAGE", cat: "Aggregator", syntax: "AVERAGE(column)", example: "Avg Price = AVERAGE(Sales[Price])", src: "V5", at: { V5: "32:06" } },
  { name: "MIN / MAX", cat: "Aggregator", syntax: "MAX(column)", example: "Latest = MAX(Sales[Date])", src: "V5", at: { V5: "29:36" } },
  { name: "COUNT", cat: "Aggregator", syntax: "COUNT(column)", example: "Count = COUNT(Sales[Name])", src: "V5", at: { V5: "31:44" } },
  { name: "COUNTROWS", cat: "Aggregator", syntax: "COUNTROWS(table)", example: "Orders = COUNTROWS(Sales)", src: "V6", at: { V6: "1:08:05" } },
  { name: "DISTINCTCOUNT", cat: "Aggregator", syntax: "DISTINCTCOUNT(column)", example: "Customers = DISTINCTCOUNT(Sales[CustID])", src: "V5·V6", at: { V5: "37:06", V6: "1:08:05" } },
  // Iterators
  { name: "SUMX", cat: "Iterator", syntax: "SUMX(table, expression)", example: "Rev = SUMX(Sales, Sales[Qty]*Sales[Price])", src: "V5·V6", at: { V5: "33:55", V6: "41:13" } },
  { name: "AVERAGEX", cat: "Iterator", syntax: "AVERAGEX(table, expression)", example: "AvgLine = AVERAGEX(Sales, Sales[Qty]*Sales[Price])", src: "V5", at: { V5: "35:20" } },
  { name: "MAXX / MINX", cat: "Iterator", syntax: "MAXX(table, expression)", example: "LastBuy = MAXX(RELATEDTABLE(Sales), Sales[Date])", src: "V6", at: { V6: "52:32" } },
  { name: "RANKX", cat: "Iterator", syntax: "RANKX(table, expr, , order, ties)", example: "Rank = RANKX(Products, [Total Sales], , DESC, DENSE)", src: "V3", at: { V3: "9:30" } },
  // Filter / context
  { name: "CALCULATE", cat: "Filter / context", syntax: "CALCULATE(expr, filter1, …)", example: 'US = CALCULATE([Total Sales], Geo[Country]="US")', src: "V4·V5·V6", at: { V4: "34:19", V5: "57:22", V6: "1:16:13" } },
  { name: "FILTER", cat: "Filter / context", syntax: "FILTER(table, condition)", example: "CALCULATE([Sales], FILTER(Sales, Sales[Qty]>10))", src: "V5", at: { V5: "60:12" } },
  { name: "ALL", cat: "Filter / context", syntax: "ALL(table | column)", example: "Grand = CALCULATE([Sales], ALL(Products))", src: "V5·V6", at: { V5: "63:41", V6: "1:19:00" } },
  { name: "REMOVEFILTERS", cat: "Filter / context", syntax: "REMOVEFILTERS(column)", example: "All = CALCULATE([Sales], REMOVEFILTERS(Geo[Country]))", src: "V6", at: { V6: "1:26:15" } },
  { name: "ALLEXCEPT", cat: "Filter / context", syntax: "ALLEXCEPT(table, keepCols)", example: "CALCULATE([Sales], ALLEXCEPT(Sales, Sales[Year]))", src: "PRO+" },
  { name: "ALLSELECTED", cat: "Filter / context", syntax: "ALLSELECTED(col)", example: "% = DIVIDE([Sales], CALCULATE([Sales], ALLSELECTED()))", src: "V3", at: { V3: "26:52" } },
  { name: "KEEPFILTERS", cat: "Filter / context", syntax: "KEEPFILTERS(filter)", example: "CALCULATE([Sales], KEEPFILTERS(Geo[Country]=\"US\"))", src: "PRO+" },
  { name: "VALUES", cat: "Filter / context", syntax: "VALUES(column)", example: "Has1 = HASONEVALUE(Geo[Country])", src: "PRO+" },
  // Relationship
  { name: "RELATED", cat: "Relationship", syntax: "RELATED(column)", example: "Cat = RELATED(Products[Category])", src: "V5·V6", at: { V5: "65:05", V6: "20:36" } },
  { name: "RELATEDTABLE", cat: "Relationship", syntax: "RELATEDTABLE(table)", example: "N = COUNTROWS(RELATEDTABLE(Sales))", src: "V5·V6", at: { V5: "70:48", V6: "39:12" } },
  { name: "USERELATIONSHIP", cat: "Relationship", syntax: "USERELATIONSHIP(c1, c2)", example: "CALCULATE([Sales], USERELATIONSHIP(Sales[ShipDate], Date[Date]))", src: "PRO+" },
  { name: "CROSSFILTER", cat: "Relationship", syntax: "CROSSFILTER(c1, c2, dir)", example: "CALCULATE([N], CROSSFILTER(Dim[K], Fact[K], BOTH))", src: "V5", at: { V5: "78:33" } },
  { name: "TREATAS", cat: "Relationship", syntax: "TREATAS(table, column)", example: "Virtual relationship for top-N filtering", src: "PRO+" },
  // Time
  { name: "CALENDAR / CALENDARAUTO", cat: "Time", syntax: "CALENDARAUTO()", example: "Date = CALENDARAUTO()", src: "V5·V3", at: { V5: "8:39", V3: "31:36" } },
  { name: "TOTALYTD", cat: "Time", syntax: "TOTALYTD(expr, dates, [ye])", example: "YTD = TOTALYTD([Sales], 'Date'[Date])", src: "V6", at: { V6: "1:47:52" } },
  { name: "DATEADD", cat: "Time", syntax: "DATEADD(dates, n, unit)", example: "PY = CALCULATE([Sales], DATEADD('Date'[Date],-1,YEAR))", src: "V6", at: { V6: "1:55:03" } },
  { name: "SAMEPERIODLASTYEAR", cat: "Time", syntax: "SAMEPERIODLASTYEAR(dates)", example: "LY = CALCULATE([Sales], SAMEPERIODLASTYEAR('Date'[Date]))", src: "V6", at: { V6: "1:55:03" } },
  { name: "DATESINPERIOD", cat: "Time", syntax: "DATESINPERIOD(dates, end, n, unit)", example: "Rolling3M window", src: "PRO+" },
  { name: "EOMONTH / EDATE", cat: "Date", syntax: "EOMONTH(date, months)", example: "MonthEnd = EOMONTH(Sales[Date], 0)", src: "V5", at: { V5: "23:37" } },
  { name: "DATEDIFF", cat: "Date", syntax: "DATEDIFF(d1, d2, unit)", example: "Days = DATEDIFF(Sales[Order], Sales[Ship], DAY)", src: "V5·V3", at: { V5: "17:09", V3: "6:01" } },
  { name: "WEEKDAY", cat: "Date", syntax: "WEEKDAY(date, type)", example: "DOW = WEEKDAY(Sales[Date], 2)", src: "V5·V2", at: { V5: "28:32", V2: "41:46" } },
  { name: "NETWORKDAYS", cat: "Date", syntax: "NETWORKDAYS(start, end, w, h)", example: "Business days between dates", src: "V5", at: { V5: "26:08" } },
  { name: "FORMAT", cat: "Date", syntax: "FORMAT(value, code)", example: 'Month = FORMAT(Sales[Date], "MMM-yyyy")', src: "V6·V5", at: { V6: "17:04", V5: "47:03" } },
  // Logical
  { name: "IF", cat: "Logical", syntax: "IF(test, then, else)", example: 'Big = IF([Sales]>1000, "Yes", "No")', src: "V6·V5·V4", at: { V6: "13:55", V5: "40:18", V4: "51:17" } },
  { name: "SWITCH", cat: "Logical", syntax: "SWITCH(TRUE(), c1,r1, …, else)", example: "Band with SWITCH(TRUE())", src: "V6·V4", at: { V6: "48:42", V4: "57:44" } },
  { name: "DIVIDE", cat: "Logical", syntax: "DIVIDE(num, den, [alt])", example: "Margin = DIVIDE([Profit], [Sales])", src: "V6·V4", at: { V6: "1:11:40", V4: "31:20" } },
  { name: "IFERROR", cat: "Logical", syntax: "IFERROR(value, alt)", example: "Safe = IFERROR([Ratio], 0)", src: "V5", at: { V5: "41:23" } },
  { name: "AND / OR", cat: "Logical", syntax: "a && b   |   a || b", example: 'IF(x>10 && y="A", …)', src: "V5", at: { V5: "42:27" } },
  { name: "COALESCE", cat: "Logical", syntax: "COALESCE(a, b, …)", example: "Clean = COALESCE(Customers[Score], 0)", src: "V1", at: { V1: "16:16" } },
  // Text
  { name: "LEFT / RIGHT / MID", cat: "Text", syntax: "MID(text, start, n)", example: "Code = LEFT(Sales[SKU], 3)", src: "V5", at: { V5: "50:34" } },
  { name: "LEN", cat: "Text", syntax: "LEN(text)", example: "Length = LEN(Customers[Name])", src: "V5", at: { V5: "50:14" } },
  { name: "SUBSTITUTE", cat: "Text", syntax: "SUBSTITUTE(text, old, new)", example: 'Clean = SUBSTITUTE(Raw[Val], "k", "000")', src: "V5", at: { V5: "53:45" } },
  { name: "CONCATENATE / &", cat: "Text", syntax: 'a & " " & b', example: "Full = First & \" \" & Last", src: "V5·V6", at: { V5: "48:27", V6: "8:43" } },
  { name: "SEARCH", cat: "Text", syntax: "SEARCH(find, text, [start], [nf])", example: "Pos = SEARCH(\"x\", Name, 1, 0)", src: "V5", at: { V5: "56:37" } },
  // Table-gen
  { name: "ADDCOLUMNS", cat: "Table", syntax: "ADDCOLUMNS(table, name, expr)", example: "Date table year/month columns", src: "V3", at: { V3: "32:50" } },
  { name: "SUMMARIZE", cat: "Table", syntax: "SUMMARIZE(table, groupCols, …)", example: "Group-by table", src: "PRO+" },
  { name: "TOPN", cat: "Table", syntax: "TOPN(n, table, orderBy)", example: "Top5 = TOPN(5, Products, [Sales])", src: "V6", at: { V6: "3:02:30" } },
  // Visual calcs
  { name: "RUNNINGSUM", cat: "Visual calc", syntax: "RUNNINGSUM([measure])", example: "Running = RUNNINGSUM([Total Sales])", src: "V6", at: { V6: "2:13:09" } },
  { name: "PREVIOUS", cat: "Visual calc", syntax: "PREVIOUS([measure])", example: "Δ = [Sales] - PREVIOUS([Sales])", src: "V6", at: { V6: "2:24:47" } },
];

export const FN_CATS = ["Aggregator", "Iterator", "Filter / context", "Relationship", "Time", "Date", "Logical", "Text", "Table", "Visual calc"];

export const SOURCES = [
  { id: "V1", title: "Learn Power BI FAST – Beginner Crash Course", yt: "WdCltDhmRLo" },
  { id: "V2", title: "Learn Power BI in Under 3 Hours", yt: "I0vQ_VLZTWg" },
  { id: "V3", title: "Power BI Advanced Tutorial", yt: "7M1_N0fuWgc" },
  { id: "V4", title: "Learn 80% of DAX in an Hour", yt: "lD7TvkoQ6rY" },
  { id: "V5", title: "Power BI DAX Tutorial – Beginner to Advanced", yt: "4rC9Ow76n0U" },
  { id: "V6", title: "Master DAX in ONE Course (2025)", yt: "b0yWfnb2Vbw" },
];

const SRC_BY_ID = Object.fromEntries(SOURCES.map((s) => [s.id, s]));

// Build a YouTube deep link that opens at the given timestamp ("H:MM:SS" or "MM:SS").
export function ytUrl(srcId, t) {
  const v = SRC_BY_ID[srcId];
  if (!v) return null;
  const base = `https://www.youtube.com/watch?v=${v.yt}`;
  if (t == null) return base;
  const secs = String(t).split(":").map(Number).reduce((a, n) => a * 60 + n, 0);
  return `${base}&t=${secs}s`;
}

export const srcTitle = (id) => SRC_BY_ID[id]?.title || id;

// Per-topic "watch this on YouTube" jump points. Keys match concept & pattern ids.
export const VIDEO_REFS = {
  "measure-vs-column": [
    { src: "V6", t: "4:03", label: "Columns vs measures" },
    { src: "V5", t: "2:10", label: "Calc column vs measure" },
  ],
  "row-context": [{ src: "V6", t: "10:34", label: "Row context, explained" }],
  "filter-context": [
    { src: "V6", t: "58:09", label: "Filter context defined" },
    { src: "V4", t: "19:59", label: "Evaluation context (plain English)" },
  ],
  "context-transition": [{ src: "V6", t: "41:13", label: "Closest: the X-pattern" }],
  calculate: [
    { src: "V6", t: "1:16:13", label: "CALCULATE walkthrough" },
    { src: "V4", t: "34:19", label: "CALCULATE — the boxer analogy" },
    { src: "V5", t: "57:22", label: "CALCULATE + ALL + FILTER" },
  ],
  "time-intelligence": [
    { src: "V6", t: "1:44:30", label: "Time intelligence + date table" },
    { src: "V6", t: "1:55:03", label: "DATEADD prior year / YoY" },
  ],
  ranking: [{ src: "V3", t: "9:30", label: "RANKX + tie handling" }],
  segmentation: [{ src: "V6", t: "48:42", label: "SWITCH(TRUE()) banding" }],
  "x-pattern": [{ src: "V6", t: "41:13", label: "The X-pattern" }],
  "visual-calcs": [{ src: "V6", t: "2:13:09", label: "Visual calculations" }],
};

// Extra go-deeper docs for trainer-only concepts (kept out of the Reference "Core concepts" grid to avoid duplicating the Patterns section).
const EXTRA_DOCS = {
  ranking: {
    id: "ranking",
    title: "Ranking & context transition",
    gist: "RANKX ranks each member by a measure — and quietly demonstrates context transition.",
    body: [
      "`RANKX(ALL(table[col]), [Measure])` walks every member, evaluates the measure **for that member**, then ranks the results.",
      "Why it works: referencing a measure inside RANKX's row context triggers **context transition** — the current row becomes a filter, so `[Total Sales]` means *this member's* sales.",
      "4th arg = ASC / DESC; 5th arg = SKIP (gaps after ties: 1, 2, 2, 4) or DENSE (no gaps: 1, 2, 2, 3).",
    ],
    src: "V3",
  },
  "time-intelligence": {
    id: "time-intelligence",
    title: "Time intelligence",
    gist: "Compare periods — YoY, MoM, YTD — with DATEADD and a Date table.",
    body: [
      "First requirement: a dedicated, contiguous **Date table**, related to your fact and marked as a date table.",
      "`DATEADD('Date'[Date], -1, YEAR)` shifts the current filter context back a year — wrap it in CALCULATE for prior-year values at any level.",
      "`TOTALYTD([Measure], 'Date'[Date])` accumulates from the start of the year; pass a fiscal year-end like `\"06/30\"` for fiscal YTD.",
    ],
    src: "V6",
  },
};

export const conceptDoc = (id) => CONCEPTS.find((x) => x.id === id) || EXTRA_DOCS[id] || null;
