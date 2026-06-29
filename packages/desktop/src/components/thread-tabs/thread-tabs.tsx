"use client";

import { Tabs } from "@sinm/react-chrome-tabs";
import "@sinm/react-chrome-tabs/css/chrome-tabs-dark-theme.css";
import "@sinm/react-chrome-tabs/css/chrome-tabs.css";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

import { ThreadTabPane } from "./thread-tab-pane";
import { tabLabel } from "./use-thread-tabs";

interface ThreadTabsProps {
  className?: string;
  tabs: string[];
  activePath: string | null;
  activate: (path: string) => void;
  close: (path: string) => void;
  reorder: (from: number, to: number) => void;
}

export function ThreadTabs({
  className,
  tabs,
  activePath,
  activate,
  close,
  reorder,
}: ThreadTabsProps) {
  // The chrome-tabs lib renders tab DOM imperatively and exposes no tooltip prop,
  // but it stamps each tab's full path onto `data-tab-id`. Mirror that into the
  // native `title` attribute so hovering a tab reveals its relative path. The
  // lib's own updateTab never touches `title`, so this survives label/active
  // updates; we re-apply whenever the tab set changes (covers adds/reorders).
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    root
      .querySelectorAll<HTMLElement>(".chrome-tab[data-tab-id]")
      .forEach((el) => {
        const id = el.getAttribute("data-tab-id");
        if (id) el.title = id;
      });
  }, [tabs, activePath]);

  if (tabs.length === 0) {
    return (
      <div
        className={cn(
          "text-muted-foreground flex size-full items-center justify-center text-sm",
          className
        )}
      >
        Select a thread to open
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("flex size-full flex-col", className)}>
      <Tabs
        darkMode
        tabs={tabs.map((path) => ({
          id: path,
          title: tabLabel(path),
          favicon: false,
          active: path === activePath,
        }))}
        onTabActive={activate}
        onTabClose={close}
        onTabReorder={(_id, from, to) => reorder(from, to)}
      />
      <div className="relative min-h-0 flex-1">
        {tabs.map((path) => (
          <ThreadTabPane
            key={path}
            path={path}
            active={path === activePath}
          />
        ))}
      </div>
    </div>
  );
}
