
import { loadApiKey, loadTranscriptionPrompt, loadTranslationTemplate } from '../../common/localStorage/localStorage.service';
import type { RecordingMicSession } from '../../common/recording-mic/recording-mic.service';


/**
 * # APP STATE SERVICE
 * - Creates the single state object used by the webapp.
 * - Provides small setter helpers so app state changes stay consistent.
 * - Loads saved browser-only configuration when the app starts.
 */


export type AppPhase = 'idle' | 'recording' | 'transcribing' | 'translating' | 'success' | 'error';
export type AppTab = 'recording' | 'configuration';
export type StatusTone = 'neutral' | 'success' | 'danger' | 'info';

export interface AppState {
	// User-provided OpenAI API key stored only in the browser.
	apiKey: string;
	// Optional prompt sent to the transcription request.
	transcriptionPrompt: string;
	// Template used to build the translation request input.
	translationTemplate: string;
	// Currently selected app tab.
	activeTab: AppTab;
	// Current recording/request phase.
	phase: AppPhase;
	// Human-readable status text shown in the Recording tab.
	statusMessage: string;
	// Visual tone for the status text.
	statusTone: StatusTone;
	// Latest transcription result.
	transcriptionOutput: string;
	// Latest translation result.
	translationOutput: string;
	// Active microphone recording session, or null when not recording.
	recordingSession: RecordingMicSession | null;
}

/**
 * Builds the initial app state from saved browser settings and default view values.
 */
export function createAppState(): AppState {
	return {
		apiKey: loadApiKey(),
		transcriptionPrompt: loadTranscriptionPrompt(),
		translationTemplate: loadTranslationTemplate(),
		activeTab: 'recording',
		phase: 'idle',
		statusMessage: 'idle',
		statusTone: 'neutral',
		transcriptionOutput: '',
		translationOutput: '',
		recordingSession: null,
	};
}

export function setPhase(state: AppState, phase: AppPhase): void {
	state.phase = phase;
}

export function setActiveTab(state: AppState, tab: AppTab): void {
	state.activeTab = tab;
}

export function setStatus(state: AppState, message: string, tone: StatusTone): void {
	state.statusMessage = message;
	state.statusTone = tone;
}

export function setRecordingSession(state: AppState, recordingSession: RecordingMicSession | null): void {
	state.recordingSession = recordingSession;
}

export function clearOutputs(state: AppState): void {
	state.transcriptionOutput = '';
	state.translationOutput = '';
}

export function setTranscriptionOutput(state: AppState, transcriptionOutput: string): void {
	state.transcriptionOutput = transcriptionOutput;
}

export function setTranslationOutput(state: AppState, translationOutput: string): void {
	state.translationOutput = translationOutput;
}

/**
 * Moves the app into the error phase and shows the best available error message.
 */
export function setErrorStatus(state: AppState, error: unknown, fallbackMessage: string): void {
	const message = error instanceof Error ? error.message : fallbackMessage;
	setPhase(state, 'error');
	setStatus(state, message || fallbackMessage, 'danger');
}
