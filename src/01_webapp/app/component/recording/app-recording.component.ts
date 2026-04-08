import appRecordingHtml from './app-recording.html?raw';
import type { AppRecordingModel } from './app-recording.model';

interface AppRecordingEvents {
	onRecordButtonClick: () => void | Promise<void>;
	onCancelButtonClick: () => void;
}

interface AppRecordingElements {
	recordButton: HTMLButtonElement;
	cancelButton: HTMLButtonElement;
	statusText: HTMLElement;
	recordingActions: HTMLElement;
	transcriptionOutputGroup: HTMLElement;
	translationOutputGroup: HTMLElement;
	transcriptionOutput: HTMLElement;
	translationOutput: HTMLElement;
}

export interface AppRecordingComponent {
	render: (model: AppRecordingModel) => void;
}

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
		render(model: AppRecordingModel): void {
			const isRecording = model.phase === 'recording';
			const isRequestBusy = model.phase === 'transcribing' || model.phase === 'translating';

			view.recordButton.textContent = isRecording ? 'Finish Recording' : 'Start Recording';
			view.recordButton.disabled = isRequestBusy;
			view.cancelButton.classList.toggle('hidden', !isRecording);
			view.cancelButton.disabled = !isRecording;

			view.statusText.textContent = model.statusMessage;
			view.statusText.className = `status-text tone-${model.statusTone}`;
			view.recordingActions.classList.toggle('app-actions-centered', !isRecording);
			view.transcriptionOutput.textContent = model.transcriptionOutput;
			view.translationOutput.textContent = model.translationOutput;

			const shouldShowOutputs =
				isRecording || Boolean(model.transcriptionOutput.trim()) || Boolean(model.translationOutput.trim());

			view.transcriptionOutputGroup.classList.toggle('hidden', !shouldShowOutputs);
			view.translationOutputGroup.classList.toggle('hidden', !shouldShowOutputs);
		},
	};
}

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
