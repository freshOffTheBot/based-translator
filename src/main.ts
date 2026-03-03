import './main.css'
import geistPixelSquareUrl from './assets/fonts/geist-pixel/GeistPixel-Square.woff2?url'

type AppState = 'idle' | 'recording' | 'transcribing'

const TRANSCRIBE_URL = 'https://api.openai.com/v1/audio/transcriptions'
const TRANSCRIBE_MODEL = 'gpt-4o-transcribe'
const REQUEST_TIMEOUT_MS = 60_000
const API_KEY_STORAGE_KEY = 'based_translator_openai_api_key'

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
	throw new Error('Cannot find app root element.')
}

const fontStyle = document.createElement('style')
fontStyle.textContent = `
	@font-face {
		font-family: 'Geist Pixel Square';
		src: url('${geistPixelSquareUrl}') format('woff2');
		font-style: normal;
		font-weight: 500;
		font-display: swap;
	}
`
document.head.appendChild(fontStyle)

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

		<section class="actions" aria-label="Controls">
			<button id="start-btn" type="button">[ Start ]</button>
			<button id="finish-btn" type="button" disabled>[ Finish ]</button>
			<button id="cancel-btn" type="button" disabled>[ Cancel ]</button>
		</section>

		<section class="result" aria-live="polite">
			<p class="result-label">Translation text:</p>
			<pre id="result-text">(empty)</pre>
		</section>
	</main>
`

const apiKeyInput = document.querySelector<HTMLInputElement>('#api-key')
const saveKeyButton = document.querySelector<HTMLButtonElement>('#save-key-btn')
const startButton = document.querySelector<HTMLButtonElement>('#start-btn')
const finishButton = document.querySelector<HTMLButtonElement>('#finish-btn')
const cancelButton = document.querySelector<HTMLButtonElement>('#cancel-btn')
const statusText = document.querySelector<HTMLParagraphElement>('#status')
const resultText = document.querySelector<HTMLPreElement>('#result-text')

if (!apiKeyInput || !saveKeyButton || !startButton || !finishButton || !cancelButton || !statusText || !resultText) {
	throw new Error('Cannot find required UI elements.')
}

let currentState: AppState = 'idle'
let mediaRecorder: MediaRecorder | null = null
let recordedChunks: Blob[] = []

const setState = (next: AppState): void => {
	currentState = next
	const isIdle = next === 'idle'
	const isRecording = next === 'recording'
	const isTranscribing = next === 'transcribing'

	startButton.disabled = !isIdle
	finishButton.disabled = !isRecording
	cancelButton.disabled = !isRecording
	saveKeyButton.disabled = isRecording || isTranscribing
	apiKeyInput.disabled = isRecording || isTranscribing
}

const setStatus = (message: string): void => {
	statusText.textContent = `Status: ${message}`
}

const setResult = (message: string): void => {
	resultText.textContent = message
}

const loadSavedApiKey = (): void => {
	// Load key from browser storage to keep it after refresh.
	const savedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY)
	if (savedApiKey) {
		apiKeyInput.value = savedApiKey
	}
}

const saveApiKey = (): void => {
	// Save key only when user clicks Save button.
	const apiKey = apiKeyInput.value.trim()
	if (!apiKey) {
		localStorage.removeItem(API_KEY_STORAGE_KEY)
		setStatus('Saved empty API key (removed from browser storage).')
		return
	}
	localStorage.setItem(API_KEY_STORAGE_KEY, apiKey)
	setStatus('API key saved in this browser.')
}

const stopTracks = (recorder: MediaRecorder): void => {
	for (const track of recorder.stream.getTracks()) {
		track.stop()
	}
}

const createAudioFile = (chunks: Blob[]): File => {
	const mimeType = mediaRecorder?.mimeType || 'audio/webm'
	const ext = mimeType.includes('ogg') ? 'ogg' : 'webm'
	return new File(chunks, `recording.${ext}`, { type: mimeType })
}

const transcribeAudio = async (audioFile: File, apiKey: string): Promise<string> => {
	const controller = new AbortController()
	const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

	try {
		const formData = new FormData()
		formData.append('file', audioFile)
		formData.append('model', TRANSCRIBE_MODEL)

		const response = await fetch(TRANSCRIBE_URL, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${apiKey}`,
			},
			body: formData,
			signal: controller.signal,
		})

		if (!response.ok) {
			let errorMessage = `API error (${response.status})`
			try {
				const data = (await response.json()) as { error?: { message?: string } }
				if (data.error?.message) {
					errorMessage = `API error: ${data.error.message}`
				}
			} catch {
				// Keep fallback status code error.
			}
			throw new Error(errorMessage)
		}

		const contentType = response.headers.get('content-type') || ''
		if (contentType.includes('application/json')) {
			const data = (await response.json()) as { text?: string }
			if (!data.text) {
				throw new Error('API error: response has no text.')
			}
			return data.text
		}

		const text = await response.text()
		if (!text) {
			throw new Error('API error: empty text response.')
		}
		return text
	} catch (error) {
		if (error instanceof DOMException && error.name === 'AbortError') {
			throw new Error('Timeout error: request took too long.')
		}
		if (error instanceof TypeError) {
			throw new Error('Network error: check internet connection.')
		}
		throw error
	} finally {
		window.clearTimeout(timeoutId)
	}
}

