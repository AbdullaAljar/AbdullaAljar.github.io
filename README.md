Reboot01 GraphQL Dashboard

Live site: https://www.abdullaaljar.github.io

Overview
- A lightweight, client‑side dashboard for the Reboot/01 learning platform.
- Logs in to the official API, fetches user data via GraphQL, and renders profile details, KPIs, charts, and recent activity – all in vanilla HTML/CSS/JS modules.

Key Features
- Login: Basic‑auth to obtain a bearer token; session idle timeout and redirect handling.
- Profile: Header greeting and details panel populated from user attrs.
- KPIs: Current level card; audit ratio summary with a compact panel; small Up/Down SVG chart.
- Charts: Skills histogram, XP over time, and Top XP per project podium.
- Tables: Recent activities and recent audits with minimal, widget‑scoped styles.

Tech Stack
- Frontend only: HTML + CSS + ES modules (no framework/build step).
- GraphQL requests to: https://learn.reboot01.com/api/graphql-engine/v1/graphql

Project Structure
- public/: static pages and styles
  - public/login.html – sign‑in page
  - public/home.html – main dashboard
  - public/styles/home.css – dashboard layout/theme
  - public/styles/login.css – login page styles
- src/: JavaScript modules
  - src/main.js – bootstraps auth flow and UI modules
  - src/auth.js – signin/signout/token logic
  - src/session.js – idle timeout + redirect handling
  - src/api.js – small GraphQL client with token injection
  - src/profileAtts.js – profile/header data
  - src/chartUtils/* – charts, tables, and KPI renderers

Getting Started
1) Serve the public/ folder with any static HTTP server (to load ES modules properly):
   - Example: from project root
     - Python: python -m http.server 8000 (then open http://localhost:8000/public/login.html)
     - Node: npx serve public (then open the printed URL)
2) Open /public/login.html, sign in with your Reboot credentials.
3) You’ll be redirected to /public/home.html with your data loaded.

Notes
- The app is client‑side; network access to the Reboot API must be allowed and not blocked by CORS.
- If your session expires, you’ll be sent back to the login page. Invalid credentials show an inline error below the form.
