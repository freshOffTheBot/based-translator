
import { defineConfig } from 'vite';

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
				dev: './src/dev/dev.html',
			},
		},
	},
	plugins: [
		{
			name: 'dev-route',
			configureServer(server) {
				server.middlewares.use((request: any, _response, next) => {
					const requestUrl = request.url;

					if (!requestUrl) {
						next();
						return;
					}

					// Keep the dev docs page on the expected URL while serving the src HTML file.
					if (requestUrl === '/dev' || requestUrl === '/dev.html') {
						request.url = '/src/dev/dev.html';
					}

					next();
				});
			},
		},
	],
});
