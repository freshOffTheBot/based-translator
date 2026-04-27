
/**
 * Build-time runtime value replaced by Vite `define`.
 *
 * @see src/01_webapp/vite.config.ts
 * @see src/02_electron/vite.renderer.config.ts
 * @see src/01_webapp/common/env/env.helper.ts
 */
declare const __APP_RUNTIME__: 'webapp' | 'electron';
