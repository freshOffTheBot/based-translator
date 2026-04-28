
/**
 * # DROPDOWN COMPONENT
 * - Wires reusable dropdown behavior for `.c-dropdown` markup.
 * - Supports many dropdowns inside the same root.
 * - Closes on outside click, Escape, or `.c-dropdown-item` click.
 * - Safe to initialize again after partial renders.
 */

/**
 * ## Dropdown Elements
 * - Required DOM nodes for one dropdown instance.
 */
interface DropdownElements {
	// Dropdown wrapper.
	root: HTMLElement;

	// Button or anchor that toggles the dropdown.
	trigger: HTMLElement;

	// Hidden content panel revealed only while open.
	content: HTMLElement;
}

/**
 * ## Dropdown Controller
 * - Internal state and listener references for cleanup.
 */
interface DropdownController extends DropdownElements {
	// True while the content is visible or animating open.
	isOpen: boolean;

	// True after destroy runs, so stale public methods become safe no-ops.
	isDestroyed: boolean;

	// Close fallback timer used when no transition event fires.
	closeTimer: number | null;

	// Active transition listener, removed during cleanup.
	onTransitionEnd: ((event: TransitionEvent) => void) | null;

	// Trigger click listener.
	onTriggerClick: (event: MouseEvent) => void;

	// Dropdown click listener.
	onRootClick: (event: MouseEvent) => void;

	// Public API for this dropdown.
	component: DropdownComponent;
}

/**
 * ## Dropdown Component
 * - Public controller for one dropdown instance.
 */
export interface DropdownComponent {
	// Opens the dropdown menu.
	open: () => void;

	// Closes the dropdown menu.
	close: () => void;

	// Toggles the dropdown menu.
	toggle: () => void;

	// Removes listeners and timers owned by this dropdown.
	destroy: () => void;
}

const DROPDOWN_SELECTOR = '.c-dropdown';
const DROPDOWN_TRIGGER_SELECTOR = '.c-dropdown-trigger';
const DROPDOWN_CONTENT_SELECTOR = '.c-dropdown-content';
const DROPDOWN_ITEM_SELECTOR = '.c-dropdown-item';
const DROPDOWN_OPEN_CLASS = 'c-dropdown-open';
const DROPDOWN_CLOSING_CLASS = 'c-dropdown-closing';
const CLOSE_ANIMATION_FALLBACK_MS = 220;

const activeDropdownControllers = new Set<DropdownController>();
const dropdownControllerByRoot = new WeakMap<HTMLElement, DropdownController>();

let dropdownContentId = 0;
let areDocumentEventsBound = false;


/**
 * Initializes every dropdown found under the given root.
 */
export function initializeDropdownComponents(root: ParentNode = document): DropdownComponent[] {
	const dropdownComponents = getDropdownElementsList(root).map(initializeDropdownComponent);

	if (dropdownComponents.length > 0) {
		bindDocumentEvents();
	}

	return dropdownComponents;
}

/**
 * Returns the existing controller for a root or creates a new one.
 */
function initializeDropdownComponent(elements: DropdownElements): DropdownComponent {
	const existingController = dropdownControllerByRoot.get(elements.root);

	if (existingController) {
		return existingController.component;
	}

	const controller = createDropdownController(elements);

	prepareDropdownElements(controller);
	controller.trigger.addEventListener('click', controller.onTriggerClick);
	controller.root.addEventListener('click', controller.onRootClick);
	activeDropdownControllers.add(controller);
	dropdownControllerByRoot.set(controller.root, controller);

	return controller.component;
}

/**
 * Creates one dropdown controller and local listener references.
 */
function createDropdownController(elements: DropdownElements): DropdownController {
	let controller: DropdownController;

	function onTriggerClick(event: MouseEvent): void {
		if (controller.trigger instanceof HTMLAnchorElement) {
			event.preventDefault();
		}

		event.stopPropagation();
		toggleDropdown(controller);
	}

	function onRootClick(event: MouseEvent): void {
		const target = event.target;

		if (!(target instanceof Element)) {
			return;
		}

		const item = target.closest<HTMLElement>(DROPDOWN_ITEM_SELECTOR);

		if (!item || !controller.root.contains(item) || !isItemOwnedByDropdown(item, controller)) {
			return;
		}

		preventEmptyAnchorJump(item, event);

		if (isDropdownItemDisabled(item)) {
			event.preventDefault();
			return;
		}

		closeDropdown(controller, true);
	}

	controller = {
		...elements,
		isOpen: false,
		isDestroyed: false,
		closeTimer: null,
		onTransitionEnd: null,
		onTriggerClick,
		onRootClick,
		component: {
			open(): void {
				openDropdown(controller);
			},
			close(): void {
				closeDropdown(controller, false);
			},
			toggle(): void {
				toggleDropdown(controller);
			},
			destroy(): void {
				destroyDropdown(controller);
			},
		},
	};

	return controller;
}

