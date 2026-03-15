
import OpenAI from 'openai';
import './main.scss';

const STORAGE_KEY_API = 'based-translator.api-key';
const STORAGE_KEY_TRANSCRIPTION_PROMPT = 'based-translator.transcription-prompt';
const STORAGE_KEY_TRANSLATION_TEMPLATE = 'based-translator.translation-template';
const TRANSCRIPTION_MODEL = 'gpt-4o-transcribe';
const TRANSLATION_MODEL = 'gpt-5.2';
const TRANSLATION_PLACEHOLDER = '{{transcription}}';
const DEFAULT_TRANSCRIPTION_PROMPT = 'Transcribe clearly and keep punctuation natural.';
const DEFAULT_TRANSLATION_TEMPLATE = `Translate ${TRANSLATION_PLACEHOLDER} into English.`;

type AppPhase = 'idle' | 'recording' | 'transcribing' | 'translating' | 'success' | 'error';
type AppTab = 'recording' | 'configuration';
type StatusTone = 'neutral' | 'success' | 'danger' | 'info';

interface AppState {
	apiKey: string;
	transcriptionPrompt: string;
	translationTemplate: string;
	activeTab: AppTab;
	phase: AppPhase;
	statusMessage: string;
	statusTone: StatusTone;
	transcriptionOutput: string;
	translationOutput: string;
	mediaRecorder: MediaRecorder | null;
	mediaStream: MediaStream | null;
	audioChunks: Blob[];
}

interface ViewElements {
	recordingTabButton: HTMLButtonElement;
	configurationTabButton: HTMLButtonElement;
	recordingPanel: HTMLElement;
	configurationPanel: HTMLElement;
	apiKeyInput: HTMLInputElement;
	transcriptionPromptInput: HTMLTextAreaElement;
	translationTemplateInput: HTMLTextAreaElement;
	recordButton: HTMLButtonElement;
	cancelButton: HTMLButtonElement;
	statusText: HTMLElement;
	recordingActions: HTMLElement;
	transcriptionOutputGroup: HTMLElement;
	translationOutputGroup: HTMLElement;
	transcriptionOutput: HTMLElement;
	translationOutput: HTMLElement;
}

// Single source of truth for UI + recording + request lifecycle.
const state: AppState = {
	apiKey: loadApiKey(),
	transcriptionPrompt: loadTranscriptionPrompt(),
	translationTemplate: loadTranslationTemplate(),
	activeTab: 'recording',
	phase: 'idle',
	statusMessage: 'idle',
	statusTone: 'neutral',
	transcriptionOutput: '',
	translationOutput: '',
	mediaRecorder: null,
	mediaStream: null,
	audioChunks: [],
};

const appRoot = document.querySelector<HTMLDivElement>('#app');

if (!appRoot) {
	throw new Error('App container not found.');
}

appRoot.innerHTML = `
	<main class="app-shell">
		<section class="c-card app-card">
			<header class="app-card-header">
				<h1 class="c-card-title app-hero-title">BASED TRANSLATOR</h1>
				<p class="c-card-text app-hero-text">
					Speech-to-text + translation app using the OpenAI API. No server-side storage - everything stays in your browser.
				</p>
			</header>

			<section class="c-tab app-tab-shell" aria-label="Translator views">
				<div class="c-tab-list app-tab-list" role="tablist" aria-label="Translator views">
					<button
						id="recording-tab"
						class="c-tab-button"
						type="button"
						role="tab"
						aria-selected="true"
						aria-controls="recording-panel"
					>
						Recording
					</button>
					<button
						id="configuration-tab"
						class="c-tab-button"
						type="button"
						role="tab"
						aria-selected="false"
						aria-controls="configuration-panel"
					>
						Configuration
					</button>
				</div>

				<section
					id="recording-panel"
					class="c-tab-panel app-panel"
					role="tabpanel"
					aria-labelledby="recording-tab"
				>
					<div class="app-tab-panel-stack">
						<header class="app-panel-header">
							<h2 class="c-card-title app-section-title">Recording</h2>
						</header>

						<div id="recording-actions" class="app-actions app-actions-centered">
							<button id="record-button" type="button" class="c-button app-record-button">Start Recording</button>
							<button id="cancel-button" type="button" class="c-button c-button-danger hidden">Cancel</button>
						</div>

						<p class="c-form-status app-status-line">
							<span class="c-text-muted">Status:</span>
							<span id="status-text" class="status-text tone-neutral">idle</span>
						</p>

						<div id="transcription-output-group" class="app-output-group hidden">
							<p class="c-form-label app-output-title">Transcription Output:</p>
							<pre id="transcription-output" class="app-output-box" aria-live="polite"></pre>
						</div>

						<div id="translation-output-group" class="app-output-group hidden">
							<p class="c-form-label app-output-title">Translation Output:</p>
							<pre id="translation-output" class="app-output-box" aria-live="polite"></pre>
						</div>
					</div>
				</section>

				<section
					id="configuration-panel"
					class="c-tab-panel app-panel hidden"
					role="tabpanel"
					aria-labelledby="configuration-tab"
				>
					<div class="app-tab-panel-stack">
						<header class="app-panel-header">
							<h2 class="c-card-title app-section-title">Configuration</h2>
						</header>

						<form class="c-form">
							<div class="c-form-field">
								<label class="c-form-label" for="api-key-input">OpenAI API key:</label>
								<input
									id="api-key-input"
									class="c-form-control"
									type="password"
									placeholder="sk-..."
									autocomplete="off"
									spellcheck="false"
								/>
								<p class="c-form-help app-help-text">Stored only in your browser. Never sent to any server. You’re SAFU!</p>
							</div>

							<div class="c-form-field">
								<label class="c-form-label" for="transcription-prompt-input">Transcription Prompt:</label>
								<textarea
									id="transcription-prompt-input"
									class="c-form-control app-form-control-compact"
									rows="3"
									placeholder="Use this to help catch tricky words like names, acronyms, brands, or niche terms."
								></textarea>
								<p class="c-form-help app-help-text">Fren, NEET, Based, Cringe, NPC, ...</p>
							</div>

							<div class="c-form-field">
								<label class="c-form-label" for="translation-template-input">Translation Template:</label>
								<textarea
									id="translation-template-input"
									class="c-form-control app-form-control-compact"
									rows="3"
									placeholder="Translate {{transcription}} into English."
								></textarea>
								<p class="c-form-help app-help-text">
									Must include <code class="c-text-inline-code">${TRANSLATION_PLACEHOLDER}</code>.
								</p>
							</div>
						</form>
					</div>
				</section>
			</section>
		</section>
	</main>
`;

