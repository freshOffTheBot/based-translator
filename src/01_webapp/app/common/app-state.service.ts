import {
	loadApiKey,
	loadTranscriptionPrompt,
	loadTranslationTemplate,
} from '../../common/localStorage/localStorage.service';
import type { RecordingMicSession } from '../../common/recording-mic/recording-mic.service';

export type AppPhase = 'idle' | 'recording' | 'transcribing' | 'translating' | 'success' | 'error';
export type AppTab = 'recording' | 'configuration';
export type StatusTone = 'neutral' | 'success' | 'danger' | 'info';

export interface AppState {
	apiKey: string;
	transcriptionPrompt: string;
	translationTemplate: string;
	activeTab: AppTab;
	phase: AppPhase;
	statusMessage: string;
	statusTone: StatusTone;
	transcriptionOutput: string;
	translationOutput: string;
	recordingSession: RecordingMicSession | null;
}

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

export function setErrorStatus(state: AppState, error: unknown, fallbackMessage: string): void {
	const message = error instanceof Error ? error.message : fallbackMessage;
	setPhase(state, 'error');
	setStatus(state, message || fallbackMessage, 'danger');
}
