import { forwardRef, lazy, Suspense } from "react";

import { cn } from "@/lib/utils";

import type { CodeEditorHandle, CodeEditorProps } from "./editor";

export type { CodeEditorHandle, CodeEditorProps } from "./editor";

// CodeMirror is the single heaviest first-paint dependency (~200 kB gzipped) and
// only mounts inside editors, so load it on demand. The surrounding UI and the
// message text paint immediately via the fallback below; the real editor swaps
// in once its chunk resolves (one shared load covers every editor on the page).
const LazyCodeEditor = lazy(() =>
  import("./editor").then((m) => ({ default: m.CodeEditor }))
);

/**
 * Non-interactive stand-in shown while the CodeMirror chunk loads. Mirrors the
 * editor's container and typography (same border, radius, padding, `font-mono`
 * and `--text-sm` sizing) so the swap-in doesn't shift layout.
 */
function CodeEditorFallback({
  className,
  hideBorder,
  readonly,
  value,
  placeholder,
}: CodeEditorProps) {
  return (
    <div
      className={cn(
        "flex cursor-text flex-col overflow-hidden rounded-lg border bg-(--textarea) px-1 transition-opacity",
        hideBorder && "border-transparent",
        readonly && "opacity-67",
        className
      )}
    >
      <pre className="overflow-auto px-2 py-1 font-mono text-sm break-words whitespace-pre-wrap">
        {value || (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
      </pre>
    </div>
  );
}

export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(
  function CodeEditor(props, ref) {
    return (
      <Suspense fallback={<CodeEditorFallback {...props} />}>
        <LazyCodeEditor {...props} ref={ref} />
      </Suspense>
    );
  }
);
