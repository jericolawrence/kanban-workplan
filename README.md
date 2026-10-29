# kanban-workplan

A kanban for coding agents that lives in your repo. Agents save cards and claim work through one
script, and you approve and review. Every board is plain JSON on a `kanbans` branch, so the team
shares it through git with no account or server.

Works with Claude Code, Codex and Cursor.

## What's in it

| Skill | What it does |
|---|---|
| `setup-kanban-space` | Detects the repo: approver, stack, feature folders, build and test commands, design doc. Asks one confirm, then creates the boards, writes `.claude/kanban.json`, checks it with a test card and opens a PR. Also joins a teammate's machine and adds boards. |
| `save-to-kanban` | Saves small fixes and follow-ups as cards, puts `/to-tickets` tickets on the board, and moves cards when you ask. Builds nothing. |
| `start-working-kanban` | Works the Up next lane: one dev session per card in its own worktree, QA after each, one PR per ticket. Only approvers start it. |

`save-to-kanban/kanban.sh` is the only thing that writes the boards. Each card is its own file, and
writes on one machine take turns through a lock. Every write is one commit pushed to origin, and a
push that loses a race is redone. `test-parallel.sh` proves that parallel writes lose nothing.

## Needs

- `git`, `bash` and `jq` on every machine. On Windows, use WSL or Git Bash.
- Push access to the repo, because cards are saved by pushing the `kanbans` branch.
- `gh` and a GitHub remote for tickets, the PR watcher and `/start-working-kanban`. Boards work without them.

## Install

```bash
git clone git@github.com:jericolawrence/kanban-workplan.git
```

```bash
kanban-workplan/install.sh path/to/your-repo
```

This copies the skills into `.claude/skills/` and links them from `.agents/skills/` (Codex) and
`.cursor/skills/` (Cursor). Commit those folders. Run `install.sh` again later to update.

Then, in that repo, run `/setup-kanban-space` in Claude Code, or ask Codex or Cursor to "set up the
kanban". Teammates pull and run the same command, which joins their machine to the existing boards.

## What setup detects

- **Boards:** one per app or feature folder (`apps/`, `demos/`, `packages/`, `src/`, `feature/`,
  `modules/`, `cmd/`), plus an Infra board. With no such folders, one board for the repo.
- **Build and test commands:** npm scripts, Make, Xcode, Swift packages, Gradle (with Android lint),
  Go, Cargo and pytest.
- **UI rules:** Apple HIG for iOS, Material 3 for Android, the app's own tokens for web. None for
  backends and libraries.

## Seeing the boards

Every `kanban.sh` write rebuilds a read-only page at `kanbans/.view/index.html`. Open it with
`kanban.sh view`. `kanban.sh share-page` writes the same page as one file, ready to publish as a
private artifact or site.

## Not yet tested

- A full interactive setup run, end to end.
- Running it in Codex or Cursor. The skills tell those agents which of their own tools to use, but
  nobody has run them there yet.
- The Notion backend's `ownedBy` path.

## Coming

One Board will replace the current viewer: one inbox across all boards, with "Needs you" first,
a feature sidebar, and cards that open in a drawer.
