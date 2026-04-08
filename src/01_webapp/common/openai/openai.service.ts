import OpenAI from 'openai';
import {
	DEFAULT_TRANSLATION_TEMPLATE,
	TRANSCRIPTION_MODEL,
	TRANSLATION_MODEL,
	TRANSLATION_PLACEHOLDER,
} from './openai.constant';

export function createOpenAIClient(apiKey: string): OpenAI {
	return new OpenAI({
		apiKey,
		dangerouslyAllowBrowser: true,
	});
}

export function getValidatedTranslationTemplate(template: string): string {
	const safeTemplate = template.trim() || DEFAULT_TRANSLATION_TEMPLATE;
	if (!safeTemplate.includes(TRANSLATION_PLACEHOLDER)) {
		throw new Error(`Translation template must include ${TRANSLATION_PLACEHOLDER}.`);
	}

	return safeTemplate;
}

export function buildTranslationInput(template: string, transcript: string): string {
	// Keep translation request format in one place.
	const safeTemplate = getValidatedTranslationTemplate(template);
	const normalizedTranscript = transcript.trim();
	return safeTemplate.replaceAll(TRANSLATION_PLACEHOLDER, normalizedTranscript);
}

export function buildAudioFile(audioBlob: Blob): File {
	const audioType = normalizeAudioMimeType(audioBlob.type || 'audio/webm');
	return new File([audioBlob], buildAudioFileName(audioType), { type: audioType });
}

export async function transcribeAudio(openai: OpenAI, audioFile: File, prompt: string): Promise<string> {
	const transcriptionText = await openai.audio.transcriptions.create({
		file: audioFile,
		model: TRANSCRIPTION_MODEL,
		response_format: 'text',
		prompt,
	});

	return transcriptionText.trim();
}

export async function translateText(openai: OpenAI, input: string): Promise<string> {
	const response = await openai.responses.create({
		model: TRANSLATION_MODEL,
		input,
	});

	return (response.output_text ?? '').trim() || '[No translation returned.]';
}

function buildAudioFileName(mimeType: string): string {
	const extension = mimeType.split('/')[1] || 'webm';
	return `recording.${extension}`;
}

function normalizeAudioMimeType(mimeType: string): string {
	const cleanMimeType = mimeType.split(';')[0].trim().toLowerCase();
	return cleanMimeType || 'audio/webm';
}
