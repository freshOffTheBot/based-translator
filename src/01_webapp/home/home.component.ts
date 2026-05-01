
/**
 * # HOME COMPONENT
 * - Owns the root page served on `/`.
 * - Loads `home.html` into the Vite app root, then mounts the main app inside it.
 * - This file keeps page-level shell work separate from app business logic.
 */

import { initializeAppComponent } from '../app/app.component';
import { initializeHeaderComponent } from '../common/header/header.component';
import { initializeFooterComponent } from '../common/footer/footer.component';
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

	// Mount page-level shell components around the app in the same order as `home.html`.
	const homeHeaderRoot = appRoot.querySelector<HTMLElement>('#home-header');
	const homeAppRoot = appRoot.querySelector<HTMLElement>('#home-app');
	const homeFooterRoot = appRoot.querySelector<HTMLElement>('#home-footer');

	if (!homeHeaderRoot || !homeAppRoot || !homeFooterRoot) {
		throw new Error('Home app container not found.');
	}

	initializeHeaderComponent(homeHeaderRoot);
	initializeAppComponent(homeAppRoot);
	initializeFooterComponent(homeFooterRoot);
}
