import { app, BrowserWindow, ipcMain, Menu, screen } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { APP_MAIN_WINDOW_HEIGHT, APP_MAIN_WINDOW_MIN_HEIGHT, APP_MAIN_WINDOW_MIN_WIDTH, APP_MAIN_WINDOW_WIDTH } from './app/app.constant';
import { bindMouseCursorFollowerIpcEvents, closeMouseCursorFollowerWindow, createMouseCursorFollowerWindow, startMouseCursorFollowerTracking, stopMouseCursorFollowerTracking } from './common/mouseCursorFollower/mouseCursorFollower.service';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
	app.quit();
}


// Disable Electron's default application menu during main-process bootstrap.
// - Call this before app.on('ready') so Electron does not install its default application menu.
if (!MAIN_WINDOW_VITE_DEV_SERVER_URL) {
	Menu.setApplicationMenu(null);
}

let mainWindow: BrowserWindow | null = null;

const getRendererEntryPoint = () =>
	path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`);

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

const createMainWindow = async () => {
	mainWindow = new BrowserWindow({
		width: APP_MAIN_WINDOW_WIDTH,
		height: APP_MAIN_WINDOW_HEIGHT,
		minWidth: APP_MAIN_WINDOW_MIN_WIDTH,
		minHeight: APP_MAIN_WINDOW_MIN_HEIGHT,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
		},
	});

	mainWindow.on('closed', () => {
		mainWindow = null;
		closeMouseCursorFollowerWindow();
	});

	await loadRendererWindow(mainWindow);
};

const createWindows = async () => {
	await createMainWindow();
	await createMouseCursorFollowerWindow({
		createBrowserWindow: (windowOptions) => new BrowserWindow(windowOptions),
		loadRendererWindow,
		preloadPath: path.join(__dirname, 'preload.js'),
	});
	startMouseCursorFollowerTracking(screen);
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
	bindMouseCursorFollowerIpcEvents(ipcMain);
	void createWindows();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
	stopMouseCursorFollowerTracking();

	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (BrowserWindow.getAllWindows().length === 0) {
		void createWindows();
	}
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
