
/**
 * # VITE RENDERER CONFIG
 * - Vite config for the Electron renderer bundle.
 * - Allows the Electron renderer to reuse shared webapp assets and source files.
 */

import path from 'node:path';
import fs from 'node:fs';
import { defineConfig } from 'vite';


/**
 * Reads the app version from the root package file so every runtime shows the same version.
 */
function getRootPackageVersion(): string {
	const packageJsonPath = path.resolve(__dirname, '../../package.json');
	const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as { version?: string };

	return packageJson.version ?? '0.0.0';
}


/**
 * ## Vite Renderer Config
 * - The Electron renderer imports from `src/01_webapp`, so the dev server must allow that path.
 */
export default defineConfig({
	define: {
		__APP_RUNTIME__: JSON.stringify('electron'),
		__APP_VERSION__: JSON.stringify(getRootPackageVersion()),
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
