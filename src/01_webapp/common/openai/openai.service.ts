
import OpenAI from 'openai';
import { DEFAULT_TRANSLATION_TEMPLATE, TRANSCRIPTION_MODEL, TRANSLATION_MODEL, TRANSLATION_PLACEHOLDER } from './openai.constant';


/**
 * # OPENAI SERVICE
 * - Creates browser-side OpenAI clients from the user's API key.
 * - Builds the speech-to-text request file and the translation request input.
 * - Keeps OpenAI API calls out of UI controllers.
 */


export function createOpenAIClient(apiKey: string): OpenAI {
	return new OpenAI({
		apiKey,
		dangerouslyAllowBrowser: true,
	});
}

/**
 * Validates that the translation template can receive the transcription text.
 */
export function getValidatedTranslationTemplate(template: string): string {
	const safeTemplate = template.trim() || DEFAULT_TRANSLATION_TEMPLATE;

	if (!safeTemplate.includes(TRANSLATION_PLACEHOLDER)) {
		throw new Error(`Translation template must include ${TRANSLATION_PLACEHOLDER}.`);
	}

	return safeTemplate;
}

/**
 * Inserts the finished transcription into the user's translation template.
 */
export function buildTranslationInput(template: string, transcript: string): string {
	// Keep translation request format in one place.
	const safeTemplate = getValidatedTranslationTemplate(template);
	const normalizedTranscript = transcript.trim();
	return safeTemplate.replaceAll(TRANSLATION_PLACEHOLDER, normalizedTranscript);
}

/**
 * Converts the recorded browser audio blob into a File accepted by OpenAI uploads.
 */
export function buildAudioFile(audioBlob: Blob): File {
	const audioType = normalizeAudioMimeType(audioBlob.type || 'audio/webm');
	return new File([audioBlob], buildAudioFileName(audioType), { type: audioType });
}

/**
 * Sends recorded audio to the transcription API and returns plain text.
 */
export async function transcribeAudio(openai: OpenAI, audioFile: File, prompt: string): Promise<string> {
	const transcriptionText = await openai.audio.transcriptions.create({
		file: audioFile,
		model: TRANSCRIPTION_MODEL,
		response_format: 'text',
		prompt,
	});

	return transcriptionText.trim();
}

/**
 * Sends the prepared translation prompt to the Responses API.
 */
export async function translateText(openai: OpenAI, input: string): Promise<string> {
	const response = await openai.responses.create({
		model: TRANSLATION_MODEL,
		input,
	});

	return (response.output_text ?? '').trim() || '[No translation returned.]';
}

/**
 * Builds a filename with an extension that matches the normalized MIME type.
 */
function buildAudioFileName(mimeType: string): string {
	const extension = mimeType.split('/')[1] || 'webm';
	return `recording.${extension}`;
}

/**
 * Removes browser-added MIME parameters so uploaded audio has a clean type.
 */
function normalizeAudioMimeType(mimeType: string): string {
	const cleanMimeType = mimeType.split(';')[0].trim().toLowerCase();
	return cleanMimeType || 'audio/webm';
}
