

/**
 * # APP CONSTANT
 * - Electron app-level constants shared across entrypoints.
 * - Keeps window sizing and native bridge names in one place.
 */


/**
 * ## Window Constants
 * - Used when the main Electron window is created.
 */

// Default width of the main app window.
export const APP_MAIN_WINDOW_WIDTH = 800;

// Default height of the main app window.
export const APP_MAIN_WINDOW_HEIGHT = 600;

// Minimum width allowed for the main app window.
export const APP_MAIN_WINDOW_MIN_WIDTH = 640;

// Minimum height allowed for the main app window.
export const APP_MAIN_WINDOW_MIN_HEIGHT = 480;


/**
 * ## Native Bridge Constants
 * - Used by preload, main, and overlay files to keep one contract.
 */

// IPC channel that carries final translation output inside Electron.
export const NATIVE_TRANSLATION_OUTPUT_IPC_CHANNEL = 'based-translator:native-translation-output';

// IPC channel that explicitly hides the mouse-cursor-follower label inside Electron.
export const NATIVE_MOUSE_CURSOR_FOLLOWER_CLEAR_IPC_CHANNEL = 'based-translator:native-mouse-cursor-follower-clear';

// Hash used to boot the overlay renderer instead of the shared webapp.
export const OVERLAY_WINDOW_HASH = 'overlay';
