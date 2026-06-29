// ── Built-in datasets (in-app samples power the live trainers) ───────────────
// The full versions open in Power BI Desktop via the access card.

// Northwind slice (real products, prices, ship countries)
const NW_PRODUCTS = [
  { Product: "Chai", Category: "Beverages", Price: 18 },
  { Product: "Chang", Category: "Beverages", Price: 19 },
  { Product: "Aniseed Syrup", Category: "Condiments", Price: 10 },
  { Product: "Cajun Seasoning", Category: "Condiments", Price: 22 },
  { Product: "Ikura", Category: "Seafood", Price: 31 },
  { Product: "Konbu", Category: "Seafood", Price: 6 },
];
const NW_SALES_RAW = [
  { Country: "Germany", Product: "Chai", Units: 5 },
  { Country: "USA", Product: "Chang", Units: 4 },
  { Country: "Germany", Product: "Aniseed Syrup", Units: 8 },
  { Country: "France", Product: "Cajun Seasoning", Units: 3 },
  { Country: "USA", Product: "Ikura", Units: 2 },
  { Country: "France", Product: "Konbu", Units: 10 },
  { Country: "Germany", Product: "Ikura", Units: 3 },
];
const NW_SALES = NW_SALES_RAW.map((r) => {
  const p = NW_PRODUCTS.find((x) => x.Product === r.Product);
  return { ...r, Category: p.Category, Price: p.Price };
});

const northwind = {
  id: "northwind",
  name: "Northwind",
  blurb: "The classic sales sample — Products and Orders. A clean star to learn modeling, filter context and measures on.",
  tag: "Sales · modeling",
  builtIn: true,
  access: {
    kind: "load",
    connector: "Get Data → OData feed",
    url: "https://services.odata.org/V4/Northwind/Northwind.svc/",
    steps: [
      "Home → Get Data → OData feed, paste the URL above.",
      "Tick Products and Order_Details (+ Orders for dates), then Load.",
      "Confirm the relationship in Model view, then build measures.",
    ],
  },
  tables: { Products: NW_PRODUCTS, Sales: NW_SALES },
  fact: "Sales",
  factRows: NW_SALES,
  dims: ["Country", "Category", "Product"],
  numCols: ["Units", "Price"],
  dateCol: null,
  rel: { dimTable: "Products", factTable: "Sales", dimKey: "Product", factKey: "Product", dimLabel: "Products (dim)", factLabel: "Sales (fact)" },
  measures: [
    { id: "rev", label: "Total Revenue", dax: "Total Revenue = SUMX(Sales, Sales[Units] * RELATED(Products[Price]))", eval: (rs) => rs.reduce((s, r) => s + r.Units * r.Price, 0), fmt: "money" },
    { id: "units", label: "Total Units", dax: "Total Units = SUM(Sales[Units])", eval: (rs) => rs.reduce((s, r) => s + r.Units, 0), fmt: "int" },
    { id: "lines", label: "Order Lines", dax: "Order Lines = COUNTROWS(Sales)", eval: (rs) => rs.length, fmt: "int" },
  ],
  rowValue: { label: "Units × Price", expr: (r) => r.Units * r.Price, dax: "Revenue = Sales[Units] * RELATED(Products[Price])", fmt: "money" },
  concepts: ["filter-context", "measure-vs-column", "relationships", "ranking"],
};

// Coffee shop sample (different column names → proves the trainers re-skin per dataset)
const CS_MENU = [
  { Drink: "Espresso", Category: "Hot", Price: 150 },
  { Drink: "Cappuccino", Category: "Hot", Price: 220 },
  { Drink: "Cold Brew", Category: "Cold", Price: 250 },
  { Drink: "Iced Latte", Category: "Cold", Price: 270 },
  { Drink: "Masala Chai", Category: "Hot", Price: 120 },
  { Drink: "Lemonade", Category: "Cold", Price: 180 },
];
const CS_ORDERS_RAW = [
  { City: "Bengaluru", Drink: "Cappuccino", Cups: 12 },
  { City: "Mumbai", Drink: "Cold Brew", Cups: 9 },
  { City: "Bengaluru", Drink: "Masala Chai", Cups: 20 },
  { City: "Delhi", Drink: "Iced Latte", Cups: 7 },
  { City: "Mumbai", Drink: "Espresso", Cups: 14 },
  { City: "Delhi", Drink: "Lemonade", Cups: 11 },
  { City: "Bengaluru", Drink: "Cold Brew", Cups: 6 },
];
const CS_ORDERS = CS_ORDERS_RAW.map((r) => {
  const m = CS_MENU.find((x) => x.Drink === r.Drink);
  return { ...r, Category: m.Category, Price: m.Price };
});

