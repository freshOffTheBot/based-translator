
import path from 'node:path';
import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
	server: {
		fs: {
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
