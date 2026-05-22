# Methodology — ECG Simulator 2

## How We Work

This document captures the complete working methodology so the project can be resumed from any machine with full context alignment.

---

## 1. Core Principles

1. **Spec-Driven Development (SDD):** Every implementation starts with a spec. Code is a derived artifact of the spec.
2. **Build always green:** `npx vite build` must pass before any commit.
3. **Encoding UTF-8 mandatory:** PowerShell 5.1 defaults to ANSI. Never use `Set-Content`, `Out-File`, or `[System.IO.File]::ReadAllText/WriteAllText`. Use byte-level: `[System.Text.Encoding]::UTF8.GetBytes/GetString` + `[System.IO.File]::ReadAllBytes/WriteAllBytes`.
4. **One source file at a time during arrhythmia work:** `services/arrhythmiaData.ts` is the primary target.
5. **Commit one concept at a time:** No mixing fix + feat + docs in one commit.

---

## 2. Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript 5.8 |
| Build | Vite 6 + esbuild |
| Charts | Recharts 3.3 |
| Styles | TailwindCDN |
| Hosting | Vercel (auto-deploy from main) |
| Node | ^18 (20 recommended) |
| Git host | GitHub |

---

## 3. Conversation State Tracking

Every session tracks progress in this format (at conversation start):

```
## Goal
<current sprint or task objective>

## Constraints & Preferences
<technical rules, user preferences>

## Progress
### Done
<completed items with commit references>

### In Progress
<actively being worked on>

### Blocked
<blockers with reason>

## Key Decisions
<important architectural/technical decisions made>

## Next Steps
<planned future work>

## Critical Context
<urgent context the next session MUST know>

## Relevant Files
<key files with brief descriptions>
```

This structure MUST be preserved and passed to any new session or subagent.

---

## 4. Subagent System

Six specialized subagents are registered in `opencode.json`. Each has an `.md` file in `.opencode/agents/` with:
- Frontmatter (description, mode, model, permissions)
- Domain expertise and contract
- Files they own (can modify)
- Files they must NOT touch
- Verification checklist

### Agent Roles

| Agent | Domain | Owns |
|-------|--------|------|
| **ecg-engineer** | Cardiac vectors | `services/arrhythmiaData.ts`, `types.ts`, `constants.tsx` |
| **react-architect** | Frontend UI | `App.tsx`, `components/*.tsx`, `index.tsx`, `index.html` |
| **tooling-ops** | Build & encoding | `vite.config.ts`, `tsconfig.json`, `package.json`, `vercel.json`, `.gitignore` |
| **qa-verifier** | Quality gate | `CHECKLIST.md` (read-only on source code) |
| **git-ops** | Git & CI | `.github/workflows/*.yml`, `README.md` |
| **vercel-monitor** | Post-deploy | Reads `vercel.json`, queries production URL |

### Invocation Flow

```
Coordinator (primary agent)
  ├── task() → ecg-engineer    (vector work)
  ├── task() → react-architect (UI work)
  ├── task() → tooling-ops     (config/encoding work)
  ├── task() → qa-verifier     (pre-commit gate)
  ├── task() → git-ops         (commit/push/CI)
  └── task() → vercel-monitor  (post-deploy check)
```

Unidirectional: task → result → return to coordinator. Subagents do NOT call each other.

---

## 5. Standard Workflow

```
1. CLARIFY — Read constitution + current spec + checklist + git log
2. SPECIFY — Write .spec/sprint-N-task.md with WHAT and WHY
3. PLAN     — Decompose into atomic tasks
4. IMPLEMENT
   a. Subagent works on its file(s)
   b. npx vite build after each logical change
   c. QA-verifier runs pre-commit checks
5. COMMIT   — git-ops commits with proper message
6. PUSH     — To main after coordinator approval
7. VERIFY   — vercel-monitor checks production URL
```

---

## 6. Encoding Rules (PowerShell 5.1)

**NEVER use:**
- `Set-Content` / `Out-File` (default ANSI encoding)
- `[System.IO.File]::ReadAllText` / `WriteAllText` (uses BOM or ANSI)
- `> file.txt` output redirection (ANSI)
- `Add-Content` (ANSI)

**ALWAYS use:**
- Read: `[System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes("path"))`
- Write: `[System.IO.File]::WriteAllBytes("path", [System.Text.Encoding]::UTF8.GetBytes($content))`
- Extract from git: `cmd /c "git show <commit>:<path> > <output_file>"`
- Verification: `[regex]::Matches($text, '\uFFFD').Count` must be 0

**The `write` tool** (from OpenCode toolset) writes UTF-8 correctly and IS safe to use.

---

## 7. Commit Conventions

Format: `<type>: <description>`

Types:
- `Fix:` — bug fix (encoding, build, logic)
- `Feat:` — new functionality (arrhythmia, component)
- `Refactor:` — reorganization, no functional change
- `Docs:` — documentation
- `CI:` — workflows

Rules:
- One concept per commit
- Max 72 chars title
- Stage only intended files (`git add <specific_file>`)
- No amend, no force push, no empty commits
- Never commit secrets

---

## 8. How to Resume from Another PC

When opening this repo on a new machine:

1. **Read `.spec/constitution.md`** — project principles and stack
2. **Read `.spec/methodology.md`** — this file (working methodology)
3. **Read `.spec/sprint-002-audit-team.md`** — current sprint spec
4. **Read `CHECKLIST.md`** — current status of all items
5. **Run `git log --oneline -5`** — latest commits
6. **Run `npx vite build`** — verify build still works
7. **Check encoding:** `[regex]::Matches($text, '\uFFFD').Count` = 0 in all .ts/.tsx
8. **Read `opencode.json`** — registered agents
9. **Review `.opencode/agents/*.md`** — agent capabilities
10. **Continue from "Next Steps"** in the last session's state tracking

---

## 9. Current State Snapshot

| Metric | Value |
|--------|-------|
| Build modules | 687 |
| Bundle size | 609 kB JS + 184 kB gzip |
| Arrhythmias | 32 |
| Encoding | 0 U+FFFD |
| package-lock.json | Tracked ✅ |
| deploy.yml | Removed (Vercel auto-deploy) |
| `.github/workflows/` | Empty (pending CI setup) |
| `.opencode/` agents | 6 registered |
| `.spec/` | 4 files (constitution, sprint-002, team-design, methodology) |
| INFO:DE version | latest — no U+FFFD, build OK |
