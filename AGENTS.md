## Introduction

A workbench for prompt and agent development — build, trace, debug, evaluate, and manage, all in one place. It ships as a native **desktop app** (Electrobun), not a website.

## Tooling

Use **bun** for everything (`packageManager: bun`, pinned to `bun 1.3` in `mise.toml`). Do not use npm/pnpm/yarn.

| Task | Command | Notes |
|---|---|---|
| Install deps | `bun install` | from repo root |
| Run the app | `bun dev` | root script → `cd apps/desktop && bun run dev:hmr` (Vite HMR on :5173 + `electrobun dev --watch`) |
| Build (canary) | `bun run build:canary` | in `apps/desktop` → `vite build && electrobun build --env=canary` |
| Lint | `bun lint` / `bun run lint:check` | `lint` = `eslint --fix`, `lint:check` / `check` = `eslint .`; flat config at repo root |
| Add a dependency | `bun add <pkg>` | run inside the target package (`apps/desktop` or `packages/core`) |
| Add a shadcn/ui component | `bunx --bun shadcn@latest add <component>` | run inside `apps/desktop` |
| Run a script from root | `bun --filter <pkg> <script>` | e.g. `bun --filter @llm-space/desktop start` |

There is **no test framework** and **no root typecheck script**; each package uses `tsc` via `tsconfig.json`.

Shared dependency versions live in the root `package.json` `catalog` (referenced as `"catalog:"`) — bump them there, not per-package. The catalog currently pins `@earendil-works/pi-ai`, `@earendil-works/pi-agent-core`, `react`, `react-dom`, and `typebox`.

## Architecture

Bun-workspace monorepo. Workspaces are `packages/*` and `apps/*`.

- **`@llm-space/core`** (`packages/core`) — domain library, **no build step**; its TypeScript is consumed directly via the `exports` map. Entrypoints:
  - `.` → re-exports `./client`, `./types`, `./utils`.
  - `./client` — browser-safe pieces: the `streamThread()` client (`client/api`), the `reduceMessages()` streaming reducer (`client/reducer`), and the `AgentTransport` interface (`client/transport`).
  - `./server` — Node/Bun-only implementations: `streamAgent()` (`server/agent/stream`), filesystem paths (`server/paths` — `getLlmSpaceRoot()`, `getSettingsDir()`), `LocalFileSystem` thread storage (`server/storage`), and window-state persistence (`server/window-state`).
  - `./types` — `Thread`/`Message`/`ModelConfig`/`Tool`/`FileNode`/`ModelProviderGroup` and the converters to/from the `@earendil-works/pi-*` formats.
- **`@llm-space/desktop`** (`apps/desktop`) — the Electrobun app. Built with Vite (React 19) for the renderer and `electrobun` for the shell. Two runtime contexts bridged by a single typed RPC channel:
  - **bun main process** (`src/bun/`) — owns the native window, menu, filesystem, model config, and agent streaming.
  - **webview renderer** (`src/app`, `src/components`, `src/mainview`) — the React UI.

### The RPC bridge

The typed contract lives in `src/shared/rpc.ts` (`DesktopRPCType`). The bun side defines handlers in `src/bun/rpc/index.ts` (`mainWindowRPC`); the renderer holds the client in `src/lib/electrobun.ts` (`electrobun.rpc`). Two directions:
- **requests** (webview → bun, request/response): `availableModels`, `addProvider`/`updateProvider`/`removeProvider`/`setModelEnabled`/…, and the filesystem ops `fsLs`/`fsRead`/`fsWrite`/`fsMkdir`/`fsCp`/`fsMv`/`fsRm`/`fsReveal` (mirroring what were HTTP routes).
- **messages** (fire-and-forget, both ways): agent streaming (`sendStreamThreadRequest` / `receiveStreamThreadResponse` / `abortStreamThread`), fullscreen sync, and `executeCommand` (see the command layer).

### Data flow (the core loop)

