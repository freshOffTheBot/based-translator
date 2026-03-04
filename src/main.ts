import './main.css';

type AppState = 'idle' | 'recording' | 'transcribing' | 'translating';

const TRANSCRIBE_URL = 'https://api.openai.com/v1/audio/transcriptions';
const RESPONSES_URL = 'https://api.openai.com/v1/responses';
const TRANSCRIBE_MODEL = 'gpt-4o-transcribe';
const TRANSLATE_MODEL = 'gpt-5.2';
const REQUEST_TIMEOUT_MS = 60_000;
const API_KEY_STORAGE_KEY = 'based_translator_openai_api_key';
const PROMPT_STORAGE_KEY = 'based_translator_prompt';
const TRANSLATION_INPUT_STORAGE_KEY = 'based_translator_translation_input';
const ADVANCED_OPEN_STORAGE_KEY = 'based_translator_advanced_open';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
	throw new Error('Cannot find app root element.');
}

app.innerHTML = `
	<main class="panel">
		<h1>BASED TRANSLATOR</h1>
		<p class="subtitle">Speech-to-text translator using the OpenAI API. Everything stays in your browser.</p>

		<label class="field" for="api-key">OpenAI API Key</label>
		<div class="key-row">
			<input id="api-key" type="password" autocomplete="off" placeholder="sk-..." />
			<button id="save-key-btn" type="button">[ Save API Key ]</button>
		</div>
		<p id="status" class="status" role="status" aria-live="polite">Status: idle</p>

		<section class="actions" aria-label="Controls">
			<button id="record-btn" type="button">[ Start Recording ]</button>
			<button id="cancel-btn" type="button" class="text-btn" hidden>[ Cancel ]</button>
		</section>

		<details id="advanced-panel" class="advanced">
			<summary>[ Advanced ]</summary>
			<label class="field" for="prompt-text">Prompt (optional)</label>
			<textarea id="prompt-text" rows="3" placeholder="Give optional transcription hints (language, terms, style)."></textarea>
			<label class="field" for="translation-input-text">Translation instructions</label>
			<textarea id="translation-input-text" rows="3" placeholder="Example: Translate to Korean. Keep it natural and concise."></textarea>
		</details>

		<section class="results">
			<section class="result" aria-live="polite">
				<p class="result-label">Transcription text:</p>
				<pre id="transcription-text">(empty)</pre>
			</section>
			<section class="result" aria-live="polite">
				<p class="result-label">Translation text:</p>
				<pre id="translation-text">(empty)</pre>
			</section>
		</section>
	</main>
`;

const apiKeyInput = document.querySelector<HTMLInputElement>('#api-key');
const saveKeyButton = document.querySelector<HTMLButtonElement>('#save-key-btn');
const recordButton = document.querySelector<HTMLButtonElement>('#record-btn');
const cancelButton = document.querySelector<HTMLButtonElement>('#cancel-btn');
const promptTextInput = document.querySelector<HTMLTextAreaElement>('#prompt-text');
const translationInputText = document.querySelector<HTMLTextAreaElement>('#translation-input-text');
const advancedPanel = document.querySelector<HTMLDetailsElement>('#advanced-panel');
const statusText = document.querySelector<HTMLParagraphElement>('#status');
const transcriptionText = document.querySelector<HTMLPreElement>('#transcription-text');
const translationText = document.querySelector<HTMLPreElement>('#translation-text');

if (
	!apiKeyInput ||
	!saveKeyButton ||
	!recordButton ||
	!cancelButton ||
	!promptTextInput ||
	!translationInputText ||
	!advancedPanel ||
	!statusText ||
	!transcriptionText ||
	!translationText
) {
	throw new Error('Cannot find required UI elements.');
}

let currentState: AppState = 'idle';
let mediaRecorder: MediaRecorder | null = null;
let recordedChunks: Blob[] = [];
let advancedPanelLocked = false;
let lastAdvancedOpen = false;

