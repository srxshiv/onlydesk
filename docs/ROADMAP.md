# Roadmap

## Phase 0 — Foundation (this scaffold)

Done. Empty desk runs end-to-end:

- Auth (email/password). Google + GitHub OAuth stubs present, wiring deferred.
- Tool registry + install / uninstall.
- Context store with all 8 scopes + CRUD endpoints.
- ADK + MCP adapter layer.
- BullMQ worker for queued actions.
- Resume editor tool registered with a placeholder handler.

## Phase 1 — Resume Editor as a real product

Goal: a user with 30 work-log entries, a job target, and an Overleaf account can generate a tailored LaTeX resume in one click and push it to Overleaf.

Work:

1. OAuth flows for Google + GitHub (sign-in only), real implementations.
2. Overleaf OAuth + secret storage on `installed_tools.config` (encrypted column).
3. Real `tailor-resume` handler — wire `getMcpToolset()`, push the generated LaTeX into a configured Overleaf project, return the project URL.
4. Resume Editor workspace UI — job-target picker, "tailor" button, streaming progress, output preview.
5. Context entry forms — let the user populate `work_log`, `projects`, `skills`, `education`, `job_target` manually. Bare CRUD is fine.
6. Invocation polling (or SSE) in the web app.

## Phase 2 — Second tool: Post Writer

Goal: prove the abstraction. New tool ships in <1 week without touching core.

- Tweet + LinkedIn post generator grounded in `social_voice` and `work_log`.
- Voice training: ingest past posts via paste / URL.
- Output: drafts in the workspace, copy-to-clipboard, "save as voice sample" feedback loop.

If adding this required core changes, the abstractions failed. Fix them.

## Phase 3 — Third-party tools

- Tool manifest registry (DB-backed, not in-process).
- Sandboxed handler execution.
- Marketplace UI on `/desk` with per-tool permission disclosures.
- Verified-publisher flow for trusted tools.

## Phase 4 — Tools that write

So far tools only read context. This phase opens write paths:

- Gym tracker writes `health_log`.
- Todo tool writes its own scope.
- Work log auto-ingest from GitHub / Linear / Slack.

## Phase 5 — Cross-tool intelligence

The reason the context store is shaped the way it is: a daily summary agent that reads across scopes and proposes desk-level actions ("you have a job target due Friday; tailor your resume?" / "you skipped 3 workouts; reschedule?").
