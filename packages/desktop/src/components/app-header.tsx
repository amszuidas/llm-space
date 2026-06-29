import { useCallback } from "react";

import { electrobun } from "@/lib/electrobun";

export function AppHeader() {
  const handleDoubleClick = useCallback(() => {
    if (!electrobun.rpc) {
      return;
    }
    void electrobun.rpc.request.toggleMaximized({});
  }, []);
  return (
    <header
      className="titlebar electrobun-webkit-app-region-drag flex h-8 w-full cursor-default items-center justify-center border-b select-none"
      onDoubleClick={handleDoubleClick}
    >
      <h1 className="text-sm">LLM Space 4</h1>
    </header>
  );
}
