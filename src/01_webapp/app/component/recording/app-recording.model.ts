
/**
 * # APP RECORDING MODEL
 * - Describes the view data needed by the Recording tab.
 * - The recording component is stateless, so rendering depends only on this model.
 */

import type { AppPhase, StatusTone } from '../../common/app-state.service';


/**
 * ## App Recording Model
 * - If the same model is passed in, the same view should render.
 */
export interface AppRecordingModel {
	// Current recording and request phase used to choose button state.
	phase: AppPhase;

	// Status message shown under the recording buttons.
	statusMessage: string;

	// Visual tone used for the status message.
	statusTone: StatusTone;

	// Text returned by the OpenAI transcription request.
	transcriptionOutput: string;

	// Text returned by the OpenAI translation request.
	translationOutput: string;
}