const setState = (next: AppState): void => {
	currentState = next;
	const isIdle = next === 'idle';
	const isRecording = next === 'recording';
	const isTranscribing = next === 'transcribing';
	const isTranslating = next === 'translating';
	const isBusy = isRecording || isTranscribing || isTranslating;

	saveKeyButton.disabled = isBusy;
	apiKeyInput.disabled = isBusy;
	promptTextInput.disabled = isBusy;
	translationInputText.disabled = isBusy;

	cancelButton.hidden = !isRecording;
	cancelButton.disabled = !isRecording;

	recordButton.disabled = isTranscribing || isTranslating;
	if (isIdle) {
		recordButton.textContent = '[ Start Recording ]';
	} else if (isRecording) {
		recordButton.textContent = '[ Finish Recording ]';
	} else if (isTranscribing) {
		recordButton.textContent = '[ Transcribing... ]';
	} else {
		recordButton.textContent = '[ Translating... ]';
	}

	if (isBusy && !advancedPanelLocked) {
		lastAdvancedOpen = advancedPanel.open;
		advancedPanelLocked = true;
		advancedPanel.classList.add('locked');
	} else if (!isBusy && advancedPanelLocked) {
		advancedPanelLocked = false;
		advancedPanel.classList.remove('locked');
	}
};

const setStatus = (message: string): void => {
	statusText.textContent = `Status: ${message}`;
};

const setTranscription = (message: string): void => {
	transcriptionText.textContent = message;
};

const setTranslation = (message: string): void => {
	translationText.textContent = message;
};

const loadSavedApiKey = (): void => {
	// Load key from browser storage to keep it after refresh.
	const savedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
	if (savedApiKey) {
		apiKeyInput.value = savedApiKey;
	}
};

const saveApiKey = (): void => {
	// Save key only when user clicks Save button.
	const apiKey = apiKeyInput.value.trim();
	if (!apiKey) {
		localStorage.removeItem(API_KEY_STORAGE_KEY);
		setStatus('Saved empty API key (removed from browser storage).');
		return;
	}
	localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
	setStatus('API key saved in this browser.');
};

const loadSavedPrompt = (): void => {
	// Load prompt from browser storage so users can keep reusable hints.
	const savedPrompt = localStorage.getItem(PROMPT_STORAGE_KEY);
	if (savedPrompt) {
		promptTextInput.value = savedPrompt;
	}
};

const savePrompt = (): void => {
	// Save prompt as user types. Remove key when prompt is empty.
	const prompt = promptTextInput.value.trim();
	if (!prompt) {
		localStorage.removeItem(PROMPT_STORAGE_KEY);
		return;
	}
	localStorage.setItem(PROMPT_STORAGE_KEY, prompt);
};

const loadSavedTranslationInput = (): void => {
	// Load translation instructions from browser storage.
	const savedTranslationInput = localStorage.getItem(TRANSLATION_INPUT_STORAGE_KEY);
	if (savedTranslationInput) {
		translationInputText.value = savedTranslationInput;
	}
};

const saveTranslationInput = (): void => {
	// Save translation instructions as user types. Remove key when empty.
	const translationInput = translationInputText.value.trim();
	if (!translationInput) {
		localStorage.removeItem(TRANSLATION_INPUT_STORAGE_KEY);
		return;
	}
	localStorage.setItem(TRANSLATION_INPUT_STORAGE_KEY, translationInput);
};

const loadSavedAdvancedPanelState = (): void => {
	const savedState = localStorage.getItem(ADVANCED_OPEN_STORAGE_KEY);
	advancedPanel.open = savedState === '1';
	lastAdvancedOpen = advancedPanel.open;
};

const saveAdvancedPanelState = (): void => {
	localStorage.setItem(ADVANCED_OPEN_STORAGE_KEY, advancedPanel.open ? '1' : '0');
};

const stopTracks = (recorder: MediaRecorder): void => {
	for (const track of recorder.stream.getTracks()) {
		track.stop();
	}
};

