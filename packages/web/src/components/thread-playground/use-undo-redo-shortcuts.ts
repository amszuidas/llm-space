import { useEffect } from "react";

import { useThreadStoreActions } from "@/stores/thread-store";

/**
 * Wire window-level Cmd/Ctrl+Z (undo) and Cmd/Ctrl+Shift+Z / Cmd/Ctrl+Y (redo)
 * to thread-level undo/redo.
 *
 * Skips when focus is inside an editable field (CodeMirror, input, textarea, or
 * contenteditable) so those keep their own native/editor-level undo.
 */
export function useUndoRedoShortcuts(enabled: boolean): void {
  const { undo, redo } = useThreadStoreActions();
  useEffect(() => {
    if (!enabled) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey) {
        return;
      }
      const key = event.key.toLowerCase();
      const isUndo = key === "z" && !event.shiftKey;
      const isRedo = (key === "z" && event.shiftKey) || key === "y";
      if (!isUndo && !isRedo) {
        return;
      }
      const target = document.activeElement;
      if (
        target instanceof HTMLElement &&
        (target.closest(".cm-editor") !== null ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        // Let the focused editor / input handle its own undo.
        return;
      }
      event.preventDefault();
      if (isRedo) {
        redo();
      } else {
        undo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [enabled, undo, redo]);
}
