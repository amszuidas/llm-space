---
name: kaizen-loop
description: Run one llm-space product-evolution loop for the 0-1 Electrobun desktop app. Use when the user asks to inspect the product, recommend what to build next, improve the product direction, plan or implement the next coherent capability, audit a workflow, or advance the app beyond small maintenance fixes. Each loop must ground recommendations in evidence, define a product-level north-star metric, present one main product recommendation plus two alternatives, and default product-surface acceptance to $product-design:audit.
---

# Kaizen Loop

Run one product-evolution loop for `llm-space`: inspect evidence, diagnose the product, recommend the next product capability, define its v1 shape, write an implementation plan, wait for approval, optionally implement the approved slice, verify it, and write a durable product decision log.

The default posture is 0-1 product building. Do not hunt for tiny code cleanups unless the user explicitly asks for maintenance or the cleanup clearly unblocks a product capability.

## Core Rules

- Read `AGENTS.md` before coding and treat it as the project contract.
- Inspect `git status --short` before changing files. Never revert user changes.
- Keep one loop to one product capability or one workflow improvement.
- Define a product-level north-star metric before planning. No metric, no loop.
- Ground recommendations in evidence. If evidence is too thin, ask one product-context question instead of inventing a direction.
- Prefer product capabilities, user workflows, onboarding, evaluation/debugging flows, model/provider setup, workspace/thread management, and the core agent-development experience.
- Recommend technical work as the main loop only when it directly unlocks, accelerates, or protects a product-level capability.
- Do not choose lint, typecheck, dependency cleanup, or isolated refactors as the main loop unless the user asks for maintenance or product work is blocked by that issue.
- Present the product recommendation and implementation plan, then wait for explicit approval before editing product code unless the user has already approved that exact plan.
- Stop and report rather than guessing when a blocker changes product behavior, risks data loss, exposes secrets, or prevents required verification.

## Product Scope

- One loop equals one product capability v1, not one tiny code patch.
- The implementation may touch multiple files or modules when needed for a coherent end-to-end user experience.
- Scope the work as the smallest complete version a user can actually experience.
- Record v2/v3 follow-ups, but execute only the selected v1 in the current loop.
- Do not expand into a broad roadmap execution, multi-week feature, or unclear product bet.
- Honor the architecture in `AGENTS.md`: `@llm-space/core` splits browser-safe client/types/utils from Bun-only server code; the desktop app splits Bun main process code from the webview renderer through typed RPC; cross-boundary actions go through commands; generated `components/ui/` files are not hand-edited.

## North-Star Metric

Every loop must name one product-level north-star metric in the recommendation, plan, log, and final response.

Include:

- Metric name.
- Why it matters to the 0-1 product.
- Current baseline or evidence source used as the baseline.
- Target for the v1 capability.
- How the target will be checked.
- Guardrails that must not regress, such as build health, accessibility, no visible overflow, no console errors, no broken persistence, or unchanged data contracts.

Good metrics describe product progress, for example: time to first useful thread, successful model setup rate, ability to inspect an agent run, confidence in comparing model outputs, or completion of a target workflow without critical audit findings.

## Evidence Gate

Before recommending what to build next, inspect enough evidence to avoid guessing.

Minimum evidence:

- Latest local iteration logs from `.agents/kaizen-loop/logs/`, if present. Read the most recent 1-3 logs.
- `AGENTS.md`, README, architecture docs, and relevant product/code paths.
- Current git status.
- Current rendered product state when the recommendation touches UX or workflow.

For UX or product-flow recommendations:

- Prefer a quick current-state audit or Electrobun CDP inspection before selecting the main recommendation.
- Use the project `electrobun-cdp-debug` skill and `bun run dev:cef` when inspecting the real desktop renderer.
- Do not mock `electrobun.rpc` in a normal browser.

If the product context is still ambiguous after inspection, ask one focused question before choosing the recommendation.

## Discovery Output

Produce one main recommendation plus two alternatives. Only the main recommendation gets a detailed plan.

Include:

1. Product diagnosis: where the current product is thinnest or most blocked.
2. North-star metric: product-level metric, baseline, v1 target, acceptance method, and guardrails.
3. Main recommendation: the one product capability or workflow improvement to build next.
4. Why now: why this beats the alternatives at the current product stage.
5. V1 capability definition: what a user can do after v1 ships, and what remains out of scope.
6. Acceptance and audit plan: how `$product-design:audit`, CDP, commands, and/or review will prove the result.
7. Implementation plan: likely files/modules, steps, commands, and stop conditions.
8. Alternatives: two reasonable directions not selected, with short reasons to defer them.

