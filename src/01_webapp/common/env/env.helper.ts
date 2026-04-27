
/**
 * # ENV HELPER
 * - Reads build-time environment values exposed by Vite.
 * - Keeps app code away from direct global constant usage.
 */

export type AppRuntime = 'webapp' | 'electron';


/**
 * Returns true when this bundle was built as the standalone webapp.
 */
export function isBuiltAsWebapp(): boolean {
	return __APP_RUNTIME__ === 'webapp';
}
