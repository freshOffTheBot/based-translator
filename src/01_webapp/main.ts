
/**
 * # MAIN ENTRY
 * - Vite starts the webapp from this file.
 * - This file only loads shared styles, then hands control to the Home controller.
 * - Keeping the entry file tiny makes the startup path easy to trace:
 *   - `main.ts`
 *   - `home.component.ts`
 *   - `app.component.ts`
 */

import { initializeHome } from './home/home.component';
import './main.scss';


/**
 * Boots the browser app after Vite loads the entry bundle.
 */
initializeHome();
