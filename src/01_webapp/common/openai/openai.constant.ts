
/**
 * # OPENAI CONSTANTS
 * - Defines shared OpenAI request constants.
 * - The app uses one model for speech-to-text and one model for translation.
 * - Keeping the model names here keeps SDK request settings in one place.
 */


/**
 * ## Request Defaults
 * - These values are used directly by the OpenAI service requests.
 */

// Speech-to-text model used by `openai.audio.transcriptions.create`.
export const TRANSCRIPTION_MODEL = 'gpt-4o-transcribe';

// Translation model used by `openai.responses.create`.
export const TRANSLATION_MODEL = 'gpt-5.2';
