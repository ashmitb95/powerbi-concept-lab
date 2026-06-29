# Power BI Concept Lab

> Learn the *invisible* parts of Power BI — filter context, relationships, measures, DAX — interactively, on data you choose. Then open that data in Power BI Desktop and build for real.

An interactive companion for going from "I can build a simple dashboard" to genuinely fluent in DAX and data modeling. It makes abstract ideas visible with live trainers, hands you a vault of real practice datasets, and pairs you with a Claude tutor — all in a free, static web app.

**Power BI Desktop is where you actually build. This app is a companion and a safety net, not a replacement.**

---

## What's inside

- **Dataset-first learning.** Pick a dataset (or drop your own CSV) and every concept re-skins to *your* columns and values — the `CALCULATE` / `SUMX` examples use your real data, not abstract placeholders.
- **Live concept trainers** (interactive, on an in-app sample):
  - **Filter context** — slice the data and watch a measure recompute; toggle a `CALCULATE(ALL(…))` override.
  - **Measure vs calculated column** — the same formula, two behaviours.
  - **Relationships** — see a filter travel from a dimension to a fact; single vs both cross-filter.
  - **Ranking (RANKX)** — rank members by a measure, with tie-handling and an inline **context-transition** explainer.
  - **Time intelligence** — YoY / MoM / YTD on a dated dataset, with the `DATEADD` / `TOTALYTD` DAX.
- **Bring your own CSV.** Parsed entirely in your browser (it never leaves your machine); the trainers immediately tune to your schema.
- **Reference** — a searchable library of concepts, patterns, and ~50 DAX functions, distilled from six analyzed courses. Every item links out to the **exact YouTube timestamp** where it's taught.
- **Claude tutor, built in** — a "Ask Claude to guide me" button copies a ready-to-paste prompt so Claude can walk you through the app; the Tutor tab generates Claude Project instructions; per-lesson "copy a help prompt" buttons get you unstuck. Free, no API keys — it uses your own Claude subscription.
- **Open in Power BI** — every dataset has a connector + URL + steps to load the full thing in Power BI Desktop.
- **Progress + persistence** — your explored lessons and tutor setup are remembered (localStorage).

## The learning loop

1. **Learn a concept here** on a dataset you pick.
2. **Open that dataset in Power BI Desktop** (the app gives you the exact connector/URL) and rebuild it for real.
3. **Get unstuck** by pasting your DAX/screenshot into your Claude tutor.

## Use it with Claude (agentic guide)

If the app ever feels like a lot, click **"Ask Claude to guide me"** in the top bar. It copies a prompt (including this site's URL) to your clipboard — paste it into Claude Desktop / claude.ai and Claude will orient you and coach you through it. The site also publishes an [`/llms.txt`](public/llms.txt) describing its structure for AI assistants.

## Run it locally

```bash
npm install
npm run dev      # http://localhost:5173
```

Build a static bundle:

```bash
npm run build    # outputs dist/
npm run preview  # serve the production build locally
```

## Deploy

A fully static SPA — host `dist/` anywhere (Vercel, Netlify, Cloudflare Pages, GitHub Pages). No server, no environment variables, no keys.

## Tech

- [Vite](https://vite.dev) + React
- [Tailwind CSS v4](https://tailwindcss.com)
- [lucide-react](https://lucide.dev) icons
- [PapaParse](https://www.papaparse.com) for in-browser CSV parsing

## Design principles (deliberate)

- **No backend, no API keys, fully static & free to host.** The AI tutor is intentionally *not* embedded — you bring your own Claude.
- **Power BI Desktop is the canvas.** The app teaches and previews; the real DAX engine lives in Power BI.
- **Grounded in real data.** Trainers run on a real Northwind slice; the practice vault uses verified live data sources.

## Practice data sources

Built-in samples: **Northwind**, **Coffee Shop**, **SaaS Revenue**. Practice targets you open directly in Power BI include Northwind (OData), live FX rates, Bengaluru weather, JSONPlaceholder, Our World in Data, and Maven Analytics' data playground — plus your own CSV/Excel.

## Credits

Concept explanations, DAX patterns and the function library were distilled from six public Power BI/DAX YouTube courses; each reference entry links back to the source video and timestamp. Verify advanced/PRO+ items against [Microsoft Learn](https://learn.microsoft.com/power-bi/) — Power BI ships monthly.