UI action → Zustand `run()` (`components/thread-playground/stores/thread-store.ts`) → `streamThread()` (core) with an injected `AgentTransport`. The desktop transport is `createRpcTransport()` (`src/client/rpc-transport.ts`), wired in once at `components/thread-tabs/thread-tab-pane.tsx`. It sends `sendStreamThreadRequest`; the bun side (`bun/streaming/stream-thread.ts` → `runStreamThread`) calls `streamAgent()` from `@llm-space/core/server`, which drives `agentLoopContinue()` from `@earendil-works/pi-agent-core`, and pushes each event back as a `receiveStreamThreadResponse` message. The transport turns those back into an async iterator → `reduceMessages()` folds events into messages → Zustand → UI re-renders.

### Persistence

State is **persisted to disk** under the llm-space root (`~/.llm-space` by default; override with `LLM_SPACE_ROOT` or `LLM_SPACE_HOME`):
- `workspace/` — thread files as JSON, served through `LocalFileSystem` behind the `fs*` RPC requests. On a fresh install `bun/workspace/seed.ts` creates it and drops an `example.json`.
- `settings/` — `models.json` (configured providers, owned by `ModelManager`) and `window.json` (frame/zoom/maximized).

### The command layer

Every cross-boundary user action (menus, context menus, toolbar buttons, shortcuts) is a `Command` — a `type` discriminant + typed `args` — defined in `src/shared/commands.ts`. `COMMAND_META` tags each with a `target` of `"webview"` or `"bun"`. A single `executeCommand` on each side routes it: the bun side (`bun/commands.ts` `executeCommandInBun`) runs `bun`-target commands locally (window zoom/reload, open external links) and forwards `webview`-target ones over RPC; the renderer (`commands/index.tsx` `CommandProvider`) does the reverse. The native menu (`bun/app/menu.ts`) maps its string actions into commands.

### App layout (`apps/desktop/src`)

- `mainview/` — the Vite entry: `index.html` + `main.tsx` mounting `<App>`.
- `app/` — `index.tsx` (App), `layout.tsx` (providers: React Query, `ModelProvider`, tooltips, sonner toaster), `page.tsx` (resizable sidebar + tabs, settings/command-palette/onboard dialogs).
- `bun/` — main-process code: `app/` (window, menu, window-state), `rpc/`, `streaming/`, `storage/`, `models/` (`ModelManager` + builtin/custom providers), `fs/` (trash/reveal), `env/hydrate` (loads login-shell env — API keys/PATH — before anything reads `process.env`), `workspace/seed`.
- `client/` — renderer-side RPC callers: `rpc-transport.ts` (streaming) and `local-file-system.ts` (the `fs*` requests).
- `shared/` — code used by both contexts: `rpc.ts`, `commands.ts`.
- `components/` — the UI: `thread-playground/` (main editor: messages, model config, system prompt, tools, run history; Zustand store + change history under `stores/`), `thread-tabs/`, `file-system-tree-view/`, `settings/`, `command-palette.tsx`, `onboard-dialog.tsx`, `model-provider.tsx`, `code-editor/` (CodeMirror wrapper), and `ui/` (generated shadcn/ui — **don't hand-edit**, also ESLint-ignored).
- `styles/globals.css` — Tailwind v4 + OKLch design tokens. The app is dark-themed.

## Conventions

- **TypeScript**: strict, ESNext, `moduleResolution: bundler`. In `apps/desktop`, `@/*` maps to `./src/*`.
- **Layering**: `@llm-space/core` splits browser-safe code (`./client`, `./types`, `./utils`, root `.`) from Node/Bun-only server implementations (`./server`). The desktop **bun process** consumes `@llm-space/core/server`; the **renderer** consumes the client/types entrypoints and reaches the bun process over RPC (never imports `./server`).
- **Module-private functions** are named with a leading underscore (`_foo()`) when not exported.
- **Prettier**: 2-space indent, double quotes, semicolons, es5 trailing commas, tailwind class sorting (`prettier-plugin-tailwindcss`). Import ordering is enforced by `eslint-plugin-import-x`.
