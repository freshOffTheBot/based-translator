import { initializeAppComponent } from '../app/app.component';
import homeHtml from './home.html?raw';

export function initializeHome(): void {
	const appRoot = document.querySelector<HTMLDivElement>('#app');

	if (!appRoot) {
		throw new Error('App container not found.');
	}

	appRoot.innerHTML = homeHtml;

	const homeAppRoot = appRoot.querySelector<HTMLElement>('#home-app');

	if (!homeAppRoot) {
		throw new Error('Home app container not found.');
	}

	initializeAppComponent(homeAppRoot);
}
