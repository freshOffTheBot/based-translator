
/**
 * # FORGE CONFIG
 * - Electron Forge packaging config for the native app.
 * - Defines the Vite entrypoints, package makers, and Electron fuse settings.
 */

import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';


/**
 * ## Forge Config
 * - Vite builds the Electron main process, preload script, and renderer bundle.
 * - Forge makers handle platform-specific packaging.
 */
const config: ForgeConfig = {
	packagerConfig: {
		// Package the app source inside an ASAR archive.
		asar: true,
	},
	rebuildConfig: {},
	makers: [
		new MakerSquirrel({}),
		new MakerZIP({}, ['darwin']),
		new MakerRpm({}),
		new MakerDeb({}),
	],
	plugins: [
		new VitePlugin({
			// Build the Electron-only entrypoints.
			// - Main process.
			// - Preload script.
			build: [
				{
					// `entry` maps to the main-process bootstrap file.
					entry: 'src/main.ts',
					config: 'vite.main.config.ts',
					target: 'main',
				},
				{
					entry: 'src/preload.ts',
					config: 'vite.preload.config.ts',
					target: 'preload',
				},
			],
			renderer: [
				{
					// Build the shared renderer bundle used by both Electron windows.
					name: 'main_window',
					config: 'vite.renderer.config.ts',
				},
			],
		}),
		// Lock down Electron features at package time.
		new FusesPlugin({
			version: FuseVersion.V1,
			[FuseV1Options.RunAsNode]: false,
			[FuseV1Options.EnableCookieEncryption]: true,
			[FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
			[FuseV1Options.EnableNodeCliInspectArguments]: false,
			[FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
			[FuseV1Options.OnlyLoadAppFromAsar]: true,
		}),
	],
};

export default config;
