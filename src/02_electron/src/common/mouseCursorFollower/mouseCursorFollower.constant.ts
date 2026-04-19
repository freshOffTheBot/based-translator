/**
 * # MOUSE CURSOR FOLLOWER CONSTANT
 * - Local constants used only by the native translation overlay feature.
 */


/**
 * ## Overlay Layout Constants
 * - Used by the overlay window and its cursor-tracking logic.
 */

// Fixed overlay window size.
export const MOUSE_CURSOR_FOLLOWER_WINDOW_DIMENSIONS = {
	width: 360,
	height: 160,
};

// Distance between the mouse cursor and the overlay label.
export const MOUSE_CURSOR_FOLLOWER_CURSOR_OFFSET = {
	x: 18,
	y: 20,
};

// Cursor tracking interval used to keep the overlay near the pointer.
export const MOUSE_CURSOR_FOLLOWER_CURSOR_POLL_INTERVAL_MS = 16;

// Root selector for the translated-text label inside the overlay HTML.
export const MOUSE_CURSOR_FOLLOWER_LABEL_SELECTOR = '#cursor-label';
