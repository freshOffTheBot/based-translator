
/**
 * # ELECTRON MAIN
 * - Owns the Electron main-process startup flow.
 * - Creates the main window, creates the overlay window, and wires native IPC.
 * - Keeps the basic Electron app runnable even if optional feature folders are removed.
 */

import { app, BrowserWindow, ipcMain, Menu, screen } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { APP_MAIN_WINDOW_HEIGHT, APP_MAIN_WINDOW_MIN_HEIGHT, APP_MAIN_WINDOW_MIN_WIDTH, APP_MAIN_WINDOW_WIDTH } from './app/app.constant';
import { createAppWebPreferences } from './app/app.helper';
import { bindMouseCursorFollowerIpcEvents, closeMouseCursorFollowerWindow, createMouseCursorFollowerWindow, startMouseCursorFollowerTracking, stopMouseCursorFollowerTracking } from './common/mouseCursorFollower/mouseCursorFollower.service';


// Exit early during Windows install/uninstall events handled by squirrel startup.
if (started) {
	app.quit();
}


// Disable Electron's default application menu during main-process bootstrap.
// - Call this before app.on('ready') so Electron does not install its default application menu.
if (!MAIN_WINDOW_VITE_DEV_SERVER_URL) {
	Menu.setApplicationMenu(null);
}

// Single reference to the main app window while it is open.
let mainWindow: BrowserWindow | null = null;

/**
 * Resolves the packaged renderer HTML path used outside the Vite dev server.
 */
const getRendererEntryPoint = () =>
	path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`);

/**
 * Loads either the Vite dev URL or the packaged renderer file.
 * - `hash` is used to boot the overlay window instead of the main webapp route.
 */
const loadRendererWindow = async (
	window: BrowserWindow,
	hash?: string,
): Promise<void> => {
	if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
		const url = new URL(MAIN_WINDOW_VITE_DEV_SERVER_URL);

		if (hash) {
			url.hash = hash;
		}

		await window.loadURL(url.toString());
		return;
	}

	await window.loadFile(getRendererEntryPoint(), { hash });
};

/**
 * Creates the main Electron window that hosts the shared webapp.
 */
const createMainWindow = async () => {
	mainWindow = new BrowserWindow({
		width: APP_MAIN_WINDOW_WIDTH,
		height: APP_MAIN_WINDOW_HEIGHT,
		minWidth: APP_MAIN_WINDOW_MIN_WIDTH,
		minHeight: APP_MAIN_WINDOW_MIN_HEIGHT,
		webPreferences: createAppWebPreferences(path.join(__dirname, 'preload.js')),
	});

	mainWindow.on('closed', () => {
		// Clear the main window reference and close the optional overlay window too.
		mainWindow = null;
		closeMouseCursorFollowerWindow();
	});

	await loadRendererWindow(mainWindow);
};

/**
 * Creates all native windows needed by the app, then starts cursor tracking.
 */
const createWindows = async () => {
	await createMainWindow();
	await createMouseCursorFollowerWindow({
		createBrowserWindow: (windowOptions) => new BrowserWindow(windowOptions),
		loadRendererWindow,
		preloadPath: path.join(__dirname, 'preload.js'),
	});
	startMouseCursorFollowerTracking(screen);
};

// Wait for Electron to finish booting before touching browser-window APIs.
app.on('ready', () => {
	bindMouseCursorFollowerIpcEvents(ipcMain);
	void createWindows();
});

// Stop the overlay tracker for every platform.
// - On macOS, keep the app alive until the user quits explicitly.
app.on('window-all-closed', () => {
	stopMouseCursorFollowerTracking();

	if (process.platform !== 'darwin') {
		app.quit();
	}
});

// Re-create windows on macOS when the dock icon is clicked and no window is open.
app.on('activate', () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		void createWindows();
	}
});
