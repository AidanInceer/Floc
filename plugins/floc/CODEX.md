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
- After `/floc:push`, follow `floc:ci-babysit` yourself: watch the PR checks and fix anything red, as that agent describes. After `/floc:release`, end the turn. A plain watcher script merges and cleans up; it notifies on a conflict or a red check.
- Claude transcript paths in `retro` apply only to Claude. Use this Codex chat's
  context and available chat-reading tools for a Codex retrospective.
- Claude's permissions and edit hooks do not grant Codex permissions. Keep repo
  checks: run `pnpm comments` after code edits; normal commit hooks still apply.

## Keep the clients current

After editing any Floc skill, agent procedure or runtime guidance, bump
`plugins/floc/.claude-plugin/plugin.json`'s version once for the change, then run
`pnpm plugins:sync`. This updates generated metadata. After reviewing the change,
`pnpm plugins:refresh` refreshes both installed clients when their CLIs are available. Dependency preparation generates metadata; refresh installed clients only after an actual plugin change. `pnpm plugins:check` detects
drift without changing files. A fresh session is needed to load changed skill
instructions; syncing cannot replace instructions already loaded in a chat.

The repo's `.codex/config.toml` enables `floc@floc` only for this trusted project.
The installer disables its global default after refreshing it. Keep automatic
skill discovery enabled, except for `retro`, which stays explicit-only as in
Claude. Other repos do not enable Floc.
