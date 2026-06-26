"use client";

import { type FunctionTool } from "@llm-space/core";
import { PlusIcon, SquareFunction, XIcon } from "lucide-react";
import React, { memo, useCallback, useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { useThreadStore, useThreadStoreActions } from "@/stores/thread-store";

import { useAutoAnimation } from "../../../lib/use-auto-animation";
import { Tooltip } from "../../tooltip";
import { Button } from "../../ui/button";

import { ToolEditorDialog } from "./tool-editor-dialog";

function _ToolListItem({
  tool,
  readonly,
  onEdit,
  onRemove,
}: {
  tool: FunctionTool;
  readonly?: boolean;
  // eslint-disable-next-line no-unused-vars
  onEdit: (tool: FunctionTool) => void;
  // eslint-disable-next-line no-unused-vars
  onRemove: (tool: FunctionTool) => void;
}) {
  const keys = useMemo(
    () =>
      Object.keys(
        (tool.parameters as Record<string, unknown>).properties ?? {}
      ),
    []
  );
  const required = useMemo(
    () => (tool.parameters as { required: string[] }).required ?? [],
    [tool.parameters]
  );
  const handleRemove = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      onRemove(tool);
    },
    [onRemove, tool]
  );

  return (
    <div className="group/tool bg-secondary hover:text-accent-foreground inline-flex h-6 shrink-0 items-center rounded-md text-xs/relaxed transition-colors">
      <Tooltip
        content={
          <div>
            <div>
              <span className="font-bold">{tool.name}</span>
              <span>(</span>
              <span>
                {keys.length > 0
                  ? "{ " +
                    keys
                      .map((key) => (required.includes(key) ? key : `[${key}]`))
                      .join(", ") +
                    " }"
                  : ""}
              </span>
              <span>)</span>
            </div>
            {tool.description && (
              <div className="whitespace-pre-wrap pt-2 text-xs opacity-60">
                {tool.description}
              </div>
            )}
          </div>
        }
      >
        <button
          type="button"
          className="focus-visible:ring-ring/30 inline-flex h-full items-center gap-1 rounded-l-md pl-2 outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50"
          disabled={readonly}
          onClick={() => onEdit(tool)}
        >
          <SquareFunction className="size-3.5 shrink-0 opacity-70" />
          <span>{tool.name}</span>
        </button>
      </Tooltip>
      {!readonly && (
        <Tooltip content="Remove tool">
          <button
            type="button"
            className="text-muted-foreground hover:text-accent-foreground focus-visible:ring-ring/30 inline-flex h-full items-center rounded-r-md pl-1 pr-1 opacity-0 outline-none transition-opacity hover:opacity-100 focus-visible:ring-2 group-hover/tool:opacity-70"
            onClick={handleRemove}
          >
            <XIcon className="size-3" />
          </button>
        </Tooltip>
      )}
    </div>
  );
}
const ToolListItem = memo(_ToolListItem);

export function ToolListView({
  className,
  readonly,
}: {
  className?: string;
  readonly?: boolean;
}) {
  const tools = useThreadStore((s) => s.thread.context?.tools);
  const { removeTool } = useThreadStoreActions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<FunctionTool | null>(null);

  const [animationContainerRef] = useAutoAnimation({ duration: 150 });

  const openAddDialog = useCallback(() => {
    setEditingTool(null);
    setDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((tool: FunctionTool) => {
    setEditingTool(tool);
    setDialogOpen(true);
  }, []);

  const handleRemoveTool = useCallback(
    (tool: FunctionTool) => {
      removeTool(tool.name);
    },
    [removeTool]
  );

  return (
    <>
      <div
        ref={animationContainerRef}
        className={cn("group flex min-w-0 grow flex-wrap gap-2.5", className)}
      >
        {tools?.map((t) => (
          <ToolListItem
            key={t.name}
            tool={t}
            readonly={readonly}
            onEdit={openEditDialog}
            onRemove={handleRemoveTool}
          />
        ))}
        <Button
          className={cn(
            "hover:bg-transparent! -ml-1 px-0 transition-opacity group-hover:opacity-100",
            readonly
              ? "hidden"
              : !tools || tools.length === 0
                ? "opacity-50"
                : "opacity-0"
          )}
          variant="ghost"
          size="sm"
          disabled={readonly}
          onClick={openAddDialog}
        >
          <PlusIcon className="size-3" />
          Add tool
        </Button>
      </div>
      <ToolEditorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        tool={editingTool}
      />
    </>
  );
}
