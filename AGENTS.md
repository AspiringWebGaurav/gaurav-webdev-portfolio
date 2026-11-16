# Project Development Rules

## 1. Token Preservation & Verification Policy
- **DO NOT run `tsc`, `npm run lint`, `npm run build`, or automated test suites (Playwright/Jest) after making edits.**
- Only run lint, build, typecheck, or test commands when the user explicitly requests it.
- Keep agent responses concise, focused, and token-efficient.

## 2. Dev Server & Port Ownership
- The user owns `http://localhost:3000` and runs their own local dev server.
- The assistant must NOT start lingering background servers. Any temporary process must be terminated immediately.

## 3. Local-Only Development & Privacy
- All testing and development remain 100% local.
- Never push to GitHub or trigger remote deployment without explicit confirmation.
- Keep recruiter secrets strictly isolated in local environment variables.

## 4. Pure Subdomain Architecture (Local & Production)
- Strictly enforce pure subdomain routing across both local development and production.
- NEVER serve or leave portal routes on path prefixes (e.g. `localhost:3000/apps` or `gauravpatil.site/apps`).
- In local development, all apps and services MUST resolve and redirect to their respective `*.localhost:3000` addresses:
  - Apps Hub: `http://apps.localhost:3000`
  - Downex: `http://downex.apps.localhost:3000`
  - CP Engine: `http://cp.apps.localhost:3000`
  - ScheduleMe: `http://sm.apps.localhost:3000`
  - GPN Notes: `http://gpn.apps.localhost:3000`
  - Services Hub: `http://services.localhost:3000`
  - Resume Portal: `http://resume.services.localhost:3000`
  - Talk Command Hub: `http://talk.services.localhost:3000`
  - Recruiter Portal: `http://contact.services.localhost:3000`
- Any request hitting path prefixes (`/apps`, `/services`, `/resume`, `/talk`, `/cp`, `/downex`, `/download`, `/sm`, `/gpn`, `/contact-portal`) on the root domain must immediately redirect (307 in dev, 301 in prod) to the proper subdomain URL.

