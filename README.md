# kanban-workplan

A kanban board for your coding agents that lives in your repo. Agents save cards, claim work and
open PRs, and you approve and review. Boards are plain JSON on a `kanbans` branch, shared through
git, with no account or server.

Works with Claude Code, Codex and Cursor.

## Install

```bash
npx skills add jericolawrence/kanban-workplan -a claude-code
```

Run it from the root of your repo. Using Codex or Cursor? Add them to the command
(`-a claude-code -a codex -a cursor`). Keep `claude-code` in the list either way, because the
scripts run from `.claude/skills/`.

Then ask your agent:

```
/setup-kanban-space
```

Setup reads the repo, asks you one question to confirm, then creates the boards and opens a PR.
Teammates pull and run the same command to join.

## Skills

| Skill | Use it to |
|---|---|
| `setup-kanban-space` | Set up the boards for a repo, join a new machine, or add a board |
| `save-to-kanban` | Save fixes and follow-ups as cards, or move cards between lanes |
| `start-working-kanban` | Have agents work the Up next lane: one card, one worktree, one PR, with QA after each |

## How it works

- **Setup detects your project.** It makes one board per app or feature folder, plus an Infra board. It finds your build and test commands: npm, Make, Xcode, Swift, Gradle, Go, Cargo or pytest. It finds UI rules for iOS, Android and web.
- **One script writes the boards.** `kanban.sh` makes each write a commit pushed to origin. Each card is its own file, and writes take turns, so parallel agents never lose a card.
- **You see everything on one page.** Every write rebuilds `kanbans/.view/index.html`. Open it with `kanban.sh view`.

## Requirements

- `git`, `bash` and `jq`. On Windows, use WSL or Git Bash.
- Push access to the repo.
- Optional: the `gh` CLI and a GitHub remote, needed for tickets, PRs and `/start-working-kanban`.

## Manual install

```bash
git clone https://github.com/jericolawrence/kanban-workplan.git
```

```bash
kanban-workplan/install.sh path/to/your-repo
```

This copies the skills into `.claude/skills/` and links them for Codex and Cursor.
