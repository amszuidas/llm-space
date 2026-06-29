import type {
  AgentEvent,
  AgentStreamRequest,
  ModelProviderGroup,
} from "@llm-space/core";
import type { RPCSchema } from "electrobun";

/** A webview→bun request to start streaming an agent run. */
export interface StreamThreadRequestPayload {
  streamId: string;
  request: AgentStreamRequest;
}

/** A bun→webview chunk of a streaming agent run, keyed by `streamId`. */
export type StreamThreadResponsePayload =
  | { streamId: string; type: "event"; event: AgentEvent }
  | { streamId: string; type: "done" }
  | { streamId: string; type: "error"; message: string };

/** A webview→bun request to abort an in-flight stream. */
export interface AbortStreamThreadPayload {
  streamId: string;
}

export interface DesktopRPCType {
  bun: RPCSchema<{
    requests: {
      availableModels: {
        params: Record<string, never>;
        response: ModelProviderGroup[];
      };
      toggleMaximized: {
        params: Record<string, never>;
        response: { maximized: boolean };
      };
    };
    // Messages the webview SENDS and the bun side handles.
    messages: {
      sendStreamThreadRequest: StreamThreadRequestPayload;
      abortStreamThread: AbortStreamThreadPayload;
    };
  }>;
  webview: RPCSchema<{
    requests: Record<string, never>;
    // Messages the bun side SENDS and the webview handles.
    messages: {
      receiveStreamThreadResponse: StreamThreadResponsePayload;
    };
  }>;
}
