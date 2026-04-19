/**
 * # ELECTRON RENDERER
 * - Runs the shared webapp in the main window.
 * - Runs a tiny translated-text label in the overlay window.
 * - Uses the URL hash to decide which renderer mode to boot.
 */

import './index.css';
import { OVERLAY_WINDOW_HASH } from './app/app.constant';
import { initializeMouseCursorFollowerComponent } from './common/mouseCursorFollower/mouseCursorFollower.component';


/**
 * Boots the shared browser webapp inside the main Electron window.
 */
function renderMainWindow(): void {
	void import('../../01_webapp/main');
}

// The renderer entrypoint is shared by both windows.
// - `#overlay` boots the mouse-cursor follower UI.
// - No hash boots the regular shared webapp.
if (window.location.hash === `#${OVERLAY_WINDOW_HASH}`) {
	initializeMouseCursorFollowerComponent(document.body);
} else {
	renderMainWindow();
}
