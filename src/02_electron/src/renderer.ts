/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.ts` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import './index.css';

const FLOATING_LABEL_TEXT = 'Cursor Label';

const renderMainWindow = () => {
	document.body.classList.add('main-window');
	document.body.innerHTML = `
		<main class="app-shell">
			<p class="eyebrow">Electron Forge + Vite</p>
			<h1>Global Cursor Label</h1>
			<p class="lede">
				A transparent overlay window is running and tracking the mouse cursor
				across the desktop.
			</p>
			<p class="status-pill">Floating label active</p>
		</main>
	`;
};

const renderOverlayWindow = () => {
	document.body.classList.add('overlay-window');
	document.body.innerHTML = `
		<div class="overlay-stage" aria-hidden="true">
			<div class="cursor-label">${FLOATING_LABEL_TEXT}</div>
		</div>
	`;
};

if (window.location.hash === '#overlay') {
	renderOverlayWindow();
} else {
	renderMainWindow();
}
