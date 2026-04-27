
/**
 * # APP CONSTANTS
 * - Defines shared constants for the based-translator app flow.
 * - These values belong to the app because they describe app defaults and template rules.
 * - Keeping them here makes the configuration UI and request flow share one source of truth.
 */


/**
 * ## App Defaults
 * - These values are shared by Configuration, local storage defaults, and the recording flow.
 */

// Placeholder that must exist inside the translation template.
export const TRANSLATION_PLACEHOLDER = '{{transcription}}';

// Default helper prompt for catching clearer speech-to-text results.
export const DEFAULT_TRANSCRIPTION_PROMPT = 'Transcribe clearly and keep punctuation natural.';

// Default translation template shown in Configuration.
export const DEFAULT_TRANSLATION_TEMPLATE = `Translate ${TRANSLATION_PLACEHOLDER} into English.`;

// Native mouse-cursor-follower hide timeout values.
export type MouseCursorFollowerHideTimeoutMs = null | 5000 | 10000 | 20000 | 30000 | 60000;

// Enabled native mouse-cursor-follower hide timeout values.
export type EnabledMouseCursorFollowerHideTimeoutMs = Exclude<MouseCursorFollowerHideTimeoutMs, null>;

// Value used by form controls and storage when the native label should stay visible.
export const MOUSE_CURSOR_FOLLOWER_HIDE_TIMEOUT_DISABLED_VALUE = 'disabled';

// Valid enabled timeout values for the native mouse-cursor-follower label.
export const MOUSE_CURSOR_FOLLOWER_HIDE_TIMEOUT_MS_VALUES: ReadonlyArray<EnabledMouseCursorFollowerHideTimeoutMs> = [
	5000,
	10000,
	20000,
	30000,
	60000,
];

// Default timeout for hiding the native mouse-cursor-follower label after translation.
export const DEFAULT_MOUSE_CURSOR_FOLLOWER_HIDE_TIMEOUT_MS: MouseCursorFollowerHideTimeoutMs = 10000;
