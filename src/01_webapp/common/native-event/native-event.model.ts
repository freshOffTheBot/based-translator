
/**
 * # NATIVE EVENT MODEL
 * - Payload models for DOM `CustomEvent` messages that native wrappers may listen to.
 */


/**
 * ## Native Translation Output Event Detail
 * - Payload sent with the final translation output event.
 */
export interface NativeTranslationOutputEventDetail {
	// Final translated text from the translation flow.
	translationOutput: string;
}
