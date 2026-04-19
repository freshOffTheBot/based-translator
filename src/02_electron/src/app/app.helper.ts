/**
 * # APP HELPER
 * - Shared Electron helpers used by multiple entrypoints.
 * - Keeps repeated BrowserWindow security settings in one place.
 */

import type { WebPreferences } from 'electron';


/**
 * Builds the shared Electron `webPreferences` used by this app.
 * - Every window gets the same secure baseline.
 * - Only the preload script path changes per window.
 */
export function createAppWebPreferences(preloadPath: string): WebPreferences {
	return {
		// Keep the renderer sandboxed.
		sandbox: true,

		// Keep page code isolated from preload.
		contextIsolation: true,

		// Keep Node.js out of the renderer.
		nodeIntegration: false,

		// Keep <webview> disabled.
		webviewTag: false,

		// Use the window-specific preload script.
		preload: preloadPath,
	};
}
