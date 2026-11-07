# Chapters

One file per chapter, for example `c01.js`, `c02.js`. Each file exports its
scenes; the orchestrator adds them to `scenes/index.js`.

Shared cast, props and palette live in `scenes/shared.js`. Chapter agents must
not edit it.

Use `CHAPTER_BRIEF.md` as the brief for each chapter agent.
