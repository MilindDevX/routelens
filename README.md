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

## Pre-Submission Checklist

| Requirement | Status | Where |
|---|---|---|
| Tool produces real, correct output — not a mock | ✅ | Parser runs against real OpenAPI specs; diff is live structural comparison |
| "Built for Digital Heroes" button with exact label | ✅ | [`Navigation.tsx`](src/components/Navigation.tsx) — header, id=`built-for-digital-heroes` |
| Links to `https://digitalheroesco.com` | ✅ | Same button + footer |
| Name visible in footer | ✅ | [`layout.tsx`](src/app/layout.tsx) — "Built by Milind Bansal" |
| Email visible in footer | ✅ | [`layout.tsx`](src/app/layout.tsx) — `milindsk8r@gmail.com` (mailto link) |
| Builds on Vercel Hobby free plan | ✅ | Static export — zero serverless functions, zero paid add-ons |
| No ads, popups, login flow | ✅ | Pure tool; no auth |
| Zero outbound network calls at runtime | ✅ | No fetch/axios to any external domain; fonts via next/font (build-time only) |
| No API keys or env vars required | ✅ | `npm install && npm run dev` — nothing else needed |
| localStorage unavailable → graceful degradation | ✅ | [`StorageBanner.tsx`](src/components/StorageBanner.tsx) shown when storage check fails |
| Parser degrades gracefully on bad `$ref` | ✅ | External refs show warning banner, not a crash |
| Diff handles malformed/non-JSON input | ✅ | [`parseJsonSafe`](src/lib/diff.ts) returns typed error, textarea shows inline error |
| Diff handles type changes (string→number) | ✅ | `type-changed` status with orange chip + both types shown |
| Diff handles reordered arrays | ✅ | Identity-key matching in [`diff.ts`](src/lib/diff.ts); positional fallback with note |
| Code clean enough for public GitHub repo | ✅ | Typed, documented, zero `any`, all files under 300 lines |
| `npm run build` passes with 0 errors | ✅ | Verified; 3 app routes, no TypeScript errors |

---

## Submission Sentence

> RouteLens is a fully client-side, zero-backend developer tool that parses any OpenAPI/Swagger spec into a searchable route directory and structurally diffs two JSON API responses to instantly highlight what changed — built with Next.js 14, TypeScript, and Tailwind CSS, deployable to Vercel Hobby with no configuration.

---

Built by **Milind Bansal** · [milindsk8r@gmail.com](mailto:milindsk8r@gmail.com)  
Built for **Digital Heroes** · [digitalheroesco.com](https://digitalheroesco.com)
