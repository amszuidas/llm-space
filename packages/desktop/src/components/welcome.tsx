"use client";

import { ArrowUpRightIcon, SparklesIcon } from "lucide-react";
import { useCallback } from "react";

import { electrobun } from "@/lib/electrobun";
import { cn } from "@/lib/utils";

import { Button } from "./ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "./ui/empty";

interface WelcomeProps {
  className?: string;
  onNewFile?: () => void;
}

export function Welcome({ className, onNewFile }: WelcomeProps) {
  const handleHeaderDoubleClick = useCallback(() => {
    void electrobun.rpc?.request.toggleMaximized({});
  }, []);

  return (
    <div
      className={cn(
        "bg-tabs relative flex size-full items-center justify-center",
        className
      )}
    >
      <div
        className="electrobun-webkit-app-region-drag absolute top-0 right-0 left-0 h-11.5"
        onDoubleClick={handleHeaderDoubleClick}
      ></div>
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SparklesIcon className="size-8" />
          </EmptyMedia>
          <EmptyTitle>Welcome to LLM Space</EmptyTitle>
          <EmptyDescription>
            Create a new thread file to get started. Or open an existing one
            from the left side panel.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="flex-row justify-center gap-2">
          <Button onClick={onNewFile}>New thread</Button>
        </EmptyContent>
        <Button
          variant="link"
          asChild
          className="text-muted-foreground"
          size="sm"
        >
          <a href="#">
            Learn more <ArrowUpRightIcon />
          </a>
        </Button>
      </Empty>
    </div>
  );
}
