
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
