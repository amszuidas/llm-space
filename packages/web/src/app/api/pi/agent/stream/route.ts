import type { AgentStreamRequest } from "@llm-space/core";
import { streamAgent } from "@llm-space/core/server";
import type { NextRequest } from "next/server";

import { availableModels } from "@/server/models";

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  const args = (await request.json()) as AgentStreamRequest;

  const abortController = new AbortController();
  const agentStream = streamAgent(args, {
    models: availableModels,
    signal: abortController.signal,
  });

  const responseStream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        const payload = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      request.signal.addEventListener("abort", () => {
        try {
          abortController.abort();
        } catch {
          // Ignore errors
        }
        controller.close();
      });

      controller.enqueue(encoder.encode("data: [START]\n\n"));
      // Let errors thrown by the generator (e.g. unknown model) reject start()
      // and error the response stream, so the client transport surfaces them —
      // matching the prior inline behavior.
      for await (const message of agentStream) {
        send(message);
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
  return new Response(responseStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
    status: 200,
  });
}
