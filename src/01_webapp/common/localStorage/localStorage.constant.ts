
/**
 * # LOCAL STORAGE CONSTANTS
 * - Defines the `localStorage` keys used by the webapp.
 * - The app stores config only in the browser.
 * - Keeping the keys here gives the app one source of truth for browser persistence.
 */


/**
 * ## Storage Keys
 * - These keys are only for browser-side config.
 * - No server-side storage is used.
 */

// OpenAI API key entered by the user.
export const STORAGE_KEY_API = 'based-translator.api-key';

// Optional prompt that helps speech-to-text catch tricky words.
export const STORAGE_KEY_TRANSCRIPTION_PROMPT = 'based-translator.transcription-prompt';

// Template used to build the translation request after transcription.
export const STORAGE_KEY_TRANSLATION_TEMPLATE = 'based-translator.translation-template';