const coffee = {
  id: "coffee",
  name: "Coffee Shop",
  blurb: "A tiny café chain — Menu and Orders across three cities. Same concepts, totally different columns.",
  tag: "Retail · ₹",
  builtIn: true,
  access: {
    kind: "browse",
    connector: "Get Data → Excel / Text-CSV",
    url: "your own café export, or build a 2-table workbook (Menu + Orders)",
    steps: [
      "Make two sheets: Menu (Drink, Category, Price) and Orders (City, Drink, Cups).",
      "Get Data → Excel, load both, relate them on Drink in Model view.",
      "Write Total Revenue = SUMX(Orders, Orders[Cups] * RELATED(Menu[Price])).",
    ],
  },
  tables: { Menu: CS_MENU, Orders: CS_ORDERS },
  fact: "Orders",
  factRows: CS_ORDERS,
  dims: ["City", "Category", "Drink"],
  numCols: ["Cups", "Price"],
  dateCol: null,
  rel: { dimTable: "Menu", factTable: "Orders", dimKey: "Drink", factKey: "Drink", dimLabel: "Menu (dim)", factLabel: "Orders (fact)" },
  measures: [
    { id: "rev", label: "Total Revenue", dax: "Total Revenue = SUMX(Orders, Orders[Cups] * RELATED(Menu[Price]))", eval: (rs) => rs.reduce((s, r) => s + r.Cups * r.Price, 0), fmt: "money" },
    { id: "cups", label: "Total Cups", dax: "Total Cups = SUM(Orders[Cups])", eval: (rs) => rs.reduce((s, r) => s + r.Cups, 0), fmt: "int" },
    { id: "lines", label: "Order Lines", dax: "Order Lines = COUNTROWS(Orders)", eval: (rs) => rs.length, fmt: "int" },
  ],
  rowValue: { label: "Cups × Price", expr: (r) => r.Cups * r.Price, dax: "Revenue = Orders[Cups] * RELATED(Menu[Price])", fmt: "money" },
  concepts: ["filter-context", "measure-vs-column", "relationships", "ranking"],
};

// SaaS monthly revenue — a dated dataset for time intelligence
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SAAS_BASE = [40, 42, 45, 44, 48, 52, 55, 54, 58, 60, 63, 68];
const SAAS_ROWS = [];
[2023, 2024].forEach((yr) => {
  SAAS_BASE.forEach((v, i) => {
    const k = yr === 2023 ? v : Math.round(v * 1.22 + i * 0.6);
    SAAS_ROWS.push({ Date: `${yr}-${String(i + 1).padStart(2, "0")}-01`, Month: `${MON[i]} ${yr}`, Year: yr, Revenue: k * 1000 });
  });
});

const saas = {
  id: "saas",
  name: "SaaS Revenue",
  blurb: "Two years of monthly subscription revenue — a dated table to learn time intelligence (YoY, MoM, YTD) on.",
  tag: "Time series · $",
  builtIn: true,
  access: {
    kind: "browse",
    connector: "Get Data → Text/CSV or Excel",
    url: "a monthly revenue export with a real Date column",
    steps: [
      "Load a table with a Date column and a Revenue column.",
      "Build a dedicated Date table with CALENDARAUTO() and mark it as a date table.",
      "Relate Date[Date] to the fact, then write TOTALYTD / DATEADD measures.",
    ],
  },
  tables: { Subscriptions: SAAS_ROWS },
  fact: "Subscriptions",
  factRows: SAAS_ROWS,
  dims: ["Year"],
  numCols: ["Revenue"],
  dateCol: "Date",
  rel: null,
  measures: [
    { id: "rev", label: "Total Revenue", dax: "Total Revenue = SUM(Subscriptions[Revenue])", eval: (rs) => rs.reduce((s, r) => s + r.Revenue, 0), fmt: "money" },
  ],
  rowValue: { label: "Revenue", expr: (r) => r.Revenue, dax: "Revenue = Subscriptions[Revenue]", fmt: "money" },
  concepts: ["time-intelligence", "filter-context", "measure-vs-column"],
};

// ── Practice targets (no in-app sample — open straight in Power BI) ──────────
const practice = [
  { id: "fx", name: "FX rates — USD→INR (live)", blurb: "A year of daily exchange rates. Expand the nested JSON, then build a moving-average measure.", tag: "Time intelligence", access: { kind: "load", connector: "Get Data → Web", url: "https://api.frankfurter.dev/v1/2024-01-01..2024-12-31?base=USD&symbols=INR" }, challenge: "Expand the JSON into a date+rate table, then write a 30-day moving-average with AVERAGEX over a date window." },
  { id: "weather", name: "Bengaluru weather (live)", blurb: "Daily max temperatures for 2024. Parallel arrays that need expanding to rows.", tag: "Time series", access: { kind: "load", connector: "Get Data → Web", url: "https://archive-api.open-meteo.com/v1/archive?latitude=12.97&longitude=77.59&start_date=2024-01-01&end_date=2024-12-31&daily=temperature_2m_max" }, challenge: "Expand the daily arrays to rows. Build monthly average max-temp and a month-over-month delta measure." },
  { id: "jsonph", name: "JSONPlaceholder", blurb: "Users, posts and comments — three tables to relate into a chain.", tag: "Relationships", access: { kind: "load", connector: "Get Data → Web", url: "https://jsonplaceholder.typicode.com/users" }, challenge: "Load /users, /posts, /comments as 3 queries. Relate them (userId, postId) and measure comments-per-user across the chain." },
  { id: "owid", name: "Our World in Data", blurb: "Pick any topic you care about and download the full-data CSV.", tag: "Ranking & ALL()", access: { kind: "browse", connector: "any chart → Download → Full data (.csv) → Get Data", url: "https://ourworldindata.org" }, challenge: "Top-10 by a RANKX measure for the latest year, plus a % share measure using ALL() and a continent slicer." },
  { id: "maven", name: "Maven Data Playground", blurb: "Clean practice datasets to reshape into a proper star schema.", tag: "Star schema", access: { kind: "browse", connector: "download a dataset → Get Data → Excel", url: "https://www.mavenanalytics.io/data-playground" }, challenge: "Reshape a flat file into a star schema — one fact, two+ dimensions — before building a single visual." },
];

export const DATASETS = [northwind, coffee, saas];
export const PRACTICE = practice;
