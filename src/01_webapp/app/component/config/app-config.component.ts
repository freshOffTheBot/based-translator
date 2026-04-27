
/**
 * # APP CONFIG COMPONENT
 * - Owns the Configuration tab DOM.
 * - Sends input changes up to the app component through event callbacks.
 * - Renders config values from `AppConfigModel`.
 * - This component is stateless. The app state service owns the real values.
 */

import appConfigHtml from './app-config.html?raw';
import { isBuiltAsWebapp } from '../../../common/env/env.helper';
import {
	DEFAULT_MOUSE_CURSOR_FOLLOWER_HIDE_TIMEOUT_MS,
	MOUSE_CURSOR_FOLLOWER_HIDE_TIMEOUT_DISABLED_VALUE,
	MOUSE_CURSOR_FOLLOWER_HIDE_TIMEOUT_MS_VALUES,
	type EnabledMouseCursorFollowerHideTimeoutMs,
	type MouseCursorFollowerHideTimeoutMs,
} from '../../app.constant';
import type { AppConfigModel } from './app-config.model';


/**
 * ## App Config Events
 * - The parent app owns persistence and business logic.
 * - This component only forwards user input upward.
 */
interface AppConfigEvents {
	// Called when the API key input changes.
	onApiKeyInput: (apiKey: string) => void;

	// Called when the transcription prompt textarea changes.
	onTranscriptionPromptInput: (transcriptionPrompt: string) => void;

	// Called when the translation template textarea changes.
	onTranslationTemplateInput: (translationTemplate: string) => void;

	// Called when the native mouse-cursor-follower hide timeout changes.
	onMouseCursorFollowerHideTimeoutInput: (timeoutMs: MouseCursorFollowerHideTimeoutMs) => void;
}

/**
 * ## App Config Elements
 * - Required DOM nodes used by the Configuration controller.
 */
interface AppConfigElements {
	// API key input element.
	apiKeyInput: HTMLInputElement;

	// Transcription prompt textarea element.
	transcriptionPromptInput: HTMLTextAreaElement;

	// Translation template textarea element.
	translationTemplateInput: HTMLTextAreaElement;

	// Native feature collapse wrapper.
	nativeFeatureCollapse: HTMLDetailsElement;

	// Native mouse-cursor-follower timeout select element.
	mouseCursorFollowerHideTimeoutInput: HTMLSelectElement;

	// Webapp-only warning shown under the native timeout control.
	mouseCursorFollowerWebappWarning: HTMLElement;
}

/**
 * ## App Config Component
 * - Public controller surface returned to the parent app.
 */
export interface AppConfigComponent {
	// Updates the Configuration tab from the latest app model.
	render: (model: AppConfigModel) => void;
}

/**
 * Creates the Configuration tab controller and wires DOM events to the app.
 */
export function initializeAppConfigComponent(root: HTMLElement, events: AppConfigEvents): AppConfigComponent {
	root.innerHTML = appConfigHtml;

	const view = getAppConfigElements(root);
	const isNativeFeatureUnavailable = isBuiltAsWebapp();

	// Native app builds open the native-feature group by default.
	view.nativeFeatureCollapse.open = !isNativeFeatureUnavailable;

	view.apiKeyInput.addEventListener('input', () => {
		// Trim the API key so accidental spaces do not get stored in browser state.
		events.onApiKeyInput(view.apiKeyInput.value.trim());
	});

	view.transcriptionPromptInput.addEventListener('input', () => {
		events.onTranscriptionPromptInput(view.transcriptionPromptInput.value);
	});

	view.translationTemplateInput.addEventListener('input', () => {
		events.onTranslationTemplateInput(view.translationTemplateInput.value);
	});

	view.mouseCursorFollowerHideTimeoutInput.addEventListener('change', () => {
		events.onMouseCursorFollowerHideTimeoutInput(
			getMouseCursorFollowerHideTimeoutMsFromFormValue(view.mouseCursorFollowerHideTimeoutInput.value),
		);
	});

	return {
		/**
		 * Renders config input values and disables them while requests are running.
		 */
		render(model: AppConfigModel): void {
			view.apiKeyInput.value = model.apiKey;
			view.transcriptionPromptInput.value = model.transcriptionPrompt;
			view.translationTemplateInput.value = model.translationTemplate;
			view.mouseCursorFollowerHideTimeoutInput.value = getMouseCursorFollowerHideTimeoutFormValue(model.mouseCursorFollowerHideTimeoutMs);

			// Lock config while transcription + translation are in progress as one combined flow.
			view.apiKeyInput.disabled = model.isDisabled;
			view.transcriptionPromptInput.disabled = model.isDisabled;
			view.translationTemplateInput.disabled = model.isDisabled;
			view.mouseCursorFollowerHideTimeoutInput.disabled = model.isDisabled || isNativeFeatureUnavailable;
			view.mouseCursorFollowerWebappWarning.classList.toggle('hidden', !isNativeFeatureUnavailable);
		},
	};
}

/**
 * Finds required Configuration tab elements and fails early if the HTML changed.
 */
function getAppConfigElements(root: HTMLElement): AppConfigElements {
	const apiKeyInput = root.querySelector<HTMLInputElement>('#api-key-input');
	const transcriptionPromptInput = root.querySelector<HTMLTextAreaElement>('#transcription-prompt-input');
	const translationTemplateInput = root.querySelector<HTMLTextAreaElement>('#translation-template-input');
	const nativeFeatureCollapse = root.querySelector<HTMLDetailsElement>('#native-feature-collapse');
	const mouseCursorFollowerHideTimeoutInput = root.querySelector<HTMLSelectElement>('#mouse-cursor-follower-hide-timeout-input');
	const mouseCursorFollowerWebappWarning = root.querySelector<HTMLElement>('#mouse-cursor-follower-webapp-warning');

	if (
		!apiKeyInput ||
		!transcriptionPromptInput ||
		!translationTemplateInput ||
		!nativeFeatureCollapse ||
		!mouseCursorFollowerHideTimeoutInput ||
		!mouseCursorFollowerWebappWarning
	) {
		throw new Error('Required configuration DOM element is missing.');
	}

	return {
		apiKeyInput,
		transcriptionPromptInput,
		translationTemplateInput,
		nativeFeatureCollapse,
		mouseCursorFollowerHideTimeoutInput,
		mouseCursorFollowerWebappWarning,
	};
}

/**
 * Converts the timeout model value into the select option value.
 */
function getMouseCursorFollowerHideTimeoutFormValue(timeoutMs: MouseCursorFollowerHideTimeoutMs): string {
	return timeoutMs === null ? MOUSE_CURSOR_FOLLOWER_HIDE_TIMEOUT_DISABLED_VALUE : String(timeoutMs);
}

/**
 * Converts the selected option into the timeout value used by the app state.
 */
function getMouseCursorFollowerHideTimeoutMsFromFormValue(value: string): MouseCursorFollowerHideTimeoutMs {
	if (value === MOUSE_CURSOR_FOLLOWER_HIDE_TIMEOUT_DISABLED_VALUE) {
		return null;
	}

	const timeoutMs = Number(value);

	if (MOUSE_CURSOR_FOLLOWER_HIDE_TIMEOUT_MS_VALUES.includes(timeoutMs as EnabledMouseCursorFollowerHideTimeoutMs)) {
		return timeoutMs as EnabledMouseCursorFollowerHideTimeoutMs;
	}

	return DEFAULT_MOUSE_CURSOR_FOLLOWER_HIDE_TIMEOUT_MS;
}
