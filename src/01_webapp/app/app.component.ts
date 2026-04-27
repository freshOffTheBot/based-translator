
/**
 * # APP COMPONENT
 * - Owns the main based-translator app shell.
 * - Coordinates tabs, recording, transcription, translation, and config persistence.
 * - Treats transcription + translation as one combined request flow for the UI.
 * - Passes model objects down to stateless child components for rendering.
 */

import { buildAudioFile, buildTranslationInput, createOpenAIClient, getValidatedTranslationTemplate, transcribeAudio, translateText } from '../common/openai/openai.service';
import { cancelMicRecording, startMicRecording, stopMicRecordingAndCreateBlob } from '../common/recording-mic/recording-mic.service';
import { clearOutputs, createAppState, setActiveTab, setErrorStatus, setMouseCursorFollowerHideTimeoutMs, setPhase, setRecordingSession, setStatus, setTranscriptionOutput, setTranslationOutput, type AppState } from './common/app-state.service';
import { saveApiKey, saveMouseCursorFollowerHideTimeoutMs, saveTranscriptionPrompt, saveTranslationTemplate } from '../common/localStorage/localStorage.service';
import { dispatchNativeMouseCursorFollowerClearEvent, dispatchNativeTranslationOutputEvent } from '../common/native-event/native-event.service';
import { initializeAppConfigComponent, type AppConfigComponent } from './component/config/app-config.component';
import { initializeAppRecordingComponent, type AppRecordingComponent } from './component/recording/app-recording.component';
import appHtml from './app.html?raw';


/**
 * ## App Elements
 * - Required DOM nodes for the app shell.
 */
interface AppElements {
	// Tab button that opens the Recording panel.
	recordingTabButton: HTMLButtonElement;

	// Tab button that opens the Configuration panel.
	configurationTabButton: HTMLButtonElement;

	// Recording panel container.
	recordingPanel: HTMLElement;

	// Configuration panel container.
	configurationPanel: HTMLElement;

	// Mount point for the Recording component.
	recordingRoot: HTMLElement;

	// Mount point for the Configuration component.
	configRoot: HTMLElement;
}

/**
 * ## App Component Parts
 * - Child controllers mounted inside the app shell.
 */
interface AppComponentParts {
	// Configuration tab controller.
	config: AppConfigComponent;

	// Recording tab controller.
	recording: AppRecordingComponent;
}

/**
 * Renders the app shell, mounts child components, and wires the main flow together.
 */
