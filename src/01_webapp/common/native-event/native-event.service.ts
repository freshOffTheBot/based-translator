
/**
 * # NATIVE EVENT SERVICE
 * - Publishes browser-native events for optional desktop wrappers.
 * - Does not import Electron, Tauri, or any wrapper-specific API.
 * - This keeps the shared webapp source portable and sandboxed.
 */

import { NATIVE_TRANSLATION_OUTPUT_EVENT } from './native-event.constant';
import type { NativeTranslationOutputEventDetail } from './native-event.model';


/**
 * Announces that the translation flow produced final translated text.
 * - Native wrappers can listen to this DOM event and forward it however they want.
 */
export function dispatchNativeTranslationOutputEvent(translationOutput: string): void {
	const event = new CustomEvent<NativeTranslationOutputEventDetail>(NATIVE_TRANSLATION_OUTPUT_EVENT, {
		detail: {
			translationOutput,
		},
	});

	window.dispatchEvent(event);
}
