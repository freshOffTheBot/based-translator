// eslint-disable-next-line import/no-unresolved
import mouseCursorFollowerHtml from './mouseCursorFollower.html?raw';
import './mouseCursorFollower.scss';
import { NATIVE_TRANSLATION_OUTPUT_EVENT } from '../../../../01_webapp/common/native-event/native-event.constant';
import type { NativeTranslationOutputEventDetail } from '../../../../01_webapp/common/native-event/native-event.model';
import { MOUSE_CURSOR_FOLLOWER_LABEL_SELECTOR } from './mouseCursorFollower.constant';


/**
 * # MOUSE CURSOR FOLLOWER COMPONENT
 * - Owns the overlay DOM shown near the mouse cursor.
 * - Updates the label whenever the native translation event arrives.
 */
export function initializeMouseCursorFollowerComponent(root: HTMLElement): void {
	root.innerHTML = mouseCursorFollowerHtml;
	document.body.classList.add('overlay-window');

	const cursorLabel = root.querySelector<HTMLElement>(MOUSE_CURSOR_FOLLOWER_LABEL_SELECTOR);

	if (!cursorLabel) {
		throw new Error('Cursor label element is missing.');
	}

	window.addEventListener(NATIVE_TRANSLATION_OUTPUT_EVENT, (event: Event) => {
		const detail = (event as CustomEvent<Partial<NativeTranslationOutputEventDetail>>).detail;

		if (typeof detail?.translationOutput !== 'string') {
			return;
		}

		cursorLabel.textContent = detail.translationOutput;
	});
}
