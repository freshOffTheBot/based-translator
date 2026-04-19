
/**
 * # VITE CONFIG
 * - Configures the webapp dev server and build output.
 * - Keeps the local app URL stable on port `9999`.
 * - Adds the `/dev` route for the static component docs page.
 */

import path from 'node:path';
import { defineConfig } from 'vite';


/**
 * ## Vite Config
 * - The webapp uses plain TypeScript, HTML, CSS, and Vite.
 * - This config only handles webapp concerns. Electron has its own build config.
 */
export default defineConfig({
	server: {
		host: '0.0.0.0',
		port: 9999,
	},
	resolve: {
		alias: {
			// Use custom alias `@webapp_asset` so shared assets resolve from one stable path.
			// - We want this because the Electron renderer loads webapp SCSS from a different folder, so relative paths like `../../asset/...` can break when Vite builds the app.
			// - Example: `url('@webapp_asset/font/fixedsys-css/fsex300-webfont.woff')`.
			// - Related file: `src/02_electron/vite.renderer.config.ts`
			'@webapp_asset': path.resolve(__dirname, '../01_webapp/asset'),
		},
	},
	build: {
		outDir: 'dist',
		rollupOptions: {
			input: {
				main: './index.html',
				dev: './dev/dev.html',
			},
		},
	},
	plugins: [
		{
			name: 'dev-route',

			/**
			 * Registers a tiny dev-only route before Vite serves files.
			 */
			configureServer(server) {
				server.middlewares.use((request: any, _response, next) => {
					const requestUrl = request.url;

					if (!requestUrl) {
						next();
						return;
					}

					// Keep `/dev` simple for frens while still serving the source HTML file.
					if (requestUrl === '/dev' || requestUrl === '/dev.html') {
						request.url = './dev/dev.html';
					}

					next();
				});
			},
		},
	],
});
