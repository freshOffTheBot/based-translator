/**
 * # PRELOAD
 * - Bridges webapp DOM CustomEvents to Electron IPC.
 * - Keeps Electron APIs out of the shared webapp source.
 * - Chooses different bridge bindings for the main window and the overlay window.
 */

import { ipcRenderer } from 'electron';
import { OVERLAY_WINDOW_HASH } from './app/app.constant';
import { bindMouseCursorFollowerMainWindowNativeEvents, bindMouseCursorFollowerOverlayWindowNativeEvents } from './common/mouseCursorFollower/mouseCursorFollower.service';


// The same preload file is used by both Electron windows.
// - The main window forwards translation events into IPC.
// - The overlay window turns IPC messages back into DOM events.
if (window.location.hash === `#${OVERLAY_WINDOW_HASH}`) {
	bindMouseCursorFollowerOverlayWindowNativeEvents(ipcRenderer);
} else {
	bindMouseCursorFollowerMainWindowNativeEvents(ipcRenderer);
}
