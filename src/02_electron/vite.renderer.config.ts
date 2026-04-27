
/**
 * # VITE RENDERER CONFIG
 * - Vite config for the Electron renderer bundle.
 * - Allows the Electron renderer to reuse shared webapp assets and source files.
 */

import path from 'node:path';
import { defineConfig } from 'vite';


/**
 * ## Vite Renderer Config
 * - The Electron renderer imports from `src/01_webapp`, so the dev server must allow that path.
 */
export default defineConfig({
	define: {
		__APP_RUNTIME__: JSON.stringify('electron'),
	},
	server: {
		fs: {
			// Allow the renderer bundle to read the shared webapp source tree in dev.
			allow: ['.', '../01_webapp'],
		},
	},
	resolve: {
		alias: {
			// Use custom alias `@webapp_asset` so shared assets resolve from one stable path.
			// - Related file: `src/01_webapp/vite.config.ts`
			'@webapp_asset': path.resolve(__dirname, '../01_webapp/asset'),
		},
	},
});
