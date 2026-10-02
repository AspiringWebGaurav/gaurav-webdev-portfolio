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