const view = getViewElements();
initializeView();
bindEvents();
render();

function bindEvents(): void {
	view.recordingTabButton.addEventListener('click', () => {
		setActiveTab('recording');
		render();
	});

	view.configurationTabButton.addEventListener('click', () => {
		setActiveTab('configuration');
		render();
	});

	view.apiKeyInput.addEventListener('input', () => {
		state.apiKey = view.apiKeyInput.value.trim();
		saveApiKey(state.apiKey);
	});

	view.transcriptionPromptInput.addEventListener('input', () => {
		state.transcriptionPrompt = view.transcriptionPromptInput.value;
		saveTranscriptionPrompt(state.transcriptionPrompt);
	});

	view.translationTemplateInput.addEventListener('input', () => {
		state.translationTemplate = view.translationTemplateInput.value;
		saveTranslationTemplate(state.translationTemplate);
	});

	view.recordButton.addEventListener('click', async () => {
		if (state.phase === 'recording') {
			await finishRecording();
			return;
		}

		await startRecording();
	});

	view.cancelButton.addEventListener('click', () => {
		cancelRecording();
	});
}

function initializeView(): void {
	view.apiKeyInput.value = state.apiKey;
	view.transcriptionPromptInput.value = state.transcriptionPrompt;
	view.translationTemplateInput.value = state.translationTemplate;
}

async function startRecording(): Promise<void> {
	if (state.phase === 'transcribing' || state.phase === 'translating') {
		return;
	}

	try {
		getValidatedTranslationTemplate(state.translationTemplate);
	} catch (error) {
		handleError(error, 'Invalid translation template.');
		return;
	}
	
	try {
		const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
		const mediaRecorder = new MediaRecorder(mediaStream);

		state.mediaStream = mediaStream;
		state.mediaRecorder = mediaRecorder;
		state.audioChunks = [];
		state.transcriptionOutput = '';
		state.translationOutput = '';

		mediaRecorder.addEventListener('dataavailable', (event: BlobEvent) => {
			if (event.data.size > 0) {
				state.audioChunks.push(event.data);
			}
		});

		setStatus('recording', 'info');
		setPhase('recording');
		mediaRecorder.start();
		render();
	} catch (error) {
		handleError(error, 'Microphone permission is required.');
	}
}

function cancelRecording(): void {
	stopMediaTracks();
	state.audioChunks = [];
	state.mediaRecorder = null;
	state.mediaStream = null;
	setStatus('recording canceled', 'neutral');
	setPhase('idle');
	render();
}

async function finishRecording(): Promise<void> {
	if (!state.mediaRecorder) {
		return;
	}

	try {
		setPhase('transcribing');
		setStatus('preparing audio...', 'info');
		render();

		const audioBlob = await stopRecorderAndCreateBlob(state.mediaRecorder, state.audioChunks);

		stopMediaTracks();
		state.mediaRecorder = null;
		state.mediaStream = null;
		state.audioChunks = [];

		await transcribeAndTranslate(audioBlob);
	} catch (error) {
		stopMediaTracks();
		state.mediaRecorder = null;
		state.mediaStream = null;
		state.audioChunks = [];
		handleError(error, 'Unable to finish recording.');
	}
}

