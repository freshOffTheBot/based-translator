import { NATIVE_TRANSLATION_OUTPUT_EVENT } from '../../../../01_webapp/common/native-event/native-event.constant';
import type { NativeTranslationOutputEventDetail } from '../../../../01_webapp/common/native-event/native-event.model';
import { NATIVE_TRANSLATION_OUTPUT_IPC_CHANNEL, OVERLAY_WINDOW_HASH } from '../../app/app.constant';
import { createAppWebPreferences } from '../../app/app.helper';
import { MOUSE_CURSOR_FOLLOWER_CURSOR_OFFSET, MOUSE_CURSOR_FOLLOWER_CURSOR_POLL_INTERVAL_MS, MOUSE_CURSOR_FOLLOWER_WINDOW_DIMENSIONS } from './mouseCursorFollower.constant';
import type { BrowserWindow, BrowserWindowConstructorOptions, IpcMain, IpcRenderer, Point, Screen } from 'electron';


/**
 * # MOUSE CURSOR FOLLOWER SERVICE
 * - Owns the Electron overlay window and cursor tracking state.
 * - Bridges translated text between Electron IPC and DOM CustomEvents.
 */


interface CreateMouseCursorFollowerWindowOptions {
	createBrowserWindow: (options: BrowserWindowConstructorOptions) => BrowserWindow;
	loadRendererWindow: (window: BrowserWindow, hash?: string) => Promise<void>;
	preloadPath: string;
}

let overlayWindow: BrowserWindow | null = null;
let cursorTracker: NodeJS.Timeout | null = null;
let overlayScreen: Screen | null = null;

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

	overlayWindow.setIgnoreMouseEvents(true, { forward: true });
	overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
	overlayWindow.setAlwaysOnTop(true, 'screen-saver', 1);

	overlayWindow.once('ready-to-show', () => {
		syncMouseCursorFollowerPosition();
	});

	overlayWindow.on('closed', () => {
		overlayWindow = null;
		stopMouseCursorFollowerTracking();
	});

	await options.loadRendererWindow(overlayWindow, OVERLAY_WINDOW_HASH);
}

export function closeMouseCursorFollowerWindow(): void {
	if (!overlayWindow || overlayWindow.isDestroyed()) {
		return;
	}

	overlayWindow.close();
}

export function bindMouseCursorFollowerIpcEvents(ipcMain: IpcMain): void {
	ipcMain.on(NATIVE_TRANSLATION_OUTPUT_IPC_CHANNEL, (_event, translationOutput: string) => {
		if (!translationOutput || !overlayWindow || overlayWindow.isDestroyed()) {
			return;
		}

		overlayWindow.webContents.send(NATIVE_TRANSLATION_OUTPUT_IPC_CHANNEL, translationOutput);
		showMouseCursorFollowerWindow();
	});
}

export function startMouseCursorFollowerTracking(screen: Screen): void {
	overlayScreen = screen;
	stopMouseCursorFollowerTracking();
	syncMouseCursorFollowerPosition();
	cursorTracker = setInterval(
		syncMouseCursorFollowerPosition,
		MOUSE_CURSOR_FOLLOWER_CURSOR_POLL_INTERVAL_MS,
	);
}

export function stopMouseCursorFollowerTracking(): void {
	if (!cursorTracker) {
		return;
	}

	clearInterval(cursorTracker);
	cursorTracker = null;
}

export function bindMouseCursorFollowerMainWindowNativeEvents(ipcRenderer: IpcRenderer): void {
	window.addEventListener(NATIVE_TRANSLATION_OUTPUT_EVENT, (event: Event) => {
		if (!isNativeTranslationOutputEvent(event)) {
			return;
		}

		ipcRenderer.send(NATIVE_TRANSLATION_OUTPUT_IPC_CHANNEL, event.detail.translationOutput);
	});
}

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

function isNativeTranslationOutputEvent(event: Event): event is CustomEvent<NativeTranslationOutputEventDetail> {
	const detail = (event as CustomEvent<Partial<NativeTranslationOutputEventDetail>>).detail;
	return typeof detail?.translationOutput === 'string';
}

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

function showMouseCursorFollowerWindow(): void {
	if (!overlayWindow || overlayWindow.isDestroyed()) {
		return;
	}

	syncMouseCursorFollowerPosition();
	overlayWindow.showInactive();
}
