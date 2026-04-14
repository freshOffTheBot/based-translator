import { ipcRenderer } from 'electron';
import { OVERLAY_WINDOW_HASH } from './app/app.constant';
import { bindMouseCursorFollowerMainWindowNativeEvents, bindMouseCursorFollowerOverlayWindowNativeEvents } from './common/mouseCursorFollower/mouseCursorFollower.service';


/**
 * # PRELOAD
 * - Bridges webapp DOM CustomEvents to Electron IPC.
 * - Keeps Electron APIs out of the shared webapp source.
 */

if (window.location.hash === `#${OVERLAY_WINDOW_HASH}`) {
	bindMouseCursorFollowerOverlayWindowNativeEvents(ipcRenderer);
} else {
	bindMouseCursorFollowerMainWindowNativeEvents(ipcRenderer);
}
