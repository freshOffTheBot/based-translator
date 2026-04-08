
/**
 * # RECORDING MIC SERVICE
 * - Owns browser microphone access and MediaRecorder lifecycle work.
 * - Returns recorded audio as a Blob so app logic can send it to OpenAI.
 * - Stops media tracks when recording is canceled or finished.
 */


export interface RecordingMicSession {
	// Browser recorder that receives audio data from the microphone stream.
	mediaRecorder: MediaRecorder;
	// Live microphone stream that must be stopped to release the user's mic.
	mediaStream: MediaStream;
	// In-memory audio chunks collected while the recorder is active.
	audioChunks: Blob[];
}

/**
 * Requests microphone access and starts collecting audio chunks.
 */
export async function startMicRecording(): Promise<RecordingMicSession> {
	const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
	const mediaRecorder = new MediaRecorder(mediaStream);
	const audioChunks: Blob[] = [];

	mediaRecorder.addEventListener('dataavailable', (event: BlobEvent) => {
		// MediaRecorder can emit empty chunks, so only keep chunks with audio data.
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

/**
 * Stops an active recording without returning any recorded audio.
 */
export function cancelMicRecording(recordingSession: RecordingMicSession | null): void {
	stopMicTracks(recordingSession);
}

/**
 * Stops recording and returns the collected audio as one Blob.
 */
export async function stopMicRecordingAndCreateBlob(recordingSession: RecordingMicSession): Promise<Blob> {
	const audioBlob = await stopRecorderAndCreateBlob(recordingSession.mediaRecorder, recordingSession.audioChunks);
	stopMicTracks(recordingSession);
	return audioBlob;
}

/**
 * Releases microphone resources for a live or already-stopped session.
 */
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

/**
 * Waits for MediaRecorder to finish before building the final audio Blob.
 */
function stopRecorderAndCreateBlob(mediaRecorder: MediaRecorder, audioChunks: Blob[]): Promise<Blob> {
	if (mediaRecorder.state === 'inactive') {
		return Promise.resolve(new Blob(audioChunks, { type: 'audio/webm' }));
	}

	return new Promise<Blob>((resolve, reject) => {
		// The final chunk may arrive while the recorder is stopping, so resolve on stop.
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

/**
 * Removes browser-added MIME parameters so the Blob type stays simple.
 */
function normalizeAudioMimeType(mimeType: string): string {
	const cleanMimeType = mimeType.split(';')[0].trim().toLowerCase();
	return cleanMimeType || 'audio/webm';
}