const startRecording = async (): Promise<void> => {
	if (currentState !== 'idle') {
		return
	}

	const apiKey = apiKeyInput.value.trim()
	if (!apiKey) {
		setStatus('Enter your OpenAI API key first.')
		return
	}

	setResult('(empty)')
	setStatus('requesting microphone permission...')

	try {
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
		recordedChunks = []
		mediaRecorder = new MediaRecorder(stream)

		mediaRecorder.ondataavailable = (event: BlobEvent) => {
			if (event.data.size > 0) {
				recordedChunks.push(event.data)
			}
		}

		mediaRecorder.start()
		setState('recording')
		setStatus('recording... click Finish or Cancel')
	} catch (error) {
		if (error instanceof DOMException && error.name === 'NotAllowedError') {
			setStatus('Permission error: microphone access denied.')
			return
		}
		setStatus('Permission error: cannot start microphone.')
	}
}

const cancelRecording = (): void => {
	if (currentState !== 'recording' || !mediaRecorder) {
		return
	}

	mediaRecorder.stop()
	stopTracks(mediaRecorder)
	mediaRecorder = null
	recordedChunks = []

	setState('idle')
	setStatus('Recording canceled. Audio deleted.')
	setResult('(empty)')
}

const finishRecording = async (): Promise<void> => {
	if (currentState !== 'recording' || !mediaRecorder) {
		return
	}

	const recorder = mediaRecorder
	mediaRecorder = null

	setState('transcribing')
	setStatus('stopping recording...')

	const stopped = new Promise<void>((resolve) => {
		recorder.onstop = () => resolve()
	})

	recorder.stop()
	stopTracks(recorder)
	await stopped

	if (recordedChunks.length === 0) {
		setState('idle')
		setStatus('No audio data recorded.')
		return
	}

	const apiKey = apiKeyInput.value.trim()
	const audioFile = createAudioFile(recordedChunks)
	recordedChunks = []

	try {
		setStatus('sending audio to OpenAI...')
		const text = await transcribeAudio(audioFile, apiKey)
		setResult(text)
		setStatus('Done')
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error.'
		setStatus(message)
	} finally {
		setState('idle')
	}
}

startButton.addEventListener('click', () => {
	void startRecording()
})

saveKeyButton.addEventListener('click', () => {
	saveApiKey()
})

finishButton.addEventListener('click', () => {
	void finishRecording()
})

cancelButton.addEventListener('click', () => {
	cancelRecording()
})

setState('idle')
loadSavedApiKey()
