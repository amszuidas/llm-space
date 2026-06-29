import { createRpcTransport } from "@/client/rpc-transport";
import { ThreadPlayground } from "@/components/thread-playground";

// One transport for the app: stream agent runs over Electrobun RPC to the bun
// process (there is no HTTP server in the desktop app).
const rpcTransport = createRpcTransport();

export function Page() {
  return (
    <ThreadPlayground
      className="size-full"
      transport={rpcTransport}
      initialValue={{
        model: {
          id: "deepseek-v4-flash",
          provider: "deepseek",
        },
      }}
    />
  );
}
