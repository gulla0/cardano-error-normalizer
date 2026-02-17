# Initiation Prompt

Use this workflow at the start of each implementation cycle:

1. Read `currentProgress.md` and `mvp.md`.
2. Identify the next actionable item and classify it as `agent-owned` or `human-owned`.
3. If `human-owned`, ask for exactly one task, pause, and collect required info before continuing.
4. If `agent-owned`, build the next section.
5. Test the section and make logic updates as needed until tests succeed.
6. Update `currentProgress.md` (including what human info was requested/received when applicable).
7. Commit work.

Execution notes:
- Keep changes scoped to one small section at a time.
- Do not skip testing before updating `currentProgress.md` and committing.
- Record key decisions and test outcomes in `currentProgress.md`.
- For human tasks, request them sequentially (one at a time), not in parallel.
- Do not proceed past a blocked human task until the required input/artifacts are received.
