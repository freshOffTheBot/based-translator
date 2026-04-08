export interface RecordingMicSession {
	mediaRecorder: MediaRecorder;
	mediaStream: MediaStream;
	audioChunks: Blob[];
}

export async function startMicRecording(): Promise<RecordingMicSession> {
	const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
	const mediaRecorder = new MediaRecorder(mediaStream);
	const audioChunks: Blob[] = [];

	mediaRecorder.addEventListener('dataavailable', (event: BlobEvent) => {
		if (event.data.size > 0) {
			audioChunks.push(event.data);
		}
	});

	mediaRecorder.start();

	return {
		mediaRecorder,
		mediaStream,
		audioChunks,
	};
}

export function cancelMicRecording(recordingSession: RecordingMicSession | null): void {
	stopMicTracks(recordingSession);
}

export async function stopMicRecordingAndCreateBlob(recordingSession: RecordingMicSession): Promise<Blob> {
	const audioBlob = await stopRecorderAndCreateBlob(recordingSession.mediaRecorder, recordingSession.audioChunks);
	stopMicTracks(recordingSession);
	return audioBlob;
}

function stopMicTracks(recordingSession: RecordingMicSession | null): void {
	if (!recordingSession) {
		return;
	}

	if (recordingSession.mediaRecorder.state !== 'inactive') {
		recordingSession.mediaRecorder.stop();
	}

	for (const track of recordingSession.mediaStream.getTracks()) {
		track.stop();
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

function normalizeAudioMimeType(mimeType: string): string {
	const cleanMimeType = mimeType.split(';')[0].trim().toLowerCase();
	return cleanMimeType || 'audio/webm';
}
