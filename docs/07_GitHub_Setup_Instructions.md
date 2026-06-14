# GitHub Setup Instructions

This document contains step-by-step instructions to set up the GitHub repository for the Software House CRM project. Follow these steps **after** the local Git repository has been initialized (Phase 1 Task 3).

---

## Prerequisites

- You have completed Phase 1 Task 3 (local Git setup)
- You have a GitHub account with permissions to create repositories
- You have Git installed and configured locally
- You have the CLI authenticated with GitHub (if using `gh` CLI) or have SSH keys configured

---

## Step 1: Create the GitHub Repository

1. Navigate to **https://github.com/new** or click **"New"** in your GitHub profile
2. Fill in the repository details:
   - **Repository name:** `crm-software-house`
   - **Description:** _(optional)_ "Internal CRM for software house — manage clients, leads, projects, tasks, invoices, employees, and more"
   - **Visibility:** Select **Private** (this is an internal project)
3. **Important — uncheck the following:**
   - ❌ Do NOT check "Initialize this repository with a README" (we already have one)
   - ❌ Do NOT add .gitignore (we already have one)
   - ❌ Do NOT add a license (configure separately if needed)
4. Click **Create Repository**

---

## Step 2: Add GitHub as Remote

After the repository is created, GitHub will show you commands to push an existing repository. Run these commands in your local project directory:

```bash
git remote add origin https://github.com/<organization>/<crm-software-house>.git
git branch -M main
git push -u origin main
```

**Replace `<organization>` with your GitHub organization or username.**

### Alternative: Using SSH

If you prefer SSH (recommended for automated workflows):

```bash
git remote add origin git@github.com:<organization>/crm-software-house.git
git branch -M main
git push -u origin main
```

---

## Step 3: Push All Branches

Push the remaining branches to GitHub:

```bash
git push -u origin dev
git push -u origin feature/phase1-setup
git push -u origin release/v0.1.0
```

Verify all branches are on GitHub:

```bash
git branch -a
```

You should see:

```
  dev
  feature/phase1-setup
  main
  release/v0.1.0
  remotes/origin/dev
  remotes/origin/feature/phase1-setup
  remotes/origin/main
  remotes/origin/release/v0.1.0
```

---

## Step 4: Configure Branch Protection Rules

Navigate to your GitHub repository and apply the branch protection rules as documented in `/docs/06_Git_Branch_Protection.md`.

### Instructions:

1. Go to **Settings** → **Branches**
2. Click **"Add rule"** to create a new branch protection rule
3. For each branch (`main` and `dev`), configure:

**For `main` branch:**

- Branch name pattern: `main`
- ✅ Require pull request before merging
- ✅ Required approving reviews: **2**
- ✅ Dismiss stale pull request approvals when new commits are pushed
- ✅ Require status checks to pass before merging
  - Select checks: `lint-check`, `test`, `build-check`
- ✅ Require branches to be up to date before merging
- ✅ Restrict who can push to matching branches (optional — set to admin only)
- ✅ Do NOT allow bypassing the above settings
- Click **"Create"**

**For `dev` branch:**

- Branch name pattern: `dev`
- ✅ Require pull request before merging
- ✅ Required approving reviews: **1**
- ✅ Require status checks to pass before merging
  - Select checks: `lint-check`, `test`
- ✅ Require branches to be up to date before merging
- ✅ Do NOT allow bypassing the above settings
- Click **"Create"**

---

## Step 5: Configure GitHub Actions

GitHub Actions CI is already configured in `.github/workflows/ci.yml`. It will automatically:

- Run on every push to `main` and `dev`
- Run on every pull request to `main` and `dev`
- Execute lint checks, tests, and build verification
- Report status back to pull requests

**Verify the workflow is running:**

1. Go to **Settings** → **Actions** → **General**
2. Ensure "Allow all actions and reusable workflows" is selected (or configure as needed)
3. Go to **Actions** tab to see workflow runs
4. Check that tests pass on the main branch

