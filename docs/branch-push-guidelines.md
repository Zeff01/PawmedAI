# 🧬 PawMed AI – Branch Push Guidelines

This guide outlines the process for working with the main branches of the PawMed AI repository: `sandbox`, `staging`, and `production`.

---

## 🏷️ Branch Overview

| Branch       | Purpose                        | Who Can Push           | Notes                                |
|--------------|--------------------------------|-------------------------|--------------------------------------|
| `sandbox`    | Experimental features, testing | All developers          | Direct pushes allowed                |
| `staging`    | QA, integration, pre-release   | Maintainers / via PRs   | Code must be reviewed & tested       |
| `production` | Stable, live release           | Maintainers only        | Manual merges from `staging` only    |

---

## 🔁 Branch Flow Overview

1. `feature/*` or `bugfix/*` branches (individual tasks)
   ↓
2. `sandbox` (initial testing & development)
   ↓
3. `staging` (integration testing & QA)
   ↓
4. `production` (final release)


---

## 🚀 Pushing to Each Branch

### ✅ `sandbox` Branch

- Used for initial development, testing, and prototyping.
- You can create feature branches off of this and merge them back freely.

**Example Workflow**:
```bash
git checkout -b feature/image-diagnosis
# Make changes
git add .
git commit -m "feat: add image diagnosis module"
git push origin feature/image-diagnosis
```

```bash
# Merge to sandbox
git checkout sandbox
git pull origin sandbox
git merge feature/image-diagnosis
git push origin sandbox
```

### 🔍 `staging` Branch

- Used for **testing** and **code review** before production.
- Must be merged via **Pull Request**.
- All **unit/integration tests** must pass.

#### ✅ Example:
```bash
# After testing in sandbox
git checkout staging
git merge sandbox
git push origin staging
```
---

### 🚨 `production` Branch
- Only **maintainers** can push.
- Code must be **stable** and reviewed in `staging`.

#### ✅ Example:
```bash
# After staging is verified
git checkout production
git merge staging
git push origin production
