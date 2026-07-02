import { Type, type Static } from "typebox";

import { Message } from "../messages";
import { ModelConfig } from "../models";
import { Tool } from "../tools";

/**
 * The context of a thread, including the system prompt, messages, and tools.
 */
export const ThreadContext = Type.Object({
  /**
   * The system prompt of the thread.
   */
  systemPrompt: Type.Optional(Type.String()),

  /**
   * The tools of the thread.
   */
  tools: Type.Optional(Type.Array(Tool)),

  /**
   * The messages of the thread.
   */
  messages: Type.Optional(Type.Array(Message)),
});
export type ThreadContext = Static<typeof ThreadContext>;

const THREAD_FIELDS = {
  /**
   * The title of the thread.
   */
  title: Type.Optional(Type.String()),

  /**
   * The model configuration of the thread. Optional — a thread may be created
   * without a model; the UI resolves a fallback (first available model) for
   * display/running and only persists a model once the user picks one.
   */
  model: Type.Optional(ModelConfig),

  /**
   * The context of the thread, including the system prompt, messages, and tools.
   */
  context: Type.Optional(ThreadContext),
};

/**
 * A completed-run snapshot of a thread. It intentionally excludes `runHistory`
 * so persisted run history cannot recursively contain itself.
 */
export const ThreadSnapshot = Type.Object(THREAD_FIELDS);
export type ThreadSnapshot = Static<typeof ThreadSnapshot>;

/**
 * A completed run in a thread's durable debug timeline.
 */
export const ThreadRunSnapshot = Type.Object({
  /**
   * Thread state captured when the run completed.
   */
  thread: ThreadSnapshot,

  /**
   * Epoch milliseconds (`Date.now()`) when the run completed.
   */
  timestamp: Type.Number(),
});
export type ThreadRunSnapshot = Static<typeof ThreadRunSnapshot>;

/**
 * The definition of a thread.
 */
export const Thread = Type.Object({
  ...THREAD_FIELDS,

  /**
   * Recent completed runs for debugging and replay. Entries are bounded by the
   * desktop store and store de-nested thread snapshots.
   */
  runHistory: Type.Optional(Type.Array(ThreadRunSnapshot)),
});
export type Thread = Static<typeof Thread>;
