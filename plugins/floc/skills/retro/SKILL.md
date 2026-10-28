---
name: retro
description: Review a Floc coding session and suggest changes to the agent's setup — checks, rules, pointers and tools — most severe first. Use when the user says /floc:retro, "retro", "retrospective", "why did the agent get that wrong", or wants the agent to do better next time.
disable-model-invocation: true
---

In Codex, read [Codex runtime](../../CODEX.md) before following this workflow.

# retro

Adapted from Matt Pocock's `retro` (`skills/engineering/retro`), for Floc's
files, checks and rules.

The user has asked for a **retrospective**. You suggest changes to the coding
agent's **environment** so future runs go better. You change no code.

## Steps

1. Read [AGENTS.md](../../../../AGENTS.md) first: Commands, Invariants, Code
   standards and Agent skills. Every finding must respect them.

2. Read the session the user names. If they name none, use the current one.
   Session logs for this project are the `.jsonl` files in
   `C:\Users\aidan\.claude\projects\C--dev-Floc\`; subagent logs sit in the
   `subagents` folder beside each session. Search them with Grep.

3. Look for candidates in these categories.

- **Navigation**: how easy was it for the agent to find the right files? Are
  there hidden dependencies? Would a pointer in AGENTS.md or
  [`floc/CONTEXT.md`](../../../../floc/CONTEXT.md) help? _Use when_ the session
  took a long time to find something.
- **Automated checks**: could a check have caught the agent's mistake? Read the
  repo's own checks first: `pnpm verify` (mirrors CI), `pnpm fitness`,
  `pnpm parity`, `pnpm deps:check`, `pnpm comments`, the ESLint config, the git
  hooks and `.github/workflows/`. A check that exists but is unwired or broken
  is the finding. A repo with no guardrail for a rule is itself a finding.
  _Use when_ the agent made a mistake a check could have caught.
- **Coding standards**: should the review step enforce a new rule, or should a
  rule go? Classify the violation first. A **mechanical** one (a banned import,
  a file-location rule, a fixed syntax) gets a deterministic check: an ESLint
  rule, a `pnpm fitness` check or a hook. Put a **judgement call** in AGENTS.md
  Code standards. Default to building the check over writing the rule. _Use when_
  the review missed a mistake.
- **Global AGENTS.md**: should steering in AGENTS.md move to a check or a doc?
  Note its length. [`CLAUDE.md`](../../../../CLAUDE.md) only imports it. _Use
  when_ AGENTS.md is large or the agent ignored a line in it.
- **Tool economy**: did the agent make an expensive call that a filter or a
  narrower command would avoid (`pnpm --filter floc-web …`, a targeted Grep)?
  Is any MCP tool or CLI token-heavy? _Use when_ the agent made an expensive
  call.
- **No-ops**: are there steering lines that change nothing the agent does?
  _Use when_ the steering files are long and unwieldy.
- **Information access**: was a crucial piece of information out of the agent's
  reach? Dev server logs, Railway logs, a read-only view of data. _Use when_ the
  agent had to guess something it could have read.

4. Present the candidates to the user, most severe first. For each: what
   happened (one line), the category, the proposed change and the file it
   would touch. Edit nothing until the user picks.

## Reference

### Implementation vs review

Work goes through two stages. The implementation agent has the most **context
pressure**: it explores, writes code and debugs. The review step gets a diff,
so it has the least pressure. Put coding standards on the review step or in a
check, not in the implementation agent's rules.

### Files

- `AGENTS.md`: a steering file, read into every session. Keep it to rules and
  navigation pointers. Point to the docs; do not copy them in.
- `docs/` (local HTML): reference material, pointed to from other files. Look
  for an existing page before a new one.
- Skills (`plugins/floc/skills/`): a skill's description goes into every
  session's context, so keep it short. Use a skill for a reference doc or a
  user-run command. A change to a skill follows the cache steps in AGENTS.md
  (bump the plugin version, update the plugin, restart the session).
