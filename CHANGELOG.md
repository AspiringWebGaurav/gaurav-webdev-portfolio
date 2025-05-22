# 📄 Changelog

Welcome to the changelog for this portfolio project!  
This file explains how updates to the project are tracked using **Semantic Versioning**.  
Perfect for beginners who want to learn how real-world projects are maintained.

---

## 📌 What is Semantic Versioning?

Semantic Versioning (or **SemVer**) is a version naming system used to indicate the nature of changes made in a project.  
It follows the format:

### 🔴 MAJOR (X.0.0)

Big changes that **break** existing features or **change the structure** of the app.  
Example:

- Rewriting the entire UI.
- Moving from Next.js to a different framework.
- Changing routing structure that requires refactoring other code.

> 🔁 Requires developers to adjust how they use or deploy the app.

---

### 🟡 MINOR (0.X.0)

New features or enhancements that **do not break** existing code.  
Example:

- Adding a new section like “Testimonials” or “Blog”.
- Adding a dark/light theme toggle.
- Integrating social sharing animations.

> ✅ Safe upgrade; no code needs to be changed for current users.

---

### 🟢 PATCH (0.0.X)

Small fixes, style corrections, or performance improvements.  
Example:

- Fixing a broken animation on mobile.
- Correcting a typo in a heading.
- Adjusting spacing for better responsiveness.

> 🛠️ Usually maintenance work — no visible structural change.

---

## 🧪 Sample Version History

> Below is a **fake changelog** used for demonstration purposes.

---

## [0.0.1] - 2025-05-20

### 🎉 Initial Project Setup

- Set up Next.js base project.
- Installed Framer Motion and Tailwind CSS.
- Added placeholder components (Navbar, Footer, Hero).

---

## [0.1.0] - 2025-05-25

### ✨ Minor Update

- Added “Projects” section to showcase work.
- Introduced scroll-based fade-in animations using Framer Motion.
- Improved mobile navigation responsiveness.

---

## [1.0.0] - 2025-06-01

### 🚀 Major Release

- Completed full layout and UI.
- Added “About”, “Skills”, and “Contact” sections.
- Applied SEO best practices.
- First deployment to production on Vercel.

---

✅ Every time something changes in your codebase — update this file with:

- The new version number
- The release date
- A clear list of what was added, changed, or fixed

---

**Maintained by [@AspiringWebGaurav](https://github.com/AspiringWebGaurav)**  
Following [Semantic Versioning](https://semver.org/) for clean version tracking.

<!-- CHANGELOG -->

## 📘 How `CHANGELOG.md` Updates (with `standard-version`)

### 🕒 WHEN does it update?

Run this command:

```bash
npm run release -- --release-as [patch|minor|major]
```

This will:

- Update `package.json` version
- Add a new version section to `CHANGELOG.md`
- Auto-commit with message like: `chore(release): 1.0.0`
- Create a Git tag: `v1.0.0`

Then push to GitHub:

```bash
git push origin main --follow-tags
```

---

### 🧐 HOW are release notes generated?

`standard-version` uses **Conventional Commits** to generate changelog sections.

| Commit Type        | Description                   | Changelog Section        | Version Impact |
| ------------------ | ----------------------------- | ------------------------ | -------------- |
| `feat:`            | New feature                   | `### Features`           | Minor bump     |
| `fix:`             | Bug fix                       | `### Bug Fixes`          | Patch bump     |
| `BREAKING CHANGE:` | Incompatible change           | `### ⚠ Breaking Changes` | Major bump     |
| `docs:`            | Documentation only            | _(optional)_             | None           |
| `chore:`           | Build process or maintenance  | _(optional)_             | None           |
| `refactor:`        | Refactor code, no feature/fix | _(optional)_             | None           |

---

### 📄 Example Commits

```bash
git commit -m "feat: add dark mode toggle"
git commit -m "fix: header animation jitter"
git commit -m "refactor: cleanup homepage layout"
```

---

### 📝 What It Looks Like in `CHANGELOG.md`

```md
## [1.1.0] - 2025-06-01

### Features

- add dark mode toggle

### Bug Fixes

- header animation jitter
```

---

### 💥 Example with Breaking Change

```bash
git commit -m "feat: restructure routing\n\nBREAKING CHANGE: migrated to /app routes"
```

```md
## [2.0.0] - 2025-06-10

### ⚠ Breaking Changes

- migrated to /app routes

### Features

- restructure routing
```

---

### 🔀 Steps for Every Release

1. ✅ Make your commits using `feat:`, `fix:`, etc.
2. ✅ Run release script:

```bash
npm run release -- --release-as minor
```

3. ✅ Push changes and tags:

```bash
git push origin main --follow-tags
```

4. ✅ `CHANGELOG.md` is updated automatically 🎉
