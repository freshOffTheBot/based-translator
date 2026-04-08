
/**
 * # NATIVE EVENT MODEL
 * - Payload models for DOM CustomEvent messages that native wrappers may listen to.
 */


export interface NativeTranslationOutputEventDetail {
	// Final translated text from the translation flow.
	translationOutput: string;
}