/**
 * Toggles the dropdown menu.
 */
function toggleDropdown(controller: DropdownController): void {
	if (controller.isDestroyed) {
		return;
	}

	if (controller.isOpen) {
		closeDropdown(controller, false);
		return;
	}

	openDropdown(controller);
}

/**
 * Opens the content panel and updates trigger state.
 */
function openDropdown(controller: DropdownController): void {
	if (controller.isDestroyed) {
		return;
	}

	closeSiblingDropdowns(controller);

	if (controller.isOpen) {
		return;
	}

	clearCloseAnimation(controller);
	controller.content.hidden = false;

	// Force a style read so the open transition starts from the hidden state.
	controller.content.getBoundingClientRect();

	controller.root.classList.remove(DROPDOWN_CLOSING_CLASS);
	controller.root.classList.add(DROPDOWN_OPEN_CLASS);
	controller.trigger.setAttribute('aria-expanded', 'true');
	controller.isOpen = true;
}

/**
 * Starts the close animation and restores `hidden` after it completes.
 */
function closeDropdown(controller: DropdownController, shouldFocusTrigger: boolean): void {
	if (controller.isDestroyed || !controller.isOpen) {
		return;
	}

	clearCloseAnimation(controller);
	controller.isOpen = false;
	controller.root.classList.remove(DROPDOWN_OPEN_CLASS);
	controller.root.classList.add(DROPDOWN_CLOSING_CLASS);
	controller.trigger.setAttribute('aria-expanded', 'false');

	if (shouldFocusTrigger) {
		controller.trigger.focus();
	}

	controller.onTransitionEnd = (event: TransitionEvent): void => {
		if (event.target !== controller.content) {
			return;
		}

		finishCloseAnimation(controller);
	};

	controller.content.addEventListener('transitionend', controller.onTransitionEnd);
	controller.closeTimer = window.setTimeout(() => {
		finishCloseAnimation(controller);
	}, CLOSE_ANIMATION_FALLBACK_MS);
}

/**
 * Finishes closing and hides the content at the HTML level again.
 */
function finishCloseAnimation(controller: DropdownController): void {
	clearCloseAnimation(controller);

	if (controller.isOpen || controller.isDestroyed) {
		return;
	}

	controller.content.hidden = true;
	controller.root.classList.remove(DROPDOWN_CLOSING_CLASS);
}

/**
 * Clears timers and transition listeners from a closing dropdown.
 */
function clearCloseAnimation(controller: DropdownController): void {
	if (controller.closeTimer !== null) {
		window.clearTimeout(controller.closeTimer);
		controller.closeTimer = null;
	}

	if (controller.onTransitionEnd) {
		controller.content.removeEventListener('transitionend', controller.onTransitionEnd);
		controller.onTransitionEnd = null;
	}
}

/**
 * Removes all listeners, timers, and global references for one dropdown.
 */
function destroyDropdown(controller: DropdownController): void {
	if (controller.isDestroyed) {
		return;
	}

	controller.trigger.removeEventListener('click', controller.onTriggerClick);
	controller.root.removeEventListener('click', controller.onRootClick);
	clearCloseAnimation(controller);
	controller.isOpen = false;
	controller.isDestroyed = true;
	controller.content.hidden = true;
	controller.root.classList.remove(DROPDOWN_OPEN_CLASS);
	controller.root.classList.remove(DROPDOWN_CLOSING_CLASS);
	controller.trigger.setAttribute('aria-expanded', 'false');
	activeDropdownControllers.delete(controller);
	dropdownControllerByRoot.delete(controller.root);

	if (!hasActiveDropdownControllers()) {
		unbindDocumentEvents();
	}
}

/**
 * Closes all other dropdowns managed on the page.
 */
function closeSiblingDropdowns(activeController: DropdownController): void {
	getActiveDropdownControllers().forEach((controller) => {
		if (controller === activeController || !controller.isOpen) {
			return;
		}

		closeDropdown(controller, false);
	});
}

/**
 * Sets safe initial attributes and keeps raw dropdown content hidden.
 */
