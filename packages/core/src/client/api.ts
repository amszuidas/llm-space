import type { AgentEvent } from "@earendil-works/pi-agent-core";

import type { AgentStreamRequest } from "../types/agent";
import type { ModelConfig } from "../types/models";
import type { ThreadContext } from "../types/threads";

import { convertToPiContext } from "./converters";
import { createHttpTransport, type AgentTransport } from "./transport";

export async function* streamThread(
  args: { context: ThreadContext; model: ModelConfig },
  config: {
    signal?: AbortSignal;
    endpoint?: string;
    transport?: AgentTransport;
  } = {}
): AsyncGenerator<AgentEvent> {
  const context = convertToPiContext(args.context);
  if (context.messages.length > 0) {
    const lastMessage = context.messages[context.messages.length - 1]!;
    // 最后一条消息必须是 userMessage
    if (lastMessage.role === "assistant") {
      throw new Error(
        "The last message must be a user message or a tool call result."
      );
    }
  }
  const request: AgentStreamRequest = {
    model: {
      provider: args.model.provider,
      id: args.model.id,
    },
    config: {
      model: args.model.params,
    },
    context,
  };
  // Transport is the only HTTP-vs-RPC-specific piece; default to HTTP/SSE.
  const transport = config.transport ?? createHttpTransport(config.endpoint);
  yield* transport(request, { signal: config.signal });
}