const createAudioFile = (chunks: Blob[], mimeTypeHint: string): File => {
	const mimeType = mimeTypeHint || 'audio/webm';
	const ext = mimeType.includes('ogg') ? 'ogg' : 'webm';
	return new File(chunks, `recording.${ext}`, { type: mimeType });
};

const transcribeAudio = async (audioFile: File, apiKey: string, prompt: string): Promise<string> => {
	const controller = new AbortController();
	const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

	try {
		const formData = new FormData();
		formData.append('file', audioFile);
		formData.append('model', TRANSCRIBE_MODEL);
		if (prompt) {
			formData.append('prompt', prompt);
		}

		const response = await fetch(TRANSCRIBE_URL, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${apiKey}`,
			},
			body: formData,
			signal: controller.signal,
		});

		if (!response.ok) {
			let errorMessage = `API error (${response.status})`;
			try {
				const data = (await response.json()) as { error?: { message?: string } };
				if (data.error?.message) {
					errorMessage = `API error: ${data.error.message}`;
				}
			} catch {
				// Keep fallback status code error.
			}
			throw new Error(errorMessage);
		}

		const contentType = response.headers.get('content-type') || '';
		if (contentType.includes('application/json')) {
			const data = (await response.json()) as { text?: string };
			if (!data.text) {
				throw new Error('API error: response has no text.');
			}
			return data.text;
		}

		const text = await response.text();
		if (!text) {
			throw new Error('API error: empty text response.');
		}
		return text;
	} catch (error) {
		if (error instanceof DOMException && error.name === 'AbortError') {
			throw new Error('Timeout error: request took too long.');
		}
		if (error instanceof TypeError) {
			throw new Error('Network error: check internet connection.');
		}
		throw error;
	} finally {
		window.clearTimeout(timeoutId);
	}
};

const buildTranslationInput = (transcription: string, translationInstruction: string): string => {
	// Keep this in one place so prompt format stays consistent.
	return [
		'Translate the following transcription.',
		`Instructions: ${translationInstruction}`,
		'Return only the translated text.',
		'',
		'Transcription:',
		transcription,
	].join('\n');
};

const extractResponseText = (data: unknown): string | null => {
	// Responses API may return convenience `output_text` or nested `output[].content[].text`.
	if (typeof data !== 'object' || data === null) {
		return null;
	}

	const directText = (data as { output_text?: unknown }).output_text;
	if (typeof directText === 'string' && directText.trim()) {
		return directText;
	}

	const outputs = (data as { output?: unknown }).output;
	if (!Array.isArray(outputs)) {
		return null;
	}

	const textParts: string[] = [];
	for (const output of outputs) {
		if (typeof output !== 'object' || output === null) {
			continue;
		}
		const content = (output as { content?: unknown }).content;
		if (!Array.isArray(content)) {
			continue;
		}

		for (const item of content) {
			if (typeof item !== 'object' || item === null) {
				continue;
			}
			const text = (item as { text?: unknown }).text;
			if (typeof text === 'string' && text.trim()) {
				textParts.push(text);
			}
		}
	}

	if (textParts.length === 0) {
		return null;
	}

	return textParts.join('\n');
};

const translateText = async (transcription: string, apiKey: string, translationInstruction: string): Promise<string> => {
	const controller = new AbortController();
	const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

	try {
		const input = buildTranslationInput(transcription, translationInstruction);
		const response = await fetch(RESPONSES_URL, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				model: TRANSLATE_MODEL,
				input,
			}),
			signal: controller.signal,
		});

		if (!response.ok) {
			let errorMessage = `API error (${response.status})`;
			try {
				const data = (await response.json()) as { error?: { message?: string } };
				if (data.error?.message) {
					errorMessage = `API error: ${data.error.message}`;
				}
			} catch {
				// Keep fallback status code error.
			}
			throw new Error(errorMessage);
		}

		const data = (await response.json()) as unknown;
		const outputText = extractResponseText(data);
		if (!outputText) {
			throw new Error('API error: response has no translatable text.');
		}
		return outputText;
	} catch (error) {
		if (error instanceof DOMException && error.name === 'AbortError') {
			throw new Error('Timeout error: request took too long.');
		}
		if (error instanceof TypeError) {
			throw new Error('Network error: check internet connection.');
		}
		throw error;
	} finally {
		window.clearTimeout(timeoutId);
	}
};

const startRecording = async (): Promise<void> => {
	if (currentState !== 'idle') {
		return;
	}

	const apiKey = apiKeyInput.value.trim();
	if (!apiKey) {
		setStatus('Enter your OpenAI API key first.');
		return;
	}

	setTranscription('(empty)');
	setTranslation('(empty)');
	setStatus('requesting microphone permission...');

	try {
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		recordedChunks = [];
		mediaRecorder = new MediaRecorder(stream);

		mediaRecorder.ondataavailable = (event: BlobEvent) => {
			if (event.data.size > 0) {
				recordedChunks.push(event.data);
			}
		};

		mediaRecorder.start();
		setState('recording');
		setStatus('recording... click finish or cancel');
	} catch (error) {
		if (error instanceof DOMException && error.name === 'NotAllowedError') {
			setStatus('Permission error: microphone access denied.');
			return;
		}
		setStatus('Permission error: cannot start microphone.');
	}
};

const cancelRecording = (): void => {
	if (currentState !== 'recording' || !mediaRecorder) {
		return;
	}

	mediaRecorder.stop();
	stopTracks(mediaRecorder);
	mediaRecorder = null;
	recordedChunks = [];

	setState('idle');
	setStatus('recording canceled. audio deleted.');
	setTranscription('(empty)');
	setTranslation('(empty)');
};

const finishRecording = async (): Promise<void> => {
	if (currentState !== 'recording' || !mediaRecorder) {
		return;
	}

	const recorder = mediaRecorder;
	mediaRecorder = null;

	setState('transcribing');
	setStatus('stopping recording...');

	const stopped = new Promise<void>((resolve) => {
		recorder.onstop = () => resolve();
	});

	recorder.stop();
	stopTracks(recorder);
	await stopped;

	if (recordedChunks.length === 0) {
		setState('idle');
		setStatus('No audio data recorded.');
		return;
	}

	const apiKey = apiKeyInput.value.trim();
	const prompt = promptTextInput.value.trim();
	const audioFile = createAudioFile(recordedChunks, recorder.mimeType);
	recordedChunks = [];

	try {
		setStatus('transcribing...');
		const transcription = await transcribeAudio(audioFile, apiKey, prompt);
		setTranscription(transcription);
		setState('translating');
		setStatus('translating...');
		const translationInstruction = translationInputText.value.trim();
		const translation = await translateText(transcription, apiKey, translationInstruction);
		setTranslation(translation);
		setStatus('done');
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error.';
		setStatus(message);
	} finally {
		setState('idle');
	}
};

recordButton.addEventListener('click', () => {
	if (currentState === 'idle') {
		void startRecording();
		return;
	}
	if (currentState === 'recording') {
		void finishRecording();
	}
});

saveKeyButton.addEventListener('click', () => {
	saveApiKey();
});

cancelButton.addEventListener('click', () => {
	cancelRecording();
});

advancedPanel.addEventListener('toggle', () => {
	if (advancedPanelLocked) {
		advancedPanel.open = lastAdvancedOpen;
		return;
	}
	lastAdvancedOpen = advancedPanel.open;
	saveAdvancedPanelState();
});

promptTextInput.addEventListener('input', () => {
	savePrompt();
});

translationInputText.addEventListener('input', () => {
	saveTranslationInput();
});

setState('idle');
loadSavedApiKey();
loadSavedPrompt();
loadSavedTranslationInput();
loadSavedAdvancedPanelState();
