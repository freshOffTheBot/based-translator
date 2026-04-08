
/**
 * # APP CONFIG MODEL
 * - Describes the view data needed by the Configuration tab.
 * - Keeps the config component render function driven by one model object.
 */
export interface AppConfigModel {
	// User-provided OpenAI API key stored in browser localStorage.
	apiKey: string;
	// Optional prompt that helps speech-to-text catch special words.
	transcriptionPrompt: string;
	// Template used to build the translation request from the transcription.
	translationTemplate: string;
	// True when config inputs should be locked during OpenAI requests.
	isDisabled: boolean;
}
