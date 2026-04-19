
import path from 'node:path';
import { defineConfig } from 'vite';


/**
 * # VITE CONFIG
 * - Configures the local webapp dev server and production build output.
 * - Adds a small dev-only route so `/dev` opens the component docs page.
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
			 * Registers local dev middleware before Vite serves files.
			 */
			configureServer(server) {
				server.middlewares.use((request: any, _response, next) => {
					const requestUrl = request.url;

					if (!requestUrl) {
						next();
						return;
					}

					// Keep the dev docs page on the expected URL while serving the src HTML file.
					if (requestUrl === '/dev' || requestUrl === '/dev.html') {
						request.url = './dev/dev.html';
					}

					next();
				});
			},
		},
	],
});
