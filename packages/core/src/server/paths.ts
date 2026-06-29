import os from "node:os";
import path from "node:path";

/** Root directory for llm-space user data (`window-state.json`, `workspace/`, etc.). */
export function getLlmSpaceRoot(): string {
  return (
    process.env.LLM_SPACE_ROOT ??
    process.env.LLM_SPACE_HOME ??
    path.join(os.homedir(), ".llm-space")
  );
}

export function getWindowStatePath(): string {
  return path.join(getLlmSpaceRoot(), "window-state.json");
}