---

## Step 6: Configure Repository Settings

### General Settings

1. Go to **Settings** → **General**
2. Configure:
   - ✅ **Default branch:** Set to `main` (or `dev` for development-focused workflows)
   - ✅ **Pull Requests:**
     - Allow squash merging (enabled by default)
     - Allow merge commits (enabled by default)
     - Delete head branch on merge (enable for cleanup)
   - ✅ **Discussions:** Enable if the team wants to use them

### Code Security & Analysis

1. Go to **Settings** → **Code security and analysis**
2. Enable:
   - ✅ Dependabot alerts (to track vulnerable dependencies)
   - ✅ Dependabot security updates (optional)
   - ✅ Secret scanning (if using GitHub Enterprise)

---

## Step 7: Add Collaborators & Teams

### Add Team Members

1. Go to **Settings** → **Collaborators and teams** (or **Access**)
2. Click **"Add people"** or **"Invite a team"**
3. Enter team members' usernames or email addresses
4. Assign roles:
   - **Admin:** Team leads (can manage settings and merge to main)
   - **Maintain:** Senior developers (can create releases and merge to dev)
   - **Write:** All developers (can push to feature branches, create PRs)
   - **Triage:** Testers (can manage issues and PRs, not push code)
   - **Read:** Stakeholders (view-only access)

---

## Step 8: Set Up GitHub Issues

1. Go to **Settings** → **Features**
2. ✅ Ensure "Issues" is enabled (turned on by default)
3. Go to **Issues** tab
4. Create labels for issue categorization:
   - `bug` — bug reports
   - `enhancement` — feature requests
   - `documentation` — docs improvements
   - `critical` — blocking issues
   - `phase-1`, `phase-2`, `phase-3` — phase tracking
   - `module-auth`, `module-clients`, etc. — module labels

---

## Step 9: Create a GitHub Project Board (Optional but Recommended)

1. Go to **Projects** tab
2. Click **"New project"** (select the "Table" or "Board" layout)
3. Name it: `Phase 1 Development` (or similar)
4. Create columns:
   - **Backlog** — not started
   - **Todo** — ready to start
   - **In Progress** — actively being worked on
   - **Review** — waiting for code review
   - **Done** — completed

5. Add cards for Phase 1 tasks and link them to issues

---

## Step 10: Verify Setup

Run this final verification to ensure everything is connected:

```bash
git remote -v
# Should show:
# origin  https://github.com/<org>/crm-software-house.git (fetch)
# origin  https://github.com/<org>/crm-software-house.git (push)

git push origin --dry-run
# Should succeed without errors (dry-run only)
```

---

## Troubleshooting

### "Permission denied (publickey)"

- Ensure your SSH keys are added to GitHub: https://github.com/settings/keys
- Or use HTTPS with a personal access token: https://github.com/settings/tokens

### "fatal: remote origin already exists"

- Remove the existing remote: `git remote remove origin`
- Then re-add it: `git remote add origin https://github.com/<org>/crm-software-house.git`

### Branch protection rules not applying

- Ensure you have **Admin** access to the repository
- Wait 30 seconds for GitHub to apply the changes
- Refresh the page

### CI workflow not running

- Check that `.github/workflows/ci.yml` is on the `main` branch
- Go to **Actions** tab and check for errors
- Verify that "Actions" is enabled in **Settings** → **Features**

---

## Next Steps

Once GitHub setup is complete:

1. ✅ Team members can clone the repository
2. ✅ Create feature branches following Git Flow conventions
3. ✅ Open PRs against `dev` branch for review
4. ✅ CI pipeline will automatically test all PRs
5. ✅ Merge to `dev` when approved (1 review)
6. ✅ Create release PRs from `dev` to `main` (2 reviews + green CI)

---

## Reference

- [GitHub Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Git Flow Workflow](https://nvie.com/posts/a-successful-git-branching-model/)
- [Conventional Commits](https://www.conventionalcommits.org/)
