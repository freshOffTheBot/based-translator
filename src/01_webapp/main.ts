
/**
 * # MAIN ENTRY
 * - Vite starts the webapp from this file.
 * - Loads shared styles, boots the Home controller, and wires shared behavior.
 * - Keeping the entry file tiny makes the startup path easy to trace:
 *   - `main.ts`
 *   - `home.component.ts`
 *   - `app.component.ts`
 */

import { initializeDropdownComponents } from './component/dropdown/dropdown.component';
import { initializeHome } from './home/home.component';
import './main.scss';


/**
 * Boots the browser app after Vite loads the entry bundle.
 */
initializeHome();
initializeDropdownComponents();
