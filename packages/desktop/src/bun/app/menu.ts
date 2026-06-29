import { ApplicationMenu, type BrowserWindow } from "electrobun/bun";

import { saveZoom } from "./window-state";

ApplicationMenu.setApplicationMenu([
  {
    submenu: [
      { label: "About LLM Space", role: "about" },
      { type: "divider" },
      {
        label: "Quit LLM Space",
        role: "quit",
        accelerator: "CommandOrControl+Q",
      },
    ],
  },
  {
    label: "Edit",
    submenu: [
      { role: "undo" },
      { role: "redo" },
      { type: "separator" },
      { role: "cut" },
      { role: "copy" },
      { role: "paste" },
      { role: "pasteAndMatchStyle" },
      { role: "delete" },
      { role: "selectAll" },
    ],
  },
  {
    label: "View",
    submenu: [
      // Electrobun has no built-in zoom role; these drive WKWebView's native
      // page zoom via `setPageZoom` (see registerMenuActions).
      {
        label: "Zoom In",
        action: "zoomIn",
        accelerator: "CommandOrControl+Plus",
      },
      {
        label: "Zoom Out",
        action: "zoomOut",
        accelerator: "CommandOrControl+-",
      },
      { type: "separator" },
      {
        label: "Reset Zoom",
        action: "resetZoom",
        accelerator: "CommandOrControl+0",
      },
    ],
  },
]);

const ZOOM_STEP = 0.1;
const ZOOM_MIN = 0.3;
const ZOOM_MAX = 3.0;
const clampZoom = (zoom: number) =>
  Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom));

/**
 * Wire the View-menu zoom actions to a window's WebKit page zoom. Called after
 * the window exists (the menu itself is set at import time above).
 */
export function registerMenuActions(window: BrowserWindow) {
  ApplicationMenu.on("application-menu-clicked", (event) => {
    const { action } = (event as { data: { action: string } }).data;
    let zoom: number;
    switch (action) {
      case "zoomIn":
        zoom = clampZoom(window.getPageZoom() + ZOOM_STEP);
        break;
      case "zoomOut":
        zoom = clampZoom(window.getPageZoom() - ZOOM_STEP);
        break;
      case "resetZoom":
        zoom = 1;
        break;
      default:
        return;
    }
    window.setPageZoom(zoom);
    saveZoom(zoom);
  });
}
