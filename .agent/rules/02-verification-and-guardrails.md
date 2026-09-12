# ORE-SENTINEL — Verification Loop & Guardrails (Rules)

## Required Verification Loop — follow for every task, no exceptions

1. Before writing any code, produce a plan/task list Artifact and wait for confirmation if the task is non-trivial (a new screen, a new adapter, any 3D/animation work). Do not jump straight to code on anything beyond a small fix.
2. Once code is written, take a screenshot Artifact (or browser recording for interactive flows) showing the actual result — do not mark a UI task complete based on "it compiles" alone.
3. If asked to revise something, prefer incorporating feedback left directly on an existing Artifact over starting an entirely new implementation from scratch.
4. Never stack a new unverified feature on top of a previous unverified one. If the previous step hasn't been confirmed working, stop and flag this before continuing.

## Standing Guardrails — self-check before finishing any task

- Does this data come through the correct adapter interface in /apps/web/src/data/adapters/? If a component has inline arrays or hardcoded values that should come from an adapter, refactor before considering the task done.
- Does any new styling reference /apps/web/src/theme/ tokens, rather than introducing new hardcoded colors?
- Has a screenshot Artifact been produced for any visual/UI change?
- Does this change touch .env, API keys, or secrets in any way? If so, confirm no real key or secret is written into a source file, prompt, or commit — see the API Security rules file for full detail.

## Editor View vs. Manager View

- Use Editor View (synchronous, single agent) for anything needing close, real-time review: early scaffolding, the data adapter layer, 3D scene work, animation tuning.
- Use Manager View (parallel background agents) only once the adapter layer and design system are already committed and verified, and only for screens that are independent of each other. Do not parallelize two agents editing the same shared file at once.
- Always review a background agent's Artifacts (task list, screenshots, recording) before merging — do not merge unreviewed work.

## Session Continuity

If you notice degraded quality, repeated mistakes, or the appearance that earlier decisions in this conversation have been "forgotten," recommend the user start a fresh session/window rather than continuing to push through.
