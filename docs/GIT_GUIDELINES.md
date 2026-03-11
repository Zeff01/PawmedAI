# Git Workflow Guidelines

This document describes the **Git workflow used in this repository**. Following these guidelines helps maintain a **clean commit history**, ensures **safe collaboration**, and keeps the repository organized.

---

# Branch Structure

This project uses the following branch structure:

```
main       → production-ready code
staging    → integration and testing branch
sandbox    → development branch
feature/*  → temporary branches for new features
fix/*      → temporary branches for bug fixes
```

### Branch Roles

| Branch         | Purpose                     |
| -------------- | --------------------------- |
| **main**       | Stable production code      |
| **staging**    | Pre-production testing      |
| **sandbox**    | Development and integration |
| **feature/\*** | New features                |
| **fix/\***     | Bug fixes                   |

---

# Development Workflow

Developers **must not commit directly** to `main`, `staging`, or `sandbox`.

All development should be done in **feature branches** or **fix branches**, then merged via **Pull Requests (PRs)**.

---

# Step 1 — Update Base Branch

Before starting work, make sure your base branch is up to date.

Example (using `sandbox`):

```bash
git checkout sandbox
git pull origin sandbox
```

---

# Step 2 — Create a Branch

Create a new branch depending on the type of work.

### For new features

```bash
git checkout -b feature/<feature-name>
```

Example:

```bash
git checkout -b feature/home-view
```

### For bug fixes

```bash
git checkout -b fix/<bug-name>
```

Example:

```bash
git checkout -b fix/login-validation
```

---

# Step 3 — Work and Commit Changes

Stage and commit your changes.

```bash
git add .
git commit -m "feat: add HomeView component and route for home page"
```

---

# Commit Message Convention

We follow **Conventional Commits**.

| Type     | Description           |
| -------- | --------------------- |
| feat     | New feature           |
| fix      | Bug fix               |
| refactor | Code improvement      |
| docs     | Documentation changes |
| chore    | Maintenance tasks     |

### Examples

```
feat: add disease classification API
fix: correct login validation bug
refactor: simplify API response structure
docs: update installation guide
```

---

# Step 4 — Push the Branch

Push the branch to GitHub and set the upstream branch.

```bash
git push -u origin feature/<feature-name>
```

Example:

```bash
git push -u origin feature/home-view
```

For bug fixes:

```bash
git push -u origin fix/login-validation
```

The `-u` flag sets the **upstream branch**, allowing you to use simple commands later like:

```bash
git push
git pull
```

---

# Step 5 — Create a Pull Request

Open a **Pull Request (PR)** on GitHub.

```
feature/<feature-name> → sandbox
```

or

```
fix/<bug-name> → sandbox
```

Team members will:

- Review the code
- Suggest improvements
- Approve the PR

---

# Step 6 — Merge the Pull Request

Use **Squash and Merge** when merging the PR.

This keeps the commit history clean.

Example result:

```
feat: add HomeView component and route
fix: correct login validation logic
```

---

# Step 7 — Delete the Branch

After the PR is merged, delete the branch.

This keeps the repository clean.

GitHub will show a **Delete branch** button after merging.

You may also delete locally:

```bash
git branch -d feature/home-view
```

Or for fixes:

```bash
git branch -d fix/login-validation
```

---

# Important Rules

1. Never commit directly to `main`, `staging`, or `sandbox`.
2. Always create a `feature/*` or `fix/*` branch.
3. Always open a Pull Request before merging.
4. Use **Squash and Merge** for a clean commit history.
5. Delete branches after merging.

---

# Example Complete Workflow

```bash
git checkout sandbox
git pull origin sandbox

git checkout -b feature/home-view

git add .
git commit -m "feat: add HomeView component"

git push -u origin feature/home-view
```

Then open a **Pull Request**:

```
feature/home-view → sandbox
```

After merging, delete the branch.

---

# Summary

Our Git workflow ensures:

- Clean commit history
- Organized development
- Safe collaboration
- Clear code reviews

Always follow this workflow when contributing to the repository.
