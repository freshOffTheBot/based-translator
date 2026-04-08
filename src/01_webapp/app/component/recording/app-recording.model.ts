import type { AppPhase, StatusTone } from '../../common/app-state.service';

export interface AppRecordingModel {
	phase: AppPhase;
	statusMessage: string;
	statusTone: StatusTone;
	transcriptionOutput: string;
	translationOutput: string;
}
