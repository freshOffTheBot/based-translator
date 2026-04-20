
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