export function initializeAppComponent(root: HTMLElement): void {
	const state = createAppState();
	let mouseCursorFollowerHideTimer: number | null = null;

	root.innerHTML = appHtml;

	const view = getAppElements(root);
	const parts = initializeAppComponentParts(view, state);

	bindAppEvents(view, state, render);
	render();

	/**
	 * Validates config, asks for microphone access, and starts a fresh recording session.
	 */
	async function startRecording(): Promise<void> {
		if (state.phase === 'transcribing' || state.phase === 'translating') {
			return;
		}

		try {
			// Validate before asking for microphone access so config errors are shown first.
			getValidatedTranslationTemplate(state.translationTemplate);
		} catch (error) {
			handleError(error, 'Invalid translation template.');
			return;
		}

		try {
			// Ask for microphone access only after config is valid.
			const recordingSession = await startMicRecording();

			setRecordingSession(state, recordingSession);

			// Starting a new recording resets the old output boxes.
			clearOutputs(state);
			setStatus(state, 'recording', 'info');
			setPhase(state, 'recording');
			render();
		} catch (error) {
			handleError(error, 'Microphone permission is required.');
		}
	}

	/**
	 * Cancels the active recording, drops the captured audio, and returns the app to idle.
	 */
	function cancelRecording(): void {
		cancelMicRecording(state.recordingSession);
		setRecordingSession(state, null);
		setStatus(state, 'recording canceled', 'neutral');
		setPhase(state, 'idle');
		render();
	}

	/**
	 * Stops the active recording and starts the OpenAI request flow.
	 * - The UI moves into `transcribing` before the audio Blob is built.
	 */
	async function finishRecording(): Promise<void> {
		if (!state.recordingSession) {
			return;
		}

		try {
			setPhase(state, 'transcribing');
			setStatus(state, 'preparing audio...', 'info');
			render();

			const audioBlob = await stopMicRecordingAndCreateBlob(state.recordingSession);

			// Clear the live session before network requests start.
			setRecordingSession(state, null);

			await transcribeAndTranslate(audioBlob);
		} catch (error) {
			cancelMicRecording(state.recordingSession);
			setRecordingSession(state, null);
			handleError(error, 'Unable to finish recording.');
		}
	}

	/**
	 * Sends recorded audio to OpenAI, then translates the transcription result.
	 * - This is intentionally one chained flow:
	 *   - Speech-to-text first.
	 *   - Translation second.
	 * - Config stays disabled during both request phases.
	 */
	async function transcribeAndTranslate(audioBlob: Blob): Promise<void> {
		if (!state.apiKey) {
			throw new Error('Please set your OpenAI API key.');
		}

		const openai = createOpenAIClient(state.apiKey);
		const audioFile = buildAudioFile(audioBlob);

		try {
			// Treat transcription and translation as one busy process for the UI.
			setPhase(state, 'transcribing');
			setStatus(state, 'transcribing audio...', 'info');
			render();

			const transcriptionText = await transcribeAudio(openai, audioFile, state.transcriptionPrompt);

			setTranscriptionOutput(state, transcriptionText);
			setPhase(state, 'translating');
			setStatus(state, 'translating text...', 'info');
			render();

			// Build the translation input only after transcription output has been saved.
			// This keeps `{{transcription}}` replacement based on the same state the UI shows.
			const translationInput = buildTranslationInput(state.translationTemplate, state.transcriptionOutput);
			const translationOutput = await translateText(openai, translationInput);

			setTranslationOutput(state, translationOutput);

			// Native wrappers can listen for the final translated text without importing app code.
			dispatchNativeTranslationOutputEvent(translationOutput);
			startMouseCursorFollowerHideTimer();
			setPhase(state, 'success');
			setStatus(state, 'done', 'success');
			render();
		} catch (error) {
			handleError(error, 'OpenAI request failed.');
		}
	}

	/**
	 * Applies a friendly error status and refreshes the UI.
	 */
	function handleError(error: unknown, fallbackMessage: string): void {
		setErrorStatus(state, error, fallbackMessage);
		render();
	}

	/**
	 * Renders every child view from the current single app state.
	 */
	function render(): void {
		renderAppTabs(view, state);

		// While either request is running, the whole transcription + translation flow is busy.
		const isRequestBusy = state.phase === 'transcribing' || state.phase === 'translating';

		parts.recording.render({
			phase: state.phase,
			statusMessage: state.statusMessage,
			statusTone: state.statusTone,
			transcriptionOutput: state.transcriptionOutput,
			translationOutput: state.translationOutput,
		});

		parts.config.render({
			apiKey: state.apiKey,
			transcriptionPrompt: state.transcriptionPrompt,
			translationTemplate: state.translationTemplate,
			mouseCursorFollowerHideTimeoutMs: state.mouseCursorFollowerHideTimeoutMs,
			isDisabled: isRequestBusy,
		});
	}

	/**
	 * Connects tab buttons to the app state.
	 */
	function bindAppEvents(viewElements: AppElements, appState: AppState, renderApp: () => void): void {
		viewElements.recordingTabButton.addEventListener('click', () => {
			setActiveTab(appState, 'recording');
			renderApp();
		});

		viewElements.configurationTabButton.addEventListener('click', () => {
			setActiveTab(appState, 'configuration');
			renderApp();
		});
	}

	/**
	 * Creates child component controllers and connects their events to app logic.
	 */
	function initializeAppComponentParts(
		viewElements: AppElements,
		appState: AppState,
	): AppComponentParts {
		return {
			recording: initializeAppRecordingComponent(viewElements.recordingRoot, {
				onRecordButtonClick: async () => {
					// The same button starts recording in idle/success/error and finishes while recording.
					if (appState.phase === 'recording') {
						await finishRecording();
						return;
					}

					await startRecording();
				},
				onCancelButtonClick: () => {
					cancelRecording();
				},
			}),
			config: initializeAppConfigComponent(viewElements.configRoot, {
				onApiKeyInput: (apiKey: string) => {
					// Persist config immediately so refresh keeps the user's browser-only settings.
					appState.apiKey = apiKey;
					saveApiKey(appState.apiKey);
				},
				onTranscriptionPromptInput: (transcriptionPrompt: string) => {
					appState.transcriptionPrompt = transcriptionPrompt;
					saveTranscriptionPrompt(appState.transcriptionPrompt);
				},
				onTranslationTemplateInput: (translationTemplate: string) => {
					appState.translationTemplate = translationTemplate;
					saveTranslationTemplate(appState.translationTemplate);
				},
				onMouseCursorFollowerHideTimeoutInput: (timeoutMs) => {
					setMouseCursorFollowerHideTimeoutMs(appState, timeoutMs);
					saveMouseCursorFollowerHideTimeoutMs(appState.mouseCursorFollowerHideTimeoutMs);
				},
			}),
		};
	}

	/**
	 * Starts a fresh native-label hide timer after each completed translation.
	 */
	function startMouseCursorFollowerHideTimer(): void {
		clearMouseCursorFollowerHideTimer();

		if (state.mouseCursorFollowerHideTimeoutMs === null) {
			return;
		}

		mouseCursorFollowerHideTimer = window.setTimeout(() => {
			dispatchNativeMouseCursorFollowerClearEvent();
			mouseCursorFollowerHideTimer = null;
		}, state.mouseCursorFollowerHideTimeoutMs);
	}

	/**
	 * Clears the previous native-label hide timer before the next translation schedules one.
	 */
	function clearMouseCursorFollowerHideTimer(): void {
		if (mouseCursorFollowerHideTimer === null) {
			return;
		}

		window.clearTimeout(mouseCursorFollowerHideTimer);
		mouseCursorFollowerHideTimer = null;
	}
}

