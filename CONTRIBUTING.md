# AttendGuard Contribution Guidelines

Welcome to the **AttendGuard** project! This guide is designed specifically for our 4-member student team to build quickly, avoid stepping on each other's toes, and completely eliminate merge conflicts during development.

---

## Table of Contents

- [Core Principles](#core-principles)
- [Team Ownership & Responsibilities](#team-ownership--responsibilities)
- [Protected Shared Files](#protected-shared-files)
- [Branching Strategy](#branching-strategy)
- [The 11 Golden Rules of Contributing](#the-11-golden-rules-of-contributing)
- [Step-by-Step Development Workflow](#step-by-step-development-workflow)
- [Merge Conflict Prevention & Resolution](#merge-conflict-prevention--resolution)
- [Code Style & Conventions](#code-style--conventions)
- [Pull Request Checklist](#pull-request-checklist)

---

## Core Principles

1. **The Backend is the Authority**: The frontend never marks a student as present directly. Every state modification must go through the API contract defined in [docs/API.md](docs/API.md).
2. **Directory-Based Isolation**: Each developer has dedicated ownership of specific directories to ensure zero accidental collisions.
3. **No Hidden Contracts**: Never change an API endpoint format or database table without updating the documentation first and notifying the team.

---

## Team Ownership & Responsibilities

| Role | Member | Dedicated Code Ownership | Primary Focus Areas |
| :--- | :--- | :--- | :--- |
| **Team Lead & Backend Engineer** | **Member 1** | `src/app/api/`<br>`src/lib/supabase/`<br>`src/lib/auth/`<br>`src/lib/attendance/`<br>`src/lib/qr/`<br>`supabase/` | Supabase Postgres schema, RLS policies, Auth setup, Route Handlers, QR HMAC generator & validator, device binding, security audit logs, deployment, critical PR reviews. |
| **Frontend Engineer: Student Experience** | **Member 2** | `src/app/student/`<br>`src/components/student/` | Student login page, student dashboard, today's schedule, mobile QR scanner interface, check-in status alerts, student attendance history, registered device screen. |
| **Frontend Engineer: Teacher Experience** | **Member 3** | `src/app/teacher/`<br>`src/components/teacher/`<br>`src/components/qr/` | Teacher login page, dashboard, class management, session start/end UI, projector-friendly dynamic QR display, live attendee count, re-verification controls, reports. |
| **AI Engineer** | **Member 4** | `src/lib/ai/`<br>`src/app/student/advisor/` | AI Attendance Advisor chat UI, prompt templates, inference client (Llama 3/Mistral via Groq/Ollama), structured backend data formatting, hallucination guardrails. |

> [!IMPORTANT]
> The Team Lead is responsible for backend architecture and integrations, but **must NOT** become responsible for all frontend implementations. Members 2 and 3 own their respective frontend experiences completely.

---

## Protected Shared Files

Certain files sit at the core of the project and affect everyone. **Never modify these files without prior announcement in team chat and explicit sign-off from the Team Lead:**

- `package.json` and `package-lock.json` *(adding new dependencies)*
- `src/app/layout.tsx` and `src/app/globals.css` *(root layouts & global CSS variables)*
- `src/types/index.ts` *(shared domain models and API contracts)*
- `supabase/migrations/*` *(database schema definitions)*
- `src/components/ui/*` *(shared shadcn/ui primitives)*

### Rule for Shared Files:
If you need a new dependency or shared type:
1. Message the team: *"Hey team, I need to install `date-fns` for the attendance history calendar. Anyone object?"*
2. Member 1 approves and either installs it or coordinates the PR merge immediately so everyone pulls the updated lockfile.

---

## Branching Strategy

We follow a clean, trunk-based feature-branch model. The `main` branch represents deployable, working code.

```text
main  ─────────────────────────────────────────────────────────► (Production on Vercel)
         \                                          /
          \── feature/student-qr-scanner ──────────/ (PR review & merge)
           \                                      /
            \── feature/dynamic-qr-token ────────/ (PR review & merge)
```

### Branch Naming Conventions

Use only these prefix conventions:

- `feature/<short-description>`: Adding new functionality (e.g., `feature/student-scanner`, `feature/teacher-live-count`, `feature/ai-advisor-prompt`)
- `fix/<short-description>`: Resolving a bug or error (e.g., `fix/qr-expiry-timing`, `fix/mobile-camera-aspect`)
- `docs/<short-description>`: Updating documentation (e.g., `docs/api-reverification-endpoint`)

> [!CAUTION]
> **Never create permanent personal branches** named after people (e.g., `gouranga-branch`, `alex-dev`, `member2`). Branches must be short-lived, focused on a specific task, and deleted upon merge.

---

## The 11 Golden Rules of Contributing

1. **Never push directly to `main`**: All changes must land in `main` via a Pull Request.
2. **Always branch from the latest `main`**: Before creating a new branch, run `git checkout main && git pull origin main`.
3. **One task per branch**: Keep feature branches small, focused, and scoped to a single deliverable.
4. **Pull / rebase from `main` before opening a PR**: Ensure your branch incorporates any changes your teammates just merged.
5. **Test locally before creating a PR**: Run `npm run typecheck`, `npm run lint`, and verify your UI works locally.
6. **Open a descriptive Pull Request**: Explain what was changed, which role it affects, and include screenshots for UI changes.
7. **Request code review**: At least one other team member (and Member 1 for backend/shared changes) must approve.
8. **Resolve conflicts locally**: Never attempt to resolve merge conflicts inside GitHub's web interface. Resolve them in VS Code / your terminal.
9. **Rerun build and tests after conflict resolution**: Make sure nothing broke after merging or rebasing.
10. **Merge only after approval**: When approved, merge using Squash and Merge to keep history clean.
11. **Delete the branch immediately after merge**: Keeps the repository clean and avoids stale branches.

---

## Step-by-Step Development Workflow

Here is the exact terminal walkthrough for every feature you build:

### Step 1: Start fresh
```bash
git checkout main
git pull origin main
```

### Step 2: Create a feature branch
```bash
git checkout -b feature/student-qr-scanner
```

### Step 3: Implement your feature
Work strictly within your assigned directory:
```bash
# Member 2 works inside src/app/student/ and src/components/student/
git status
```

### Step 4: Make small, descriptive commits
Follow Conventional Commits:
```bash
git add src/components/student/QrScanner.tsx
git commit -m "feat(student): implement html5 camera scanner component"
```

### Step 5: Sync with latest `main` before pushing
```bash
git checkout main
git pull origin main
git checkout feature/student-qr-scanner
git rebase main
```

### Step 6: Push your branch
```bash
git push -u origin feature/student-qr-scanner
```

### Step 7: Open a Pull Request
Go to GitHub, open a PR from `feature/student-qr-scanner` into `main`. Tag your teammates for review.

### Step 8: Merge and cleanup
Once approved:
1. Click **Squash and merge**.
2. Click **Delete branch**.
3. Locally switch back to `main`:
   ```bash
   git checkout main
   git pull origin main
   git branch -d feature/student-qr-scanner
   ```

---

## Merge Conflict Prevention & Resolution

### Prevention Tactics
- **Respect Directory Boundaries**: If Member 2 never touches `src/app/teacher/` and Member 3 never touches `src/app/student/`, merge conflicts will be near zero.
- **Do Not Format Teammates' Code**: Turn off automatic whole-repo reformatting (`Prettier all files`) to prevent touching files outside your scope.
- **Short-Lived Branches**: A feature branch should live for hours, not days. Merge small, working increments often.
- **Stick to API Contracts**: Follow [docs/API.md](docs/API.md). If you need an API change, discuss with Member 1 first.

### Resolving a Merge Conflict (Beginner Walkthrough)

Suppose Member 3 updated `src/types/index.ts`, and you also edited `src/types/index.ts` on your branch. When you rebase or pull from `main`, Git flags a conflict:

1. **Check status**:
   ```bash
   git status
   # Output shows: both modified: src/types/index.ts
   ```

2. **Open the file in your code editor**:
   Git adds markers like this:
   ```typescript
   <<<<<<< HEAD (Current change from main)
   export interface AttendanceRecord {
     id: string;
     student_id: string;
     status: 'present' | 'absent';
   }
   =======
   export interface AttendanceRecord {
     id: string;
     student_id: string;
     status: 'present' | 'absent' | 're_verify_failed';
   }
   >>>>>>> feature/my-branch (Your change)
   ```

3. **Resolve the conflict manually**:
   Delete the marker lines (`<<<<<<<`, `=======`, `>>>>>>>`) and combine the logic cleanly:
   ```typescript
   export interface AttendanceRecord {
     id: string;
     student_id: string;
     status: 'present' | 'absent' | 're_verify_failed';
   }
   ```

4. **Mark as resolved and continue**:
   ```bash
   git add src/types/index.ts
   git rebase --continue
   # Or if you used git merge main:
   # git commit -m "fix: resolve merge conflict in src/types/index.ts"
   ```

5. **Test and push**:
   ```bash
   npm run build
   git push --force-with-lease origin feature/my-branch
   ```

---

## Code Style & Conventions

- **TypeScript**: Strict mode enabled. Avoid `any`. Define interfaces in `src/types/` or co-locate component props.
- **Styling**: Tailwind CSS utility classes. Use standard design tokens defined in `src/app/globals.css`.
- **Components**: PascalCase for files and components (`StudentScanner.tsx`, `LiveCounterCard.tsx`).
- **Icons**: Use `lucide-react` icons.
- **Date Handling**: Treat all database timestamps as UTC ISO-8601 strings (`2026-10-06T14:30:00Z`). Format dates using client locale only during display.

---

## Pull Request Checklist

Before hitting "Ready for Review", verify:

- [ ] My branch is rebased on the latest `main`.
- [ ] I only touched files within my assigned module (or coordinated shared file changes).
- [ ] `npm run typecheck` passes with zero TypeScript errors.
- [ ] `npm run lint` passes without warnings.
- [ ] I verified the UI or API endpoint works locally.
- [ ] No hardcoded secrets or API keys are committed in code.
- [ ] I have linked the relevant issue or roadmap item.
