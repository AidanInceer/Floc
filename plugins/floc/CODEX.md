# Floc in Codex

The shared workflows live in this checkout's `plugins/floc/skills/`. Claude and
Codex use those same files. The Claude manifest is the source for both clients'
metadata; `scripts/sync-floc-plugin.mjs` generates the Codex manifest and repo
marketplace. Edit the source, never an installed cache or generated manifest.

## Find the checkout

Read this checkout's `AGENTS.md` and `learnings.md`. Plugin caches are outside
the repo: read skill instructions, supporting files and scripts from
`<checkout>/plugins/floc/`, so relative links to `docs/` reach this checkout.
Run repo commands from its root. Treat `/floc:<name>` as the same workflow in
either client; load `plugins/floc/skills/<name>/SKILL.md` when needed.

## Use the available runtime

- Shell examples describe commands, not a requirement to use Bash. Follow
  `AGENTS.md`'s Windows PowerShell rules and use Codex's command tool.
- Claude's `preview_*` tools and `.claude/launch.json` are its server controls.
  In Codex, use `scripts/codex-launch.ps1 <web|metro|docs|wireframes>` through a
  background command session. Check the HTTP endpoint and listening port first;
  reuse a healthy server on its fixed port. A sandbox socket failure means the
  check needs local network access, not that the port is free. Keep logs readable.
  Marketing uses `pnpm marketing studio` on :4200. Stop only an identified server
  when the workflow requires it. `scripts/run.ps1 -SkipWeb -SkipMetro` handles the
  remaining phone startup after web and Metro answer.
- For browser and emulator work, use the available browser/computer tools and
  their instructions. Claude's `javascript_tool`, `computer` and console tool
  names are not Codex APIs. Use supported developer inspection for browser
  state; never assume arbitrary page JavaScript or storage access is available.
- Replace `SendUserFile` with local Markdown image/file links. Keep screenshots
  outside tracked product code. State any surface you could not verify.
- `Agent({subagent_type: "floc:ci-babysit", ...})` means delegate using Codex's
  available subagent tools, in an isolated managed worktree. Give it the SHA and
  this checkout's `plugins/floc/agents/ci-babysit.md`. If delegation is unavailable,
  run the same watcher with a background command session and retain its result.
  Do not create a user-owned chat as a substitute. Never add a Claude co-author
  line to a Codex-authored commit.
- Claude transcript paths in `retro` apply only to Claude. Use this Codex chat's
  context and available chat-reading tools for a Codex retrospective.
- Claude's permissions and edit hooks do not grant Codex permissions. Keep repo
  checks: run `pnpm comments` after code edits; normal commit hooks still apply.

## Keep the clients current

After editing any Floc skill, agent procedure or runtime guidance, bump
`plugins/floc/.claude-plugin/plugin.json`'s version once for the change, then run
`pnpm plugins:sync`. This updates generated metadata and refreshes both installed
clients when their CLIs are available. Dependency preparation, push preflight and
Claude's edit hook also synchronise automatically. `pnpm plugins:check` detects
drift without changing files. A fresh session is needed to load changed skill
instructions; syncing cannot replace instructions already loaded in a chat.

The repo's `.codex/config.toml` enables `floc@floc` only for this trusted project.
The installer disables its global default after refreshing it. Keep automatic
skill discovery enabled, except for `retro`, which stays explicit-only as in
Claude. Other repos do not enable Floc.
