import './index.css';
import { NATIVE_TRANSLATION_OUTPUT_EVENT } from '../../01_webapp/common/native-event/native-event.constant';
import type { NativeTranslationOutputEventDetail } from '../../01_webapp/common/native-event/native-event.model';


/**
 * # ELECTRON RENDERER
 * - Runs the shared webapp in the main window.
 * - Runs a tiny translated-text label in the overlay window.
 */


function renderOverlayWindow(): void {
	document.body.classList.add('overlay-window');
	document.body.innerHTML = `
		<div class="overlay-stage" aria-hidden="true">
			<div id="cursor-label" class="cursor-label"></div>
		</div>
	`;

	const cursorLabel = document.querySelector<HTMLElement>('#cursor-label');

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

function renderMainWindow(): void {
	void import('../../01_webapp/main');
}

if (window.location.hash === '#overlay') {
	renderOverlayWindow();
} else {
	renderMainWindow();
}
