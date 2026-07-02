"use client";

import type { Thread } from "@llm-space/core";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";

import { createRpcTransport, localFs } from "@/client";
import { ThreadPlayground } from "@/components/thread-playground";
import { parentOf, threadPathForTitle } from "@/lib/thread-file";
import { cn } from "@/lib/utils";

// One transport for the app: stream agent runs over Electrobun RPC to the bun
// process (there is no HTTP server in the desktop app).
const rpcTransport = createRpcTransport();

interface ThreadTabPaneProps {
  path: string;
  active: boolean;
  onMove?: (from: string, to: string) => void;
}

/**
 * One open thread. Each pane owns its own fetch + debounced persistence and stays
 * mounted while inactive (hidden via CSS) so its store, undo history, and any
 * in-progress streaming run survive tab switches.
 */
export function ThreadTabPane({ path, active, onMove }: ThreadTabPaneProps) {
  const qc = useQueryClient();
  const { data: thread, isLoading } = useQuery({
    queryKey: ["thread", path],
    queryFn: () => localFs.read(path),
  });

  // Persist edits back to the same path, debounced so we don't write per keystroke.
  // `pending` holds the latest unsaved thread so we can flush it on unmount.
  const writeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<Thread | null>(null);
  const pathRef = useRef(path);
  pathRef.current = path;

  const flushPending = useCallback(async () => {
    if (writeTimer.current) {
      clearTimeout(writeTimer.current);
      writeTimer.current = null;
    }
    const thread = pending.current;
    pending.current = null;
    if (thread !== null) {
      await localFs.write(pathRef.current, thread);
    }
  }, []);

  const handleChange = useCallback(
    (next: Thread) => {
      pending.current = next;
      if (writeTimer.current) clearTimeout(writeTimer.current);
      writeTimer.current = setTimeout(() => {
        void flushPending();
      }, 500);
    },
    [flushPending]
  );

  // Flush any pending write when the tab closes so the last edit is never dropped.
  useEffect(() => {
    return () => {
      void flushPending();
    };
  }, [flushPending]);

  const handleRenameTitle = useCallback(
    async (title: string): Promise<boolean> => {
      const from = pathRef.current;
      const to = threadPathForTitle(from, title);
      if (to === from) {
        return true;
      }

      await flushPending();
      await localFs.mv(from, to);
      const moved = await localFs.read(to);
      await localFs.write(to, moved);
      qc.setQueryData(["thread", to], moved);
      void qc.invalidateQueries({ queryKey: ["fs", "local", "ls"] });
      void qc.invalidateQueries({ queryKey: ["thread", from] });
      if (parentOf(from) !== parentOf(to)) {
        void qc.invalidateQueries({
          queryKey: ["fs", "local", "ls", parentOf(from)],
        });
      }
      onMove?.(from, to);
      return true;
    },
    [flushPending, onMove, qc]
  );

  return (
    <div className={cn("size-full", !active && "hidden")}>
      <ThreadPlayground
        className="bg-background size-full shadow-lg"
        loading={isLoading}
        path={path}
        initialValue={thread}
        active={active}
        transport={rpcTransport}
        onChange={handleChange}
        onRenameTitle={handleRenameTitle}
      />
    </div>
  );
}
