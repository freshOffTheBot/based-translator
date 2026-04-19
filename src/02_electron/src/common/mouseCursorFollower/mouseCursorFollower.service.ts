/**
 * # MOUSE CURSOR FOLLOWER SERVICE
 * - Owns the Electron overlay window and cursor tracking state.
 * - Bridges translated text between Electron IPC and DOM CustomEvents.
 */

import { NATIVE_TRANSLATION_OUTPUT_EVENT } from '../../../../01_webapp/common/native-event/native-event.constant';
import type { NativeTranslationOutputEventDetail } from '../../../../01_webapp/common/native-event/native-event.model';
import { NATIVE_TRANSLATION_OUTPUT_IPC_CHANNEL, OVERLAY_WINDOW_HASH } from '../../app/app.constant';
import { createAppWebPreferences } from '../../app/app.helper';
import { MOUSE_CURSOR_FOLLOWER_CURSOR_OFFSET, MOUSE_CURSOR_FOLLOWER_CURSOR_POLL_INTERVAL_MS, MOUSE_CURSOR_FOLLOWER_WINDOW_DIMENSIONS } from './mouseCursorFollower.constant';
import type { BrowserWindow, BrowserWindowConstructorOptions, IpcMain, IpcRenderer, Point, Screen } from 'electron';


/**
 * ## Create Mouse Cursor Follower Window Options
 * - Small wrapper inputs so the main process can supply shared helpers.
 */
interface CreateMouseCursorFollowerWindowOptions {
	// Factory used to create the overlay BrowserWindow.
	createBrowserWindow: (options: BrowserWindowConstructorOptions) => BrowserWindow;

	// Loader that opens the renderer in dev or packaged mode.
	loadRendererWindow: (window: BrowserWindow, hash?: string) => Promise<void>;

	// Preload path used by the overlay window.
	preloadPath: string;
}

// Single reference to the overlay BrowserWindow while it exists.
let overlayWindow: BrowserWindow | null = null;

// Interval used to keep the overlay window near the cursor.
let cursorTracker: NodeJS.Timeout | null = null;

// Electron Screen instance used to read cursor position and display work areas.
let overlayScreen: Screen | null = null;

/**
 * Creates the translated-text overlay window.
 */
export async function createMouseCursorFollowerWindow(
	options: CreateMouseCursorFollowerWindowOptions,
): Promise<void> {
	overlayWindow = options.createBrowserWindow({
		...MOUSE_CURSOR_FOLLOWER_WINDOW_DIMENSIONS,
		frame: false,
		transparent: true,
		backgroundColor: '#00000000',
		resizable: false,
		movable: false,
		minimizable: false,
		maximizable: false,
		fullscreenable: false,
		focusable: false,
		skipTaskbar: true,
		hasShadow: false,
		show: false,
		webPreferences: createAppWebPreferences(options.preloadPath),
	});

	// The overlay should never steal focus or block clicks on the main app.
	overlayWindow.setIgnoreMouseEvents(true, { forward: true });
	overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
	overlayWindow.setAlwaysOnTop(true, 'screen-saver', 1);

	overlayWindow.once('ready-to-show', () => {
		// Position it once as soon as the renderer is ready.
		syncMouseCursorFollowerPosition();
	});

	overlayWindow.on('closed', () => {
		overlayWindow = null;
		stopMouseCursorFollowerTracking();
	});

	await options.loadRendererWindow(overlayWindow, OVERLAY_WINDOW_HASH);
}

/**
 * Closes the overlay window when it exists.
 */
export function closeMouseCursorFollowerWindow(): void {
	if (!overlayWindow || overlayWindow.isDestroyed()) {
		return;
	}

	overlayWindow.close();
}

/**
 * Binds main-process IPC that forwards translated text into the overlay window.
 */
export function bindMouseCursorFollowerIpcEvents(ipcMain: IpcMain): void {
	ipcMain.on(NATIVE_TRANSLATION_OUTPUT_IPC_CHANNEL, (_event, translationOutput: string) => {
		if (!translationOutput || !overlayWindow || overlayWindow.isDestroyed()) {
			return;
		}

		// Send the final translation into the overlay renderer, then reveal the window.
		overlayWindow.webContents.send(NATIVE_TRANSLATION_OUTPUT_IPC_CHANNEL, translationOutput);
		showMouseCursorFollowerWindow();
	});
}

