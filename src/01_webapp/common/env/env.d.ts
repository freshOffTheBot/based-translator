
/**
 * Build-time runtime value replaced by Vite `define`.
 *
 * @see src/01_webapp/vite.config.ts
 * @see src/02_electron/vite.renderer.config.ts
 * @see src/01_webapp/common/env/env.helper.ts
 */
declare const __APP_RUNTIME__: 'webapp' | 'electron';

/**
 * Build-time app version value replaced by Vite `define`.
 *
 * @see package.json
 * @see src/01_webapp/vite.config.ts
 * @see src/02_electron/vite.renderer.config.ts
 * @see src/01_webapp/common/env/env.helper.ts
 */
declare const __APP_VERSION__: string;
