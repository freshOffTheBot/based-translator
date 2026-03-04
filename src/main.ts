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

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
	throw new Error('Cannot find app root element.');
}

app.innerHTML = `
	<main class="panel">
		<h1>BASED TRANSLATOR</h1>
		<p class="subtitle">Speech-to-text translator using the OpenAI API. No server-side storage - everything stays in your browser.</p>

		<label class="field" for="api-key">OpenAI API Key</label>
		<input id="api-key" type="password" autocomplete="off" placeholder="sk-..." />
		<div class="status-wrap">
			<div class="status-info">
				<p id="status" class="status" role="status" aria-live="polite">Status: idle</p>
			</div>
			<button id="save-key-btn" type="button">[ Save API Key ]</button>
		</div>

		<label class="field" for="prompt-text">Prompt (optional)</label>
		<textarea id="prompt-text" rows="3" placeholder="Give optional transcription hints (language, terms, style)."></textarea>

		<section class="actions" aria-label="Controls">
			<button id="start-btn" type="button">[ Start ]</button>
			<button id="finish-btn" type="button" disabled>[ Finish ]</button>
			<button id="cancel-btn" type="button" disabled>[ Cancel ]</button>
		</section>

		<section class="transcription" aria-live="polite">
			<p class="transcription-label">Transcription text:</p>
			<pre id="transcription-text">(empty)</pre>
		</section>

		<div class="flow-arrow" aria-hidden="true">
			<pre>↓</pre>
		</div>

		<label class="field" for="translation-input-text">Translation input (instructions)</label>
		<textarea id="translation-input-text" rows="3" placeholder="Example: Translate to Korean. Keep it natural and concise."></textarea>

		<section class="translation" aria-live="polite">
			<p class="translation-label">Translation text:</p>
			<pre id="translation-text">(empty)</pre>
		</section>
	</main>
`;

const apiKeyInput = document.querySelector<HTMLInputElement>('#api-key');
const saveKeyButton = document.querySelector<HTMLButtonElement>('#save-key-btn');
const startButton = document.querySelector<HTMLButtonElement>('#start-btn');
const finishButton = document.querySelector<HTMLButtonElement>('#finish-btn');
const cancelButton = document.querySelector<HTMLButtonElement>('#cancel-btn');
const promptTextInput = document.querySelector<HTMLTextAreaElement>('#prompt-text');
const translationInputText = document.querySelector<HTMLTextAreaElement>('#translation-input-text');
const statusText = document.querySelector<HTMLParagraphElement>('#status');
const transcriptionText = document.querySelector<HTMLPreElement>('#transcription-text');
const translationText = document.querySelector<HTMLPreElement>('#translation-text');

if (
	!apiKeyInput ||
	!saveKeyButton ||
	!startButton ||
	!finishButton ||
	!cancelButton ||
	!promptTextInput ||
	!translationInputText ||
	!statusText ||
	!transcriptionText ||
	!translationText
) {
	throw new Error('Cannot find required UI elements.');
}

let currentState: AppState = 'idle';
let mediaRecorder: MediaRecorder | null = null;
let recordedChunks: Blob[] = [];

const setState = (next: AppState): void => {
	currentState = next;
	const isIdle = next === 'idle';
	const isRecording = next === 'recording';
	const isTranscribing = next === 'transcribing';
	const isTranslating = next === 'translating';

	startButton.disabled = !isIdle;
	finishButton.disabled = !isRecording;
	cancelButton.disabled = !isRecording;
	saveKeyButton.disabled = isRecording || isTranscribing || isTranslating;
	apiKeyInput.disabled = isRecording || isTranscribing || isTranslating;
	promptTextInput.disabled = isRecording || isTranscribing || isTranslating;
	translationInputText.disabled = isRecording || isTranscribing || isTranslating;
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

const stopTracks = (recorder: MediaRecorder): void => {
	for (const track of recorder.stream.getTracks()) {
		track.stop();
	}
};

const createAudioFile = (chunks: Blob[]): File => {
	const mimeType = mediaRecorder?.mimeType || 'audio/webm';
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
		setStatus('recording... click Finish or Cancel');
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
	setStatus('Recording canceled. Audio deleted.');
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
	const audioFile = createAudioFile(recordedChunks);
	recordedChunks = [];

	try {
		setStatus('sending audio to OpenAI...');
		const transcription = await transcribeAudio(audioFile, apiKey, prompt);
		setTranscription(transcription);
		setState('translating');
		setStatus('translating transcription with OpenAI...');
		const translationInstruction = translationInputText.value.trim();
		const translation = await translateText(transcription, apiKey, translationInstruction);
		setTranslation(translation);
		setStatus('Done');
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error.';
		setStatus(message);
	} finally {
		setState('idle');
	}
};

startButton.addEventListener('click', () => {
	void startRecording();
});

saveKeyButton.addEventListener('click', () => {
	saveApiKey();
});

finishButton.addEventListener('click', () => {
	void finishRecording();
});

cancelButton.addEventListener('click', () => {
	cancelRecording();
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
