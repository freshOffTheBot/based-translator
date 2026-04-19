import type { WebPreferences } from 'electron';


/**
 * Builds the shared Electron `webPreferences` used by this app.
 *
 * This helper keeps the Electron renderer security defaults in one place.
 * We use it so every window starts with the same secure baseline and only
 * customizes the preload script path when needed.
 *
 * Even though modern Electron already defaults some of these values, we still
 * set them explicitly so the app's security posture is easy to see in code and
 * does not change silently if Electron defaults or app code change later.
 * 
 * Example:
 * 		const browserWindow = new BrowserWindow({
 * 			webPreferences: createAppWebPreferences(path.join(__dirname, 'preload.js')),
 * 		});
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
