# AttendGuard Git Workflow & Branch Strategy

> **Team Collaboration Protocol, Module Boundaries & Conflict Prevention**  
> *Designed specifically for our 4-member hackathon team to ship fast without git collisions.*

---

## Table of Contents

- [The Core Model: Trunk-Based Feature Branches](#the-core-model-trunk-based-feature-branches)
- [Module Ownership & Directory Isolation](#module-ownership--directory-isolation)
- [Branch Naming Standard](#branch-naming-standard)
- [Standard 10-Step Feature Lifecycle](#standard-10-step-feature-lifecycle)
- [Commit Message Conventions](#commit-message-conventions)
- [Merge Conflict Prevention Tactics](#merge-conflict-prevention-tactics)
- [Step-by-Step Merge Conflict Resolution (Beginner Guide)](#step-by-step-merge-conflict-resolution-beginner-guide)
- [Pull Request Review & Merge Standards](#pull-request-review--merge-standards)

---

## The Core Model: Trunk-Based Feature Branches

To prevent long-lived branch divergence and the dreaded "merge hell" on final demo day, we follow a strict **short-lived feature branch** strategy anchored on `main`.

```text
main  ─────────────────────────────────────────────────────────────► (Deployable / Vercel)
         ▲                             ▲                     ▲
         │ (Squash & Merge)            │ (Squash & Merge)    │ (Squash & Merge)
         │                             │                     │
   feature/attendance-api       feature/student-scanner  feature/teacher-qr
   (Member 1 - Backend)         (Member 2 - Student)     (Member 3 - Teacher)
```

> [!IMPORTANT]
> **No Permanent Personal Branches**: Never create branches named after individuals (e.g., `gouranga-branch`, `alex-dev`, `member2`). Branches exist for features, not people. When a feature is merged, its branch is deleted immediately.

---

## Module Ownership & Directory Isolation

The number one defense against git merge conflicts is **directory isolation**. Each member works inside their dedicated folder:

```text
attendguard/
├── src/app/api/             ◄── Member 1 (Team Lead & Backend)
├── src/lib/supabase/        ◄── Member 1 (Team Lead & Backend)
├── src/lib/attendance/      ◄── Member 1 (Team Lead & Backend)
├── src/lib/qr/              ◄── Member 1 (Team Lead & Backend)
├── supabase/migrations/     ◄── Member 1 (Team Lead & Backend)
│
├── src/app/student/         ◄── Member 2 (Student Experience)
├── src/components/student/  ◄── Member 2 (Student Experience)
│
├── src/app/teacher/         ◄── Member 3 (Teacher Experience)
├── src/components/teacher/  ◄── Member 3 (Teacher Experience)
├── src/components/qr/       ◄── Member 3 (Teacher Experience)
│
├── src/lib/ai/              ◄── Member 4 (AI Engineer)
├── src/app/student/advisor/ ◄── Member 4 (AI Engineer)
│
└── SHARED INFRASTRUCTURE (Requires communication before editing):
    ├── src/components/ui/   (shadcn primitives)
    ├── src/types/index.ts   (API & domain contracts)
    ├── src/app/layout.tsx   (Root shell)
    └── package.json         (Dependencies)
```

---

## Branch Naming Standard

All branches must use one of the following prefixes followed by a short kebab-case description:

- `feature/<name>`: New functionality
  - `feature/attendance-check-in-api`
  - `feature/student-qr-scanner`
  - `feature/teacher-dynamic-qr-display`
  - `feature/ai-advisor-prompt`
- `fix/<name>`: Bug fixes
  - `fix/qr-token-expiry-check`
  - `fix/camera-viewport-aspect`
- `docs/<name>`: Documentation improvements
  - `docs/api-specification-update`

---

## Standard 10-Step Feature Lifecycle

Follow these exact terminal steps for every piece of work:

### 1. Update your local `main`
Always begin from the freshest state of the project:
```bash
git checkout main
git pull origin main
```

### 2. Create your scoped branch
```bash
git checkout -b feature/student-qr-scanner
```

### 3. Work within your assigned directory
Edit only files belonging to your module.

### 4. Test locally before committing
Verify your code compiles cleanly:
```bash
npm run typecheck
npm run lint
```

### 5. Make small, clear commits
```bash
git add src/components/student/StudentScanner.tsx
git commit -m "feat(student): initialize html5 camera viewfinder"
```

### 6. Pull updates from `main` before pushing
Rebase on `main` to ensure your branch applies cleanly:
```bash
git checkout main
git pull origin main
git checkout feature/student-qr-scanner
git rebase main
```

### 7. Push branch to GitHub
```bash
git push -u origin feature/student-qr-scanner
```

### 8. Open a Pull Request on GitHub
- Set title: `feat(student): add mobile camera scanner component`
- Add description and screenshot of the mobile screen.
- Tag relevant teammates for review.

### 9. Code Review & Approval
- Member 1 reviews backend or shared type changes.
- Peer frontend dev reviews UI components.
- When approved, click **Squash and Merge**.

### 10. Delete the branch & sync
```bash
git checkout main
git pull origin main
git branch -d feature/student-qr-scanner
```

---

## Commit Message Conventions

We follow the Conventional Commits specification:

- `feat(scope): ...` — A new feature
- `fix(scope): ...` — A bug fix
- `docs(scope): ...` — Documentation updates
- `test(scope): ...` — Adding or refactoring tests
- `refactor(scope): ...` — Code change that neither fixes a bug nor adds a feature

**Examples**:
```text
feat(backend): implement HMAC-SHA256 signature generator for dynamic QR
feat(teacher): add live attendee counter card with realtime subscription
fix(api): correct timezone drift in token expiration comparison
docs(api): document new reverify endpoint response envelope
```

---

## Merge Conflict Prevention Tactics

1. **Never Reformat the Whole Project**: Do not run a global Prettier/ESLint command that reformats files you didn't write. This creates hundreds of false line changes that clash with your teammates' branches.
2. **Small PRs**: A PR should contain at most 3–5 modified files and represent a single task that can be reviewed in under 5 minutes.
3. **Strict Adherence to `src/types/index.ts`**: Frontend developers must build components against the agreed types defined in [docs/API.md](docs/API.md) rather than inventing local variations.
4. **Communicate Before Touching Shared Files**: Need a new library from npm? Message in team chat: *"Installing `html5-qrcode` on `package.json` — please don't edit dependencies right now."*

---

## Step-by-Step Merge Conflict Resolution (Beginner Guide)

If Git reports a conflict when rebasing or merging, don't panic! Follow these steps:

### Scenario:
You and a teammate both added an export to `src/types/index.ts`.

### 1. Identify Conflicted Files
```bash
git status
# Output:
# Unmerged paths:
#   both modified:   src/types/index.ts
```

### 2. Open the File in VS Code
Look for Git conflict markers:
```typescript
<<<<<<< HEAD (incoming change from main)
export interface SessionSummary {
  sessionId: string;
  totalPresent: number;
}
=======
export interface CheckInPayload {
  challengeToken: string;
  deviceFingerprint: string;
}
>>>>>>> feature/my-branch (your change)
```

### 3. Edit and Clean
Combine both additions and delete the `<<<<<<<`, `=======`, and `>>>>>>>` lines:
```typescript
export interface SessionSummary {
  sessionId: string;
  totalPresent: number;
}

export interface CheckInPayload {
  challengeToken: string;
  deviceFingerprint: string;
}
```

### 4. Mark as Resolved
```bash
git add src/types/index.ts
```

### 5. Complete Rebase or Merge
If rebasing:
```bash
git rebase --continue
```
If merging:
```bash
git commit -m "fix: resolve merge conflict in src/types/index.ts"
```

### 6. Verify Build Before Pushing
```bash
npm run typecheck
git push --force-with-lease origin feature/my-branch
```

---

## Pull Request Review & Merge Standards

- **Review turnaround**: Review teammates' PRs within 30 minutes during hackathon working hours.
- **Merge Strategy**: Always choose **Squash and Merge** on GitHub. This squashes all intermediate commits into a single clean commit on `main`.
- **Automatic Deployment**: Merging to `main` triggers a live deployment to Vercel within 90 seconds. Always verify the live preview URL after merging.
