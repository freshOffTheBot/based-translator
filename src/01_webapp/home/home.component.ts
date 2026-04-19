
/**
 * # HOME COMPONENT
 * - Owns the root page served on `/`.
 * - Loads `home.html` into the Vite app root, then mounts the main app inside it.
 * - This file keeps page-level shell work separate from app business logic.
 */

import { initializeAppComponent } from '../app/app.component';
import homeHtml from './home.html?raw';


/**
 * Replaces the Vite `#app` container with the home page shell, then mounts the app.
 */
export function initializeHome(): void {
	const appRoot = document.querySelector<HTMLDivElement>('#app');

	if (!appRoot) {
		throw new Error('App container not found.');
	}

	appRoot.innerHTML = homeHtml;

	// The app is mounted inside the home shell so the page can keep its own layout wrapper.
	const homeAppRoot = appRoot.querySelector<HTMLElement>('#home-app');

	if (!homeAppRoot) {
		throw new Error('Home app container not found.');
	}

	initializeAppComponent(homeAppRoot);
}