function prepareDropdownElements(controller: DropdownController): void {
	const isInitiallyOpen = controller.root.classList.contains(DROPDOWN_OPEN_CLASS);

	if (controller.trigger instanceof HTMLButtonElement && !controller.trigger.hasAttribute('type')) {
		controller.trigger.type = 'button';
	}

	if (controller.trigger instanceof HTMLAnchorElement && !controller.trigger.hasAttribute('role')) {
		controller.trigger.setAttribute('role', 'button');
	}

	if (!controller.content.id) {
		dropdownContentId += 1;
		controller.content.id = `c-dropdown-content-${dropdownContentId}`;
	}

	controller.trigger.setAttribute('aria-controls', controller.content.id);
	controller.trigger.setAttribute('aria-expanded', String(isInitiallyOpen));
	controller.content.hidden = !isInitiallyOpen;
	controller.isOpen = isInitiallyOpen;
	controller.root.classList.remove(DROPDOWN_CLOSING_CLASS);
}

/**
 * Finds dropdown roots and required child elements.
 */
function getDropdownElementsList(root: ParentNode): DropdownElements[] {
	return getDropdownRoots(root).map((dropdownRoot) => {
		const trigger = getOwnedDropdownChild(dropdownRoot, DROPDOWN_TRIGGER_SELECTOR);
		const content = getOwnedDropdownChild(dropdownRoot, DROPDOWN_CONTENT_SELECTOR);

		if (!trigger || !content) {
			throw new Error('Required dropdown DOM element is missing.');
		}

		return {
			root: dropdownRoot,
			trigger,
			content,
		};
	});
}

/**
 * Finds a child element owned by this dropdown instead of a nested dropdown.
 */
function getOwnedDropdownChild(root: HTMLElement, selector: string): HTMLElement | null {
	const candidates = Array.from(root.querySelectorAll<HTMLElement>(selector));

	return candidates.find((candidate) => {
		return candidate.closest<HTMLElement>(DROPDOWN_SELECTOR) === root;
	}) ?? null;
}

/**
 * Finds dropdown roots, including the root itself when it is a dropdown.
 */
function getDropdownRoots(root: ParentNode): HTMLElement[] {
	const dropdownRoots = Array.from(root.querySelectorAll<HTMLElement>(DROPDOWN_SELECTOR));

	if (root instanceof HTMLElement && root.matches(DROPDOWN_SELECTOR)) {
		return [root, ...dropdownRoots];
	}

	return dropdownRoots;
}

/**
 * Checks whether the clicked item belongs to this dropdown root.
 */
function isItemOwnedByDropdown(item: HTMLElement, controller: DropdownController): boolean {
	return item.closest<HTMLElement>(DROPDOWN_SELECTOR) === controller.root;
}

/**
 * Checks whether a menu item should ignore click-close behavior.
 */
function isDropdownItemDisabled(item: HTMLElement): boolean {
	return item.matches(':disabled, [aria-disabled="true"]');
}

/**
 * Prevents demo-style `href="#"` items from jumping to the top of the page.
 */
function preventEmptyAnchorJump(item: HTMLElement, event: MouseEvent): void {
	if (!(item instanceof HTMLAnchorElement) || item.getAttribute('href') !== '#') {
		return;
	}

	event.preventDefault();
}

/**
 * Closes dropdowns when the next document click lands outside them.
 */
function closeDropdownsOnOutsideClick(event: MouseEvent): void {
	const target = event.target;

	if (!(target instanceof Node)) {
		return;
	}

	getActiveDropdownControllers().forEach((controller) => {
		if (!controller.isOpen || controller.root.contains(target)) {
			return;
		}

		closeDropdown(controller, false);
	});
}

/**
 * Closes dropdowns on Escape like Bootstrap dropdowns.
 */
function closeDropdownsOnEscape(event: KeyboardEvent): void {
	if (event.key !== 'Escape') {
		return;
	}

	const openControllers = getActiveDropdownControllers().filter((controller) => controller.isOpen);

	if (!openControllers.length) {
		return;
	}

	event.preventDefault();
	openControllers.forEach((controller) => {
		closeDropdown(controller, true);
	});
}

/**
 * Reads active controllers from the global registry.
 */
function getActiveDropdownControllers(): DropdownController[] {
	return Array.from(activeDropdownControllers);
}

/**
 * Checks whether any dropdown controllers are still active.
 */
function hasActiveDropdownControllers(): boolean {
	return activeDropdownControllers.size > 0;
}

/**
 * Binds shared document listeners once for all dropdowns.
 */
function bindDocumentEvents(): void {
	if (areDocumentEventsBound) {
		return;
	}

	document.addEventListener('click', closeDropdownsOnOutsideClick);
	document.addEventListener('keydown', closeDropdownsOnEscape);
	areDocumentEventsBound = true;
}

/**
 * Unbinds shared document listeners when the last dropdown is destroyed.
 */
function unbindDocumentEvents(): void {
	document.removeEventListener('click', closeDropdownsOnOutsideClick);
	document.removeEventListener('keydown', closeDropdownsOnEscape);
	areDocumentEventsBound = false;
}
