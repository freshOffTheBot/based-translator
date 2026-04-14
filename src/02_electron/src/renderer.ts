import './index.css';
import { OVERLAY_WINDOW_HASH } from './app/app.constant';
import { initializeMouseCursorFollowerComponent } from './common/mouseCursorFollower/mouseCursorFollower.component';


/**
 * # ELECTRON RENDERER
 * - Runs the shared webapp in the main window.
 * - Runs a tiny translated-text label in the overlay window.
 */

function renderMainWindow(): void {
	void import('../../01_webapp/main');
}

if (window.location.hash === `#${OVERLAY_WINDOW_HASH}`) {
	initializeMouseCursorFollowerComponent(document.body);
} else {
	renderMainWindow();
}