async function transcribeAndTranslate(audioBlob: Blob): Promise<void> {
	if (!state.apiKey) {
		throw new Error('Please set your OpenAI API key.');
	}

	const openai = createOpenAIClient(state.apiKey);
	const audioType = normalizeAudioMimeType(audioBlob.type || 'audio/webm');
	const audioFile = new File([audioBlob], buildAudioFileName(audioType), { type: audioType });

	try {
		setPhase('transcribing');
		setStatus('transcribing audio...', 'info');
		render();

		const transcriptionText = await openai.audio.transcriptions.create({
			file: audioFile,
			model: TRANSCRIPTION_MODEL,
			response_format: 'text',
			prompt: state.transcriptionPrompt,
		});

		state.transcriptionOutput = transcriptionText.trim();
		setPhase('translating');
		setStatus('translating text...', 'info');
		render();

		const translationInput = buildTranslationInput(state.translationTemplate, state.transcriptionOutput);
		const response = await openai.responses.create({
			model: TRANSLATION_MODEL,
			input: translationInput,
		});

		state.translationOutput = (response.output_text ?? '').trim() || '[No translation returned.]';
		setPhase('success');
		setStatus('done', 'success');
		render();
	} catch (error) {
		handleError(error, 'OpenAI request failed.');
	}
}

function buildTranslationInput(template: string, transcript: string): string {
	// Keep translation request format in one place.
	const safeTemplate = getValidatedTranslationTemplate(template);
	const normalizedTranscript = transcript.trim();
	return safeTemplate.replaceAll(TRANSLATION_PLACEHOLDER, normalizedTranscript);
}

function getValidatedTranslationTemplate(template: string): string {
	const safeTemplate = template.trim() || DEFAULT_TRANSLATION_TEMPLATE;
	if (!safeTemplate.includes(TRANSLATION_PLACEHOLDER)) {
		throw new Error(`Translation template must include ${TRANSLATION_PLACEHOLDER}.`);
	}

	return safeTemplate;
}

function createOpenAIClient(apiKey: string): OpenAI {
	return new OpenAI({
		apiKey,
		dangerouslyAllowBrowser: true,
	});
}

function setPhase(phase: AppPhase): void {
	state.phase = phase;
}

function setActiveTab(tab: AppTab): void {
	state.activeTab = tab;
}

function setStatus(message: string, tone: StatusTone): void {
	state.statusMessage = message;
	state.statusTone = tone;
}

function handleError(error: unknown, fallbackMessage: string): void {
	const message = error instanceof Error ? error.message : fallbackMessage;
	setPhase('error');
	setStatus(message || fallbackMessage, 'danger');
	render();
}

function stopMediaTracks(): void {
	if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
		state.mediaRecorder.stop();
	}

	if (state.mediaStream) {
		for (const track of state.mediaStream.getTracks()) {
			track.stop();
		}
	}
}

function stopRecorderAndCreateBlob(mediaRecorder: MediaRecorder, audioChunks: Blob[]): Promise<Blob> {
	if (mediaRecorder.state === 'inactive') {
		return Promise.resolve(new Blob(audioChunks, { type: 'audio/webm' }));
	}

	return new Promise<Blob>((resolve, reject) => {
		mediaRecorder.addEventListener(
			'stop',
			() => {
				const cleanMimeType = normalizeAudioMimeType(mediaRecorder.mimeType || 'audio/webm');
				resolve(new Blob(audioChunks, { type: cleanMimeType }));
			},
			{ once: true },
		);

		mediaRecorder.addEventListener(
			'error',
			() => {
				reject(new Error('Recording failed.'));
			},
			{ once: true },
		);

		mediaRecorder.stop();
	});
}

function buildAudioFileName(mimeType: string): string {
	const extension = mimeType.split('/')[1] || 'webm';
	return `recording.${extension}`;
}

function normalizeAudioMimeType(mimeType: string): string {
	const cleanMimeType = mimeType.split(';')[0].trim().toLowerCase();
	return cleanMimeType || 'audio/webm';
}

