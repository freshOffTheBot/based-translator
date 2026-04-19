
/**
 * # OPENAI CONSTANTS
 * - Defines shared OpenAI request defaults.
 * - The app uses one model for speech-to-text and one model for translation.
 * - Keeping the defaults here makes the config flow and service flow match.
 */


/**
 * ## Request Defaults
 * - These values are shared by the OpenAI service and the app state defaults.
 */

// Speech-to-text model used by `openai.audio.transcriptions.create`.
export const TRANSCRIPTION_MODEL = 'gpt-4o-transcribe';

// Translation model used by `openai.responses.create`.
export const TRANSLATION_MODEL = 'gpt-5.2';

// Placeholder that must exist inside the translation template.
export const TRANSLATION_PLACEHOLDER = '{{transcription}}';

// Default helper prompt for catching clearer speech-to-text results.
export const DEFAULT_TRANSCRIPTION_PROMPT = 'Transcribe clearly and keep punctuation natural.';

// Default translation template shown in Configuration.
export const DEFAULT_TRANSLATION_TEMPLATE = `Translate ${TRANSLATION_PLACEHOLDER} into English.`;
