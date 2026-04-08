import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
	server: {
		fs: {
			allow: ['.', '../01_webapp'],
		},
	},
});
