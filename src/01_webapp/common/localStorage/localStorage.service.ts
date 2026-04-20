
/**
 * # LOCAL STORAGE SERVICE
 * - Reads and writes user configuration in the browser only.
 * - Keeps `localStorage` access out of UI controllers.
 * - Provides defaults for optional prompt fields when nothing has been saved yet.
 */

import { DEFAULT_TRANSCRIPTION_PROMPT, DEFAULT_TRANSLATION_TEMPLATE } from '../../app/app.constant';
import { STORAGE_KEY_API, STORAGE_KEY_TRANSCRIPTION_PROMPT, STORAGE_KEY_TRANSLATION_TEMPLATE } from './localStorage.constant';


/**
 * Reads the saved API key, or returns an empty string on first load.
 */
export function loadApiKey(): string {
	return localStorage.getItem(STORAGE_KEY_API) ?? '';
}

/**
 * Saves the latest API key in browser storage only.
 */
export function saveApiKey(apiKey: string): void {
	localStorage.setItem(STORAGE_KEY_API, apiKey);
}

/**
 * Reads the saved transcription prompt, or falls back to the default helper prompt.
 */
export function loadTranscriptionPrompt(): string {
	return localStorage.getItem(STORAGE_KEY_TRANSCRIPTION_PROMPT) ?? DEFAULT_TRANSCRIPTION_PROMPT;
}

/**
 * Saves the transcription prompt used for `openai.audio.transcriptions.create`.
 */
export function saveTranscriptionPrompt(prompt: string): void {
	localStorage.setItem(STORAGE_KEY_TRANSCRIPTION_PROMPT, prompt);
}

/**
 * Reads the saved translation template, or falls back to the default template.
 */
export function loadTranslationTemplate(): string {
	return localStorage.getItem(STORAGE_KEY_TRANSLATION_TEMPLATE) ?? DEFAULT_TRANSLATION_TEMPLATE;
}

/**
 * Saves the translation template used to build the Responses API input.
 */
export function saveTranslationTemplate(template: string): void {
	localStorage.setItem(STORAGE_KEY_TRANSLATION_TEMPLATE, template);
}
