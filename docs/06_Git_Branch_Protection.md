# Git Branch Protection Rules

This document outlines the mandatory branch protection rules that must be configured in GitHub Settings → Branches before the repository goes live. These rules enforce code quality, prevent accidental overwrites, and ensure all code is reviewed before deployment.

## RULES FOR: main

**Branch:** `main` (Production)

### Require Pull Request Before Merging

- ✅ Require pull request before merging
- ✅ Require approving reviews: **2** (two approvals required)
- ✅ Dismiss stale pull request approvals when new commits are pushed
- ✅ Require status checks to pass before merging
  - **Required checks:**
    - CI Tests
    - Lint Check
    - Build Check
- ✅ Require branches to be up to date before merging
- ✅ Restrict pushes that create files larger than 5MB
- ✅ Do not allow bypassing the above settings (applies to admins too)
- ❌ **Do NOT allow direct pushes — ever**

### Merge Strategy

- Merge commits preferred for main (preserves release history)
- Only merges from `release/*` or `hotfix/*` are allowed

---

## RULES FOR: dev

**Branch:** `dev` (Integration/Staging)

### Require Pull Request Before Merging

- ✅ Require pull request before merging
- ✅ Required approving reviews: **1** (one approval sufficient for dev)
- ✅ Require status checks to pass before merging
  - **Required checks:**
    - CI Tests
    - Lint Check
- ✅ Require branches to be up to date before merging
- ❌ **Do NOT allow direct pushes**

### Merge Strategy

- Squash merge from `feature/*` branches (clean linear history)
- Merge commits from `dev` → `main` (preserve release history)

---

## Other Branches

**Feature/Fix/Hotfix Branches:**

- No additional protection required
- These are considered temporary working branches
- Follow naming convention:
  - `feature/<kebab-case-name>` for new features
  - `fix/<kebab-case-name>` for bug fixes
  - `hotfix/<kebab-case-name>` for critical production patches

---

## MERGE STRATEGY MATRIX

| Source      | Target | Merge Type   | Commits         | History              |
| ----------- | ------ | ------------ | --------------- | -------------------- |
| `feature/*` | `dev`  | Squash merge | Squashed into 1 | Linear, clean        |
| `fix/*`     | `dev`  | Squash merge | Squashed into 1 | Linear, clean        |
| `dev`       | `main` | Merge commit | Preserved       | Branching, versioned |
| `hotfix/*`  | `main` | Merge commit | Preserved       | Branching, versioned |
| `hotfix/*`  | `dev`  | Cherry-pick  | Individual      | Backported           |

---

## GitHub Configuration Steps

1. Navigate to **Settings** → **Branches**
2. Click **Add rule** to create a new branch protection rule
3. **Branch name pattern:** Enter `main` or `dev` (create separate rules for each)
4. Configure each setting as listed above
5. Click **Create** to save

## Important Notes

- **Status checks must be passing:** Ensure CI pipeline is configured in `.github/workflows/` before enabling these rules
- **Dismissing stale reviews:** Enabled on `main` only — ensures old approvals are dismissed if new commits are pushed
- **File size limits:** 5MB max on `main` to prevent large binaries/secrets
- **Admin bypass:** Disabled on all branches — protects the team from accidental force-pushes
- **Up-to-date requirement:** Prevents merging out-of-sync branches (always rebase before merge)

---

## Rollout Timeline

- ✅ **Phase 1 (Now):** Document created, CI pipeline configured
- ✅ **Phase 2 (After GitHub Setup):** Configure protection rules in GitHub UI
- ✅ **Phase 3 (Go-Live):** Enable enforcement and lock down branches

---

## Questions or Changes?

If the team needs to modify these rules (e.g., reduce required approvals, adjust required checks), update this document and re-apply the rules in GitHub Settings.
