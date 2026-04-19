
/**
 * # NATIVE EVENT CONSTANT
 * - Event names used by browser-native wrappers such as Electron or Tauri.
 * - Keeps the webapp sandboxed by using plain DOM `CustomEvent` contracts only.
 */


// Event fired after the translation flow produces its final text output.
export const NATIVE_TRANSLATION_OUTPUT_EVENT = 'based-translator:translation-output';
