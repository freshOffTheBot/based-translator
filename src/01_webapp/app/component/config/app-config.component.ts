import appConfigHtml from './app-config.html?raw';
import type { AppConfigModel } from './app-config.model';

interface AppConfigEvents {
	onApiKeyInput: (apiKey: string) => void;
	onTranscriptionPromptInput: (transcriptionPrompt: string) => void;
	onTranslationTemplateInput: (translationTemplate: string) => void;
}

interface AppConfigElements {
	apiKeyInput: HTMLInputElement;
	transcriptionPromptInput: HTMLTextAreaElement;
	translationTemplateInput: HTMLTextAreaElement;
}

export interface AppConfigComponent {
	render: (model: AppConfigModel) => void;
}

export function initializeAppConfigComponent(root: HTMLElement, events: AppConfigEvents): AppConfigComponent {
	root.innerHTML = appConfigHtml;

	const view = getAppConfigElements(root);

	view.apiKeyInput.addEventListener('input', () => {
		events.onApiKeyInput(view.apiKeyInput.value.trim());
	});

	view.transcriptionPromptInput.addEventListener('input', () => {
		events.onTranscriptionPromptInput(view.transcriptionPromptInput.value);
	});

	view.translationTemplateInput.addEventListener('input', () => {
		events.onTranslationTemplateInput(view.translationTemplateInput.value);
	});

	return {
		render(model: AppConfigModel): void {
			view.apiKeyInput.value = model.apiKey;
			view.transcriptionPromptInput.value = model.transcriptionPrompt;
			view.translationTemplateInput.value = model.translationTemplate;

			view.apiKeyInput.disabled = model.isDisabled;
			view.transcriptionPromptInput.disabled = model.isDisabled;
			view.translationTemplateInput.disabled = model.isDisabled;
		},
	};
}

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
