export const TRANSCRIPTION_MODEL = 'gpt-4o-transcribe';
export const TRANSLATION_MODEL = 'gpt-5.2';
export const TRANSLATION_PLACEHOLDER = '{{transcription}}';
export const DEFAULT_TRANSCRIPTION_PROMPT = 'Transcribe clearly and keep punctuation natural.';
export const DEFAULT_TRANSLATION_TEMPLATE = `Translate ${TRANSLATION_PLACEHOLDER} into English.`;
