
/**
 * # VITE PRELOAD CONFIG
 * - Vite config for the Electron preload bundle.
 * - This stays minimal because the preload script only needs the Forge default build path.
 */

import { defineConfig } from 'vite';


/**
 * ## Vite Preload Config
 * - No extra alias or dev-server setup is needed for preload.
 */
export default defineConfig({});
