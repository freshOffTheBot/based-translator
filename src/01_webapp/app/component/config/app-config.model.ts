
/**
 * # APP CONFIG MODEL
 * - Describes the view data needed by the Configuration tab.
 * - The config component is stateless, so rendering depends only on this model.
 */

import type { MouseCursorFollowerHideTimeoutMs } from '../../app.constant';


/**
 * ## App Config Model
 * - If the same model is passed in, the same view should render.
 */
export interface AppConfigModel {
	// User-provided OpenAI API key stored in browser localStorage.
	apiKey: string;

	// Optional prompt that helps speech-to-text catch special words.
	transcriptionPrompt: string;

	// Template used to build the translation request from the transcription.
	translationTemplate: string;

	// Native mouse-cursor-follower timeout after each translation.
	mouseCursorFollowerHideTimeoutMs: MouseCursorFollowerHideTimeoutMs;

	// True when config inputs should be locked during OpenAI requests.
	isDisabled: boolean;
}