/**
 * Updates tab button state and switches the visible panel.
 */
function renderAppTabs(view: AppElements, state: AppState): void {
	const isRecordingTabActive = state.activeTab === 'recording';

	// Button state and panel visibility stay in sync from the same `activeTab` value.
	view.recordingTabButton.classList.toggle('c-tab-button-active', isRecordingTabActive);
	view.recordingTabButton.setAttribute('aria-selected', String(isRecordingTabActive));
	view.configurationTabButton.classList.toggle('c-tab-button-active', !isRecordingTabActive);
	view.configurationTabButton.setAttribute('aria-selected', String(!isRecordingTabActive));
	view.recordingPanel.classList.toggle('hidden', !isRecordingTabActive);
	view.configurationPanel.classList.toggle('hidden', isRecordingTabActive);
	view.recordingPanel.setAttribute('aria-hidden', String(!isRecordingTabActive));
	view.configurationPanel.setAttribute('aria-hidden', String(isRecordingTabActive));
}

/**
 * Finds required app shell elements and fails early if the HTML changed.
 */
function getAppElements(root: HTMLElement): AppElements {
	const recordingTabButton = root.querySelector<HTMLButtonElement>('#recording-tab');
	const configurationTabButton = root.querySelector<HTMLButtonElement>('#configuration-tab');
	const recordingPanel = root.querySelector<HTMLElement>('#recording-panel');
	const configurationPanel = root.querySelector<HTMLElement>('#configuration-panel');
	const recordingRoot = root.querySelector<HTMLElement>('#app-recording-root');
	const configRoot = root.querySelector<HTMLElement>('#app-config-root');

	if (
		!recordingTabButton ||
		!configurationTabButton ||
		!recordingPanel ||
		!configurationPanel ||
		!recordingRoot ||
		!configRoot
	) {
		throw new Error('Required app DOM element is missing.');
	}

	return {
		recordingTabButton,
		configurationTabButton,
		recordingPanel,
		configurationPanel,
		recordingRoot,
		configRoot,
	};
}
