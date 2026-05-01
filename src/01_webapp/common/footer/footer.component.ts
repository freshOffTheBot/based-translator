
/**
 * # FOOTER COMPONENT
 * - Renders the static website footer.
 * - Keeps footer layout in CSS and only fills the build-time app version.
 */

import { getAppVersion } from '../env/env.helper';
import footerHtml from './footer.html?raw';


/**
 * Mounts the static footer markup.
 */
export function initializeFooterComponent(root: HTMLElement): void {
	root.innerHTML = footerHtml.replace('{{APP_VERSION}}', getAppVersion());
}
