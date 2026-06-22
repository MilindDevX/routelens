# RouteLens — API Directory & Response Diff Tool

**Live Application:** [https://routelens-xi.vercel.app/](https://routelens-xi.vercel.app/)

**A fully client-side, zero-signup, zero-backend developer tool for managing and diffing API routes.**

---

## What This Tool Does

RouteLens solves two real problems developers hit every day:

### Problem 1 — "What endpoints does this API even have?"
Paste any OpenAPI 2.0 (Swagger) or OpenAPI 3.x spec in JSON or YAML format and get an instant, searchable table of every endpoint — method, path, summary, parameters, and response shape. No Swagger UI server required, no install, no signup. All `$ref` references are resolved automatically. If a spec uses external `$ref` URLs (which can't be fetched client-side), a clear warning is shown rather than silent failure.

Alternatively, use **Quick Add** to type routes freehand (`GET /users — list all users`) for APIs with no spec at all, or use **Load from URL** to fetch an OpenAPI spec directly from a live server (e.g. `http://localhost:8000/openapi.json`).

### Project Organization & Export
Group your parsed endpoints using **Project Tags**. This prevents collisions between different APIs (with smart duplicate detection) and lets you filter the directory easily. You can export your entire directory to JSON, or export specifically by project to share with your team.

### Problem 2 — "Did this API response change between versions?"
Paste two JSON blobs and get a structural diff — not a naive line-by-line text diff. Added keys are green, removed keys are red, changed values are amber, type changes (e.g. `string` → `number`) are orange. Arrays of objects are matched by identity keys (`id`, `name`, `slug`, etc.) so a re-ordered list doesn't show up as a mass change.

### Bonus: Baselines
Save a known-good API response as a "baseline" against a saved route. The next time you open that route's diff, the baseline auto-loads as the A (before) side.

---

## How to Run Locally

```bash
git clone https://github.com/<youruser>/routelens.git
cd routelens
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

No environment variables. No API keys. No `.env` file needed.

---

## How It Was Built & Deployed

**Stack:** Next.js 14 (App Router), TypeScript (strict), Tailwind CSS, `js-yaml`, `@heroicons/react`

**Architecture decision:** `output: 'export'` in `next.config.js` produces a fully static site — every page is pre-rendered to HTML at build time with zero server-side code. No serverless functions, no Edge Runtime, no Node.js server needed at deploy time.

**Data storage:** Everything is in `localStorage`. Routes, baselines, and the last diff scratch pad are all stored under namespaced keys (`apid_routes_v1`, etc.). The storage layer is wrapped in a safe utility that never throws — it gracefully handles incognito mode and quota errors with a visible banner.

**Zero outbound calls:** No external API is called at runtime. Fonts are loaded via `next/font/google` which inlines them at build time. The Google Fonts CDN is only hit once at `npm run build`, never by end users.

**Deployed to Vercel Hobby:**
```bash
# 1. Push to GitHub
git push origin main

# 2. Import at vercel.com/new
# Select the repo — Vercel auto-detects Next.js + static export.
# No configuration required. Click Deploy.
```

---



Built by **Milind Bansal** · [milindsk8r@gmail.com](mailto:milindsk8r@gmail.com)  
Built for **Digital Heroes** · [digitalheroesco.com](https://digitalheroesco.com)
