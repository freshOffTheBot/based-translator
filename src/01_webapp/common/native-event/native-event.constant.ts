
/**
 * # NATIVE EVENT CONSTANT
 * - Event names used by browser-native wrappers such as Electron or Tauri.
 * - Keeps the webapp sandboxed by using plain DOM `CustomEvent` contracts only.
 */


// Event fired after the translation flow produces its final text output.
export const NATIVE_TRANSLATION_OUTPUT_EVENT = 'based-translator:translation-output';

// Event fired when native wrappers should hide the mouse-cursor-follower label.
export const NATIVE_MOUSE_CURSOR_FOLLOWER_CLEAR_EVENT = 'based-translator:mouse-cursor-follower-clear';