/**
 * Starts polling the cursor position so the overlay follows the pointer.
 */
export function startMouseCursorFollowerTracking(screen: Screen): void {
	overlayScreen = screen;
	stopMouseCursorFollowerTracking();
	syncMouseCursorFollowerPosition();
	cursorTracker = setInterval(
		syncMouseCursorFollowerPosition,
		MOUSE_CURSOR_FOLLOWER_CURSOR_POLL_INTERVAL_MS,
	);
}

/**
 * Stops the cursor polling loop.
 */
export function stopMouseCursorFollowerTracking(): void {
	if (!cursorTracker) {
		return;
	}

	clearInterval(cursorTracker);
	cursorTracker = null;
}

/**
 * Binds the main-window preload bridge.
 * - DOM translation events from the shared webapp are forwarded into Electron IPC.
 */
export function bindMouseCursorFollowerMainWindowNativeEvents(ipcRenderer: IpcRenderer): void {
	window.addEventListener(NATIVE_TRANSLATION_OUTPUT_EVENT, (event: Event) => {
		if (!isNativeTranslationOutputEvent(event)) {
			return;
		}

		ipcRenderer.send(NATIVE_TRANSLATION_OUTPUT_IPC_CHANNEL, event.detail.translationOutput);
	});
}

/**
 * Binds the overlay-window preload bridge.
 * - IPC messages are turned back into the same DOM event used by the webapp.
 */
export function bindMouseCursorFollowerOverlayWindowNativeEvents(ipcRenderer: IpcRenderer): void {
	ipcRenderer.on(NATIVE_TRANSLATION_OUTPUT_IPC_CHANNEL, (_event, translationOutput: string) => {
		const nativeEvent = new CustomEvent<NativeTranslationOutputEventDetail>(NATIVE_TRANSLATION_OUTPUT_EVENT, {
			detail: {
				translationOutput,
			},
		});

		window.dispatchEvent(nativeEvent);
	});
}

/**
 * Validates that the DOM event carries translated text.
 */
function isNativeTranslationOutputEvent(event: Event): event is CustomEvent<NativeTranslationOutputEventDetail> {
	const detail = (event as CustomEvent<Partial<NativeTranslationOutputEventDetail>>).detail;
	return typeof detail?.translationOutput === 'string';
}

/**
 * Calculates the overlay position nearest to the cursor without leaving the display work area.
 */
function getMouseCursorFollowerPosition(cursorPoint: Point): Point {
	if (!overlayScreen) {
		return cursorPoint;
	}

	const display = overlayScreen.getDisplayNearestPoint(cursorPoint);
	const { x, y, width, height } = display.workArea;

	const nextX = Math.min(
		Math.max(cursorPoint.x + MOUSE_CURSOR_FOLLOWER_CURSOR_OFFSET.x, x),
		x + width - MOUSE_CURSOR_FOLLOWER_WINDOW_DIMENSIONS.width,
	);
	const nextY = Math.min(
		Math.max(cursorPoint.y + MOUSE_CURSOR_FOLLOWER_CURSOR_OFFSET.y, y),
		y + height - MOUSE_CURSOR_FOLLOWER_WINDOW_DIMENSIONS.height,
	);

	return { x: nextX, y: nextY };
}

/**
 * Moves the overlay window to the latest safe cursor position.
 */
function syncMouseCursorFollowerPosition(): void {
	if (!overlayWindow || overlayWindow.isDestroyed() || !overlayScreen) {
		return;
	}

	const cursorPoint = overlayScreen.getCursorScreenPoint();
	const nextPosition = getMouseCursorFollowerPosition(cursorPoint);
	const [currentX, currentY] = overlayWindow.getPosition();

	if (currentX === nextPosition.x && currentY === nextPosition.y) {
		return;
	}

	overlayWindow.setPosition(nextPosition.x, nextPosition.y, false);
}

/**
 * Shows the overlay window without stealing focus from the main app.
 */
function showMouseCursorFollowerWindow(): void {
	if (!overlayWindow || overlayWindow.isDestroyed()) {
		return;
	}

	syncMouseCursorFollowerPosition();
	overlayWindow.showInactive();
}
