# Agent System — ECG Simulator 2

## Overview

This project uses OpenCode subagents to distribute specialized work. Each agent has:
- A dedicated `.md` file in `.opencode/agents/` with frontmatter and domain instructions
- A registration entry in `opencode.json`
- Strict file ownership boundaries (what they can/cannot modify)

## Architecture

```
                          ┌─────────────────┐
                          │   coordinator    │  (primary agent — entry point)
                          │ .opencode/       │
                          │ coordinator.md   │
                          └────────┬────────┘
                ┌──────────────────┼──────────────────┐
                ▼                  ▼                   ▼
        ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
        │ ecg-engineer │  │react-architect│  │ tooling-ops  │
        │ (subagent)   │  │ (subagent)    │  │ (subagent)   │
        └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
               │                  │                  │
               ▼                  ▼                  ▼
        ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
        │ qa-verifier  │  │   git-ops    │  │vercel-monitor│
        │ (subagent)   │  │ (subagent)   │  │ (subagent)   │
        └──────────────┘  └──────────────┘  └──────────────┘
```

## Agent Files

| File | Role |
|------|------|
| `.opencode/coordinator.md` | Primary agent — orchestrates all work |
| `.opencode/agents/ecg-engineer.md` | Cardiac vector specialist |
| `.opencode/agents/react-architect.md` | React/Recharts UI specialist |
| `.opencode/agents/tooling-ops.md` | Build, encoding, config specialist |
| `.opencode/agents/qa-verifier.md` | Quality gate — pre-commit verification |
| `.opencode/agents/git-ops.md` | Git, GitHub, CI/CD specialist |
| `.opencode/agents/vercel-monitor.md` | Post-deploy monitoring specialist |
| `.opencode/agents/agent-system.md` | This file — system overview |

## How Subagents Are Invoked

The coordinator uses the `task()` tool to invoke subagents:

```
task(
  description: "Implementar vectores para arritmia X",
  subagent_type: "general",
  prompt: "You are ecg-engineer. Follow instructions in .opencode/agents/ecg-engineer.md. Task: ..."
)
```

The subagent receives:
1. The full prompt with task instructions
2. Reference to its own `.md` skill file
3. Relevant context (files, specs, current state)

After completing, the subagent returns results to the coordinator.

## File Ownership Boundaries

Each agent owns specific files and must NOT touch others:

```
services/arrhythmiaData.ts  →  ecg-engineer ONLY
types.ts                    →  ecg-engineer ONLY
constants.tsx               →  ecg-engineer ONLY
components/*.tsx            →  react-architect ONLY
App.tsx                     →  react-architect ONLY
vite.config.ts              →  tooling-ops ONLY
tsconfig.json               →  tooling-ops ONLY
package.json                →  tooling-ops ONLY
vercel.json                 →  tooling-ops ONLY
.gitignore                  →  tooling-ops ONLY
.github/workflows/*.yml     →  git-ops ONLY
CHECKLIST.md                →  qa-verifier ONLY
index.html                  →  tooling-ops / react-architect
```

## Agent Knowledge Validation

Agent prompts contain embedded domain knowledge. Before relying on an agent for a task, the coordinator should validate that the agent's knowledge is current by consulting:
- Official documentation (Recharts API, Vite config, etc.)
- Working patterns in the existing codebase
- Verified encoding techniques for PowerShell 5.1

If knowledge is found to be outdated or incorrect, the coordinator updates the agent's `.md` file before invoking.
