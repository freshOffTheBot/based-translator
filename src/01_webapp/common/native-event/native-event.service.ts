
import { NATIVE_TRANSLATION_OUTPUT_EVENT } from './native-event.constant';
import type { NativeTranslationOutputEventDetail } from './native-event.model';


/**
 * # NATIVE EVENT SERVICE
 * - Publishes browser-native events for optional desktop wrappers.
 * - Does not import Electron, Tauri, or any wrapper-specific API.
 */


/**
 * Announces that the translation flow produced final translated text.
 */
export function dispatchNativeTranslationOutputEvent(translationOutput: string): void {
	const event = new CustomEvent<NativeTranslationOutputEventDetail>(NATIVE_TRANSLATION_OUTPUT_EVENT, {
		detail: {
			translationOutput,
		},
	});

	window.dispatchEvent(event);
}
