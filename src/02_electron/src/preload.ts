import { ipcRenderer } from 'electron';
import { NATIVE_TRANSLATION_OUTPUT_EVENT } from '../../01_webapp/common/native-event/native-event.constant';
import type { NativeTranslationOutputEventDetail } from '../../01_webapp/common/native-event/native-event.model';
import { NATIVE_TRANSLATION_OUTPUT_IPC_CHANNEL } from './app/app.constant';


/**
 * # PRELOAD
 * - Bridges webapp DOM CustomEvents to Electron IPC.
 * - Keeps Electron APIs out of the shared webapp source.
 */


function isNativeTranslationOutputEvent(event: Event): event is CustomEvent<NativeTranslationOutputEventDetail> {
	const detail = (event as CustomEvent<Partial<NativeTranslationOutputEventDetail>>).detail;
	return typeof detail?.translationOutput === 'string';
}

function bindMainWindowNativeEvents(): void {
	window.addEventListener(NATIVE_TRANSLATION_OUTPUT_EVENT, (event: Event) => {
		if (!isNativeTranslationOutputEvent(event)) {
			return;
		}

		ipcRenderer.send(NATIVE_TRANSLATION_OUTPUT_IPC_CHANNEL, event.detail.translationOutput);
	});
}

function bindOverlayWindowNativeEvents(): void {
	ipcRenderer.on(NATIVE_TRANSLATION_OUTPUT_IPC_CHANNEL, (_event, translationOutput: string) => {
		const nativeEvent = new CustomEvent<NativeTranslationOutputEventDetail>(NATIVE_TRANSLATION_OUTPUT_EVENT, {
			detail: {
				translationOutput,
			},
		});

		window.dispatchEvent(nativeEvent);
	});
}

if (window.location.hash === '#overlay') {
	bindOverlayWindowNativeEvents();
} else {
	bindMainWindowNativeEvents();
}
