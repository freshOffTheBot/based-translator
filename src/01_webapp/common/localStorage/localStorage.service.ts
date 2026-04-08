
import { STORAGE_KEY_API, STORAGE_KEY_TRANSCRIPTION_PROMPT, STORAGE_KEY_TRANSLATION_TEMPLATE } from './localStorage.constant';
import { DEFAULT_TRANSCRIPTION_PROMPT, DEFAULT_TRANSLATION_TEMPLATE } from '../openai/openai.constant';


/**
 * # LOCAL STORAGE SERVICE
 * - Reads and writes user configuration in the browser only.
 * - Provides safe defaults when optional prompt settings have not been saved yet.
 */


export function loadApiKey(): string {
	return localStorage.getItem(STORAGE_KEY_API) ?? '';
}

export function saveApiKey(apiKey: string): void {
	localStorage.setItem(STORAGE_KEY_API, apiKey);
}

export function loadTranscriptionPrompt(): string {
	return localStorage.getItem(STORAGE_KEY_TRANSCRIPTION_PROMPT) ?? DEFAULT_TRANSCRIPTION_PROMPT;
}

export function saveTranscriptionPrompt(prompt: string): void {
	localStorage.setItem(STORAGE_KEY_TRANSCRIPTION_PROMPT, prompt);
}

export function loadTranslationTemplate(): string {
	return localStorage.getItem(STORAGE_KEY_TRANSLATION_TEMPLATE) ?? DEFAULT_TRANSLATION_TEMPLATE;
}

export function saveTranslationTemplate(template: string): void {
	localStorage.setItem(STORAGE_KEY_TRANSLATION_TEMPLATE, template);
}
