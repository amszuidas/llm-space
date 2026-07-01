import type { BrowserWindow } from "electrobun/bun";

import { COMMAND_META, type Command } from "../shared/commands";

import { saveZoom } from "./app/window-state";
import { mainWindowRPC } from "./rpc";

const ZOOM_STEP = 0.1;
const ZOOM_MIN = 0.3;
const ZOOM_MAX = 3.0;
const clampZoom = (zoom: number) =>
  Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom));

/**
 * Run a {@link Command} from the main process. `webview`-target commands are
 * forwarded to the renderer over RPC; `bun`-target commands (window zoom /
 * reload) run here against `window`.
 */
export function executeCommandInBun(command: Command, window: BrowserWindow) {
  if (COMMAND_META[command.type].target === "webview") {
    mainWindowRPC.send.executeCommand(command);
    return;
  }
  switch (command.type) {
    case "zoomIn": {
      const zoom = clampZoom(window.getPageZoom() + ZOOM_STEP);
      window.setPageZoom(zoom);
      saveZoom(zoom);
      return;
    }
    case "zoomOut": {
      const zoom = clampZoom(window.getPageZoom() - ZOOM_STEP);
      window.setPageZoom(zoom);
      saveZoom(zoom);
      return;
    }
    case "resetZoom": {
      window.setPageZoom(1);
      saveZoom(1);
      return;
    }
    case "reload": {
      window.webview?.executeJavascript("location.reload()");
      return;
    }
    default:
      return;
  }
}