function render(): void {
	// Prompts are disabled only during API work.
	const isRecordingTabActive = state.activeTab === 'recording';
	const isRecording = state.phase === 'recording';
	const isRequestBusy = state.phase === 'transcribing' || state.phase === 'translating';
	const isButtonDisabled = isRequestBusy;

	view.recordingTabButton.classList.toggle('c-tab-button-active', isRecordingTabActive);
	view.recordingTabButton.setAttribute('aria-selected', String(isRecordingTabActive));
	view.configurationTabButton.classList.toggle('c-tab-button-active', !isRecordingTabActive);
	view.configurationTabButton.setAttribute('aria-selected', String(!isRecordingTabActive));
	view.recordingPanel.classList.toggle('hidden', !isRecordingTabActive);
	view.configurationPanel.classList.toggle('hidden', isRecordingTabActive);
	view.recordingPanel.setAttribute('aria-hidden', String(!isRecordingTabActive));
	view.configurationPanel.setAttribute('aria-hidden', String(isRecordingTabActive));

	view.recordButton.textContent = isRecording ? 'Finish Recording' : 'Start Recording';
	view.recordButton.disabled = isButtonDisabled;
	view.cancelButton.classList.toggle('hidden', !isRecording);
	view.cancelButton.disabled = !isRecording;

	// Lock all configuration inputs during API request; unlock after request completes.
	view.apiKeyInput.disabled = isRequestBusy;
	view.transcriptionPromptInput.disabled = isRequestBusy;
	view.translationTemplateInput.disabled = isRequestBusy;

	view.statusText.textContent = state.statusMessage;
	view.statusText.className = `status-text tone-${state.statusTone}`;
	view.recordingActions.classList.toggle('app-actions-centered', !isRecording);
	view.transcriptionOutput.textContent = state.transcriptionOutput;
	view.translationOutput.textContent = state.translationOutput;

	const shouldShowOutputs =
		isRecording || Boolean(state.transcriptionOutput.trim()) || Boolean(state.translationOutput.trim());

	view.transcriptionOutputGroup.classList.toggle('hidden', !shouldShowOutputs);
	view.translationOutputGroup.classList.toggle('hidden', !shouldShowOutputs);
}

function getViewElements(): ViewElements {
	const recordingTabButton = document.querySelector<HTMLButtonElement>('#recording-tab');
	const configurationTabButton = document.querySelector<HTMLButtonElement>('#configuration-tab');
	const recordingPanel = document.querySelector<HTMLElement>('#recording-panel');
	const configurationPanel = document.querySelector<HTMLElement>('#configuration-panel');
	const apiKeyInput = document.querySelector<HTMLInputElement>('#api-key-input');
	const transcriptionPromptInput = document.querySelector<HTMLTextAreaElement>('#transcription-prompt-input');
	const translationTemplateInput = document.querySelector<HTMLTextAreaElement>('#translation-template-input');
	const recordButton = document.querySelector<HTMLButtonElement>('#record-button');
	const cancelButton = document.querySelector<HTMLButtonElement>('#cancel-button');
	const statusText = document.querySelector<HTMLElement>('#status-text');
	const recordingActions = document.querySelector<HTMLElement>('#recording-actions');
	const transcriptionOutputGroup = document.querySelector<HTMLElement>('#transcription-output-group');
	const translationOutputGroup = document.querySelector<HTMLElement>('#translation-output-group');
	const transcriptionOutput = document.querySelector<HTMLElement>('#transcription-output');
	const translationOutput = document.querySelector<HTMLElement>('#translation-output');

	if (
		!recordingTabButton ||
		!configurationTabButton ||
		!recordingPanel ||
		!configurationPanel ||
		!apiKeyInput ||
		!transcriptionPromptInput ||
		!translationTemplateInput ||
		!recordButton ||
		!cancelButton ||
		!statusText ||
		!recordingActions ||
		!transcriptionOutputGroup ||
		!translationOutputGroup ||
		!transcriptionOutput ||
		!translationOutput
	) {
		throw new Error('Required DOM element is missing.');
	}

	return {
		recordingTabButton,
		configurationTabButton,
		recordingPanel,
		configurationPanel,
		apiKeyInput,
		transcriptionPromptInput,
		translationTemplateInput,
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

function loadApiKey(): string {
	return localStorage.getItem(STORAGE_KEY_API) ?? '';
}

function saveApiKey(apiKey: string): void {
	localStorage.setItem(STORAGE_KEY_API, apiKey);
}

function loadTranscriptionPrompt(): string {
	return localStorage.getItem(STORAGE_KEY_TRANSCRIPTION_PROMPT) ?? DEFAULT_TRANSCRIPTION_PROMPT;
}

function saveTranscriptionPrompt(prompt: string): void {
	localStorage.setItem(STORAGE_KEY_TRANSCRIPTION_PROMPT, prompt);
}

function loadTranslationTemplate(): string {
	return localStorage.getItem(STORAGE_KEY_TRANSLATION_TEMPLATE) ?? DEFAULT_TRANSLATION_TEMPLATE;
}

function saveTranslationTemplate(template: string): void {
	localStorage.setItem(STORAGE_KEY_TRANSLATION_TEMPLATE, template);
}
