
/**
 * # APP STATE SERVICE
 * - Creates the single state object used by the webapp.
 * - Provides small setter helpers so app state changes stay consistent.
 * - Loads saved browser-only configuration when the app starts.
 * - This service is the single source of truth for app-level state.
 */

import { loadApiKey, loadTranscriptionPrompt, loadTranslationTemplate } from '../../common/localStorage/localStorage.service';
import type { RecordingMicSession } from '../../common/recording-mic/recording-mic.service';


/**
 * ## State Types
 * - `phase` controls recording/request flow.
 * - `tab` controls which panel is visible.
 * - `tone` controls status styling only.
 */
export type AppPhase = 'idle' | 'recording' | 'transcribing' | 'translating' | 'success' | 'error';
export type AppTab = 'recording' | 'configuration';
export type StatusTone = 'neutral' | 'success' | 'danger' | 'info';

/**
 * ## App State
 * - If this object changes, the app re-renders child components from it.
 */
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
		// The app opens on the Recording tab by default.
		activeTab: 'recording',
		// Startup state matches the idle UI spec.
		phase: 'idle',
		statusMessage: 'idle',
		statusTone: 'neutral',
		transcriptionOutput: '',
		translationOutput: '',
		recordingSession: null,
	};
}

/**
 * Updates the current app phase.
 */
export function setPhase(state: AppState, phase: AppPhase): void {
	state.phase = phase;
}

/**
 * Switches the visible tab in the app shell.
 */
export function setActiveTab(state: AppState, tab: AppTab): void {
	state.activeTab = tab;
}

/**
 * Updates the text and tone shown in the Recording tab status line.
 */
export function setStatus(state: AppState, message: string, tone: StatusTone): void {
	state.statusMessage = message;
	state.statusTone = tone;
}

/**
 * Saves or clears the live microphone recording session.
 */
export function setRecordingSession(state: AppState, recordingSession: RecordingMicSession | null): void {
	state.recordingSession = recordingSession;
}

/**
 * Clears both output boxes before a new recording flow starts.
 */
export function clearOutputs(state: AppState): void {
	state.transcriptionOutput = '';
	state.translationOutput = '';
}

/**
 * Saves the latest transcription output.
 */
export function setTranscriptionOutput(state: AppState, transcriptionOutput: string): void {
	state.transcriptionOutput = transcriptionOutput;
}

/**
 * Saves the latest translation output.
 */
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
