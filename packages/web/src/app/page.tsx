"use client";

import { FileSystemTreeView } from "@/components/file-system-tree-view/file-system-tree-view";
import { ThreadTabs, useThreadTabs } from "@/components/thread-tabs";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

export default function HomePage() {
  const tabs = useThreadTabs();

  return (
    <ResizablePanelGroup className="h-size">
      <ResizablePanel className="bg-background" defaultSize="16.7%">
        <FileSystemTreeView
          className="size-full"
          onSelectFile={tabs.open}
          onRemove={tabs.handleRemove}
          onMove={tabs.handleMove}
        />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel>
        <ThreadTabs
          tabs={tabs.tabs}
          activePath={tabs.activePath}
          activate={tabs.activate}
          close={tabs.close}
          reorder={tabs.reorder}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
