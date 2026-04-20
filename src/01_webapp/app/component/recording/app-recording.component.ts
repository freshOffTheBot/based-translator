
/**
 * # APP RECORDING COMPONENT
 * - Owns the Recording tab DOM.
 * - Sends record and cancel button clicks up to the app component.
 * - Renders recording status and output text from `AppRecordingModel`.
 * - This component is stateless. The app state service owns the real flow state.
 */

import appRecordingHtml from './app-recording.html?raw';
import type { AppRecordingModel } from './app-recording.model';


/**
 * ## App Recording Events
 * - The parent app owns recording, transcription, translation, and errors.
 */
interface AppRecordingEvents {
	// Called when the Start or Finish Recording button is clicked.
	onRecordButtonClick: () => void | Promise<void>;

	// Called when the Cancel button is clicked.
	onCancelButtonClick: () => void;
}

/**
 * ## App Recording Elements
 * - Required DOM nodes used by the Recording controller.
 */
interface AppRecordingElements {
	// Start or Finish Recording button.
	recordButton: HTMLButtonElement;

	// Cancel button shown only while recording.
	cancelButton: HTMLButtonElement;

	// Status text shown under the action buttons.
	statusText: HTMLElement;

	// Wrapper around the recording action buttons.
	recordingActions: HTMLElement;

	// Wrapper around the transcription output box.
	transcriptionOutputGroup: HTMLElement;

	// Wrapper around the translation output box.
	translationOutputGroup: HTMLElement;

	// Text container for transcription output.
	transcriptionOutput: HTMLElement;

	// Text container for translation output.
	translationOutput: HTMLElement;
}

/**
 * ## App Recording Component
 * - Public controller surface returned to the parent app.
 */
export interface AppRecordingComponent {
	// Updates the Recording tab from the latest app model.
	render: (model: AppRecordingModel) => void;
}

/**
 * Creates the Recording tab controller and wires button events to the app.
 */
export function initializeAppRecordingComponent(root: HTMLElement, events: AppRecordingEvents): AppRecordingComponent {
	root.innerHTML = appRecordingHtml;

	const view = getAppRecordingElements(root);

	view.recordButton.addEventListener('click', () => {
		void events.onRecordButtonClick();
	});

	view.cancelButton.addEventListener('click', () => {
		events.onCancelButtonClick();
	});

	return {
		/**
		 * Renders button state, status tone, and output visibility for the recording flow.
		 */
		render(model: AppRecordingModel): void {
			const isRecording = model.phase === 'recording';
			const isRequestBusy = model.phase === 'transcribing' || model.phase === 'translating';

			// One button changes meaning by phase:
			// - `Start Recording` while idle/success/error.
			// - `Finish Recording` while actively recording.
			view.recordButton.textContent = isRecording ? 'Finish Recording' : 'Start Recording';
			view.recordButton.disabled = isRequestBusy;
			view.cancelButton.classList.toggle('hidden', !isRecording);
			view.cancelButton.disabled = !isRecording;

			view.statusText.textContent = model.statusMessage;
			view.statusText.className = `status-text tone-${model.statusTone}`;
			view.transcriptionOutput.textContent = model.transcriptionOutput;
			view.translationOutput.textContent = model.translationOutput;

			// Keep output boxes hidden on startup, then show them while recording or after results exist.
			const shouldShowOutputs =
				isRecording || Boolean(model.transcriptionOutput.trim()) || Boolean(model.translationOutput.trim());

			view.transcriptionOutputGroup.classList.toggle('hidden', !shouldShowOutputs);
			view.translationOutputGroup.classList.toggle('hidden', !shouldShowOutputs);
		},
	};
}

/**
 * Finds required Recording tab elements and fails early if the HTML changed.
 */
function getAppRecordingElements(root: HTMLElement): AppRecordingElements {
	const recordButton = root.querySelector<HTMLButtonElement>('#record-button');
	const cancelButton = root.querySelector<HTMLButtonElement>('#cancel-button');
	const statusText = root.querySelector<HTMLElement>('#status-text');
	const recordingActions = root.querySelector<HTMLElement>('#recording-actions');
	const transcriptionOutputGroup = root.querySelector<HTMLElement>('#transcription-output-group');
	const translationOutputGroup = root.querySelector<HTMLElement>('#translation-output-group');
	const transcriptionOutput = root.querySelector<HTMLElement>('#transcription-output');
	const translationOutput = root.querySelector<HTMLElement>('#translation-output');

	if (
		!recordButton ||
		!cancelButton ||
		!statusText ||
		!recordingActions ||
		!transcriptionOutputGroup ||
		!translationOutputGroup ||
		!transcriptionOutput ||
		!translationOutput
	) {
		throw new Error('Required recording DOM element is missing.');
	}

	return {
		recordButton,
		cancelButton,
		statusText,
		recordingActions,
		transcriptionOutputGroup,
		translationOutputGroup,
		transcriptionOutput,
		translationOutput,
	};
}
