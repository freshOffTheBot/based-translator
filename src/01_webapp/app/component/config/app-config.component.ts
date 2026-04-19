
/**
 * # APP CONFIG COMPONENT
 * - Owns the Configuration tab DOM.
 * - Sends input changes up to the app component through event callbacks.
 * - Renders config values from `AppConfigModel`.
 * - This component is stateless. The app state service owns the real values.
 */

import appConfigHtml from './app-config.html?raw';
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

	return {
		/**
		 * Renders config input values and disables them while requests are running.
		 */
		render(model: AppConfigModel): void {
			view.apiKeyInput.value = model.apiKey;
			view.transcriptionPromptInput.value = model.transcriptionPrompt;
			view.translationTemplateInput.value = model.translationTemplate;

			// Lock config while transcription + translation are in progress as one combined flow.
			view.apiKeyInput.disabled = model.isDisabled;
			view.transcriptionPromptInput.disabled = model.isDisabled;
			view.translationTemplateInput.disabled = model.isDisabled;
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

	if (!apiKeyInput || !transcriptionPromptInput || !translationTemplateInput) {
		throw new Error('Required configuration DOM element is missing.');
	}

	return {
		apiKeyInput,
		transcriptionPromptInput,
		translationTemplateInput,
	};
}
