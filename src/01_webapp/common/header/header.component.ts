
/**
 * # HEADER COMPONENT
 * - Renders the static website header.
 * - Dropdown behavior comes from the shared dropdown component.
 */

import headerHtml from './header.html?raw';


/**
 * Mounts the static header markup.
 */
export function initializeHeaderComponent(root: HTMLElement): void {
	root.innerHTML = headerHtml;
}
