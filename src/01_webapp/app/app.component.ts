
import { buildAudioFile, buildTranslationInput, createOpenAIClient, getValidatedTranslationTemplate, transcribeAudio, translateText } from '../common/openai/openai.service';
import { cancelMicRecording, startMicRecording, stopMicRecordingAndCreateBlob } from '../common/recording-mic/recording-mic.service';
import { clearOutputs, createAppState, setActiveTab, setErrorStatus, setPhase, setRecordingSession, setStatus, setTranscriptionOutput, setTranslationOutput, type AppState } from './common/app-state.service';
import { saveApiKey, saveTranscriptionPrompt, saveTranslationTemplate } from '../common/localStorage/localStorage.service';
import { initializeAppConfigComponent, type AppConfigComponent } from './component/config/app-config.component';
import { initializeAppRecordingComponent, type AppRecordingComponent } from './component/recording/app-recording.component';
import appHtml from './app.html?raw';


/**
 * # APP COMPONENT
 * - Owns the main based-translator app shell.
 * - Coordinates tabs, recording, transcription, translation, and config persistence.
 * - Passes model objects down to child components for rendering.
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

interface AppComponentParts {
	// Configuration tab controller.
	config: AppConfigComponent;
	// Recording tab controller.
	recording: AppRecordingComponent;
}

/**
 * Initializes the main app controller and renders the first view.
 */
export function initializeAppComponent(root: HTMLElement): void {
	const state = createAppState();

	root.innerHTML = appHtml;

	const view = getAppElements(root);
	const parts = initializeAppComponentParts(view, state);

	bindAppEvents(view, state, render);
	render();

	/**
	 * Validates config, asks for microphone access, and starts the recording session.
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
			const recordingSession = await startMicRecording();

			setRecordingSession(state, recordingSession);
			clearOutputs(state);
			setStatus(state, 'recording', 'info');
			setPhase(state, 'recording');
			render();
		} catch (error) {
			handleError(error, 'Microphone permission is required.');
		}
	}

	/**
	 * Cancels the active recording and returns the app to idle.
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
			const translationInput = buildTranslationInput(state.translationTemplate, state.transcriptionOutput);
			const translationOutput = await translateText(openai, translationInput);

			setTranslationOutput(state, translationOutput);
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
			isDisabled: isRequestBusy,
		});
	}

	/**
	 * Connects app-level tab buttons to state changes.
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
			}),
		};
	}
}

/**
 * Updates tab button state and switches the visible panel.
 */
function renderAppTabs(view: AppElements, state: AppState): void {
	const isRecordingTabActive = state.activeTab === 'recording';

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