Ask for approval before implementation.

## Implementation

Implement only after the user approves the product recommendation and v1 plan.

- Build the smallest coherent end-to-end version of the approved capability.
- Use `bun` for all package work. Do not use `npm`, `pnpm`, or `yarn`.
- Do not assume GraphQL, database codegen, web-only builds, or test scripts exist here. Use only commands supported by this repository.
- Follow the renderer/Bun/RPC/command boundaries from `AGENTS.md`.
- Prefer app-level wrappers such as `@/components/tooltip` and `ConfirmDialog`; do not hand-edit generated `components/ui/`.
- For hot renderer paths, keep props stable, use narrow Zustand selectors, and follow the local `memo(_Foo)` pattern where it pays off.
- For UI changes, verify rendered behavior with the real Electrobun CEF renderer:
  - Start `bun run dev:cef` if CDP is not already available.
  - Use `.agents/skills/electrobun-cdp-debug/scripts/cdp-probe.mjs` for DOM text, console output, screenshots, and targeted evaluations.
  - Pair text checks with screenshot review, bounding boxes, overflow checks, and viewport/responsive checks when layout can be affected.

Stop if the approved plan proves wrong, CDP verification is required but unavailable, or the implementation would need a second product loop.

## Product-Design Audit

Use `$product-design:audit` as an evidence and acceptance tool, not as a ritual.

- During discovery: run or recommend an audit when judging an existing product flow would materially improve the recommendation.
- During planning: define audit acceptance criteria for the selected v1 capability when it touches a product surface.
- After implementation: run `$product-design:audit` for UI, visual, interaction, onboarding, settings, navigation, or other product-surface changes.
- For planning-only loops: do not force an audit, but record how future acceptance should be audited.
- For technical work that directly unlocks a product capability: audit may be not applicable, but explain the product capability it unlocks and verify with commands/review.

Unless the user explicitly names Figma, use a local audit destination under:

```text
.agents/kaizen-loop/audits/YYYY-MM-DD-HHMMSS-short-slug/
```

The audit must use screenshots captured in the current run. Do not reuse old screenshots or memory.

## Review And Verification

Before handoff after implementation:

1. Inspect the diff as a reviewer, prioritizing product regressions, broken workflows, boundary violations, missing states, and missing verification.
2. Run `bun run lint:check`.
3. Run `bunx --bun tsc -p packages/core/tsconfig.json --noEmit` when `packages/core` was changed.
4. Run `bunx --bun tsc -p apps/desktop/tsconfig.json --noEmit` when `apps/desktop` was changed.
5. Run `bun run build:canary` for UI, packaging, or desktop build-surface changes when reasonable.
6. Run focused CDP verification for UI behavior or visual changes.
7. Run `$product-design:audit` when the approved capability changes a product surface.
8. Fix findings that are clearly in scope; otherwise record them as follow-ups.

If a command is unavailable or inappropriate for the touched files, say why in the log and final response.

## Required Log

Always write a Markdown log before the final response, even when the loop stops early. When creating a log during discovery, planning, or implementation, mark it as `Status: draft`. Before the final response, update the same log to `Status: done` after verification/review is complete or after the loop has stopped/blocked.

Use:

```text
.agents/kaizen-loop/logs/YYYY-MM-DD-HHMMSS-short-slug.md
```

Create the directory if needed. Use local time from:

```sh
date "+%Y-%m-%d-%H%M%S"
```

Write the log as a product decision record plus engineering result. Include:

- Status: `draft` or `done`.
- Trigger: user request and starting git status.
- Product stage/context.
- Evidence reviewed.
- Product north-star metric: name, reason, baseline, target, measurement method, and guardrails.
- Candidate product opportunities: main recommendation and two alternatives.
- Main recommendation: why now, expected product value, and rejected alternatives.
- V1 capability definition: user-visible behavior, scope, and explicit non-goals.
- Acceptance/audit plan.
- Implementation plan and approval status.
- Work performed, if approved.
- Verification and product-design audit results, if implemented.
- Review: findings, fixes, remaining risks.
- Follow-up product bets.
- Outcome: completed, stopped, or blocked, with the next suggested loop.

Do not log secrets, tokens, private external payloads, or raw auth headers.

## Final Response

If implementation was not approved or not requested, summarize the product recommendation, north-star metric, v1 scope, alternatives, acceptance plan, and log path.

If implementation was completed, summarize the shipped capability, north-star result, audit/acceptance result, verification result, review result, and log path.

If stopped or blocked, say exactly what blocked the loop and what user decision or external state is needed next.
