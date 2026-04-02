import { app, BrowserWindow, screen } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
	app.quit();
}

const MAIN_WINDOW_DIMENSIONS = {
	width: 800,
	height: 600,
};

const OVERLAY_WINDOW_DIMENSIONS = {
	width: 220,
	height: 64,
};

const CURSOR_OFFSET = {
	x: 18,
	y: 20,
};

const CURSOR_POLL_INTERVAL_MS = 16;

let mainWindow: BrowserWindow | null = null;
let overlayWindow: BrowserWindow | null = null;
let cursorTracker: NodeJS.Timeout | null = null;

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

const getOverlayPosition = (cursorPoint: Electron.Point) => {
	const display = screen.getDisplayNearestPoint(cursorPoint);
	const { x, y, width, height } = display.workArea;

	const nextX = Math.min(
		Math.max(cursorPoint.x + CURSOR_OFFSET.x, x),
		x + width - OVERLAY_WINDOW_DIMENSIONS.width,
	);
	const nextY = Math.min(
		Math.max(cursorPoint.y + CURSOR_OFFSET.y, y),
		y + height - OVERLAY_WINDOW_DIMENSIONS.height,
	);

	return { x: nextX, y: nextY };
};

const syncOverlayPosition = () => {
	if (!overlayWindow || overlayWindow.isDestroyed()) {
		return;
	}

	const cursorPoint = screen.getCursorScreenPoint();
	const nextPosition = getOverlayPosition(cursorPoint);
	const [currentX, currentY] = overlayWindow.getPosition();

	if (currentX === nextPosition.x && currentY === nextPosition.y) {
		return;
	}

	overlayWindow.setPosition(nextPosition.x, nextPosition.y, false);
};

const stopCursorTracking = () => {
	if (!cursorTracker) {
		return;
	}

	clearInterval(cursorTracker);
	cursorTracker = null;
};

const startCursorTracking = () => {
	stopCursorTracking();
	syncOverlayPosition();
	cursorTracker = setInterval(syncOverlayPosition, CURSOR_POLL_INTERVAL_MS);
};

const createMainWindow = async () => {
	mainWindow = new BrowserWindow({
		...MAIN_WINDOW_DIMENSIONS,
		minWidth: 640,
		minHeight: 480,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
		},
	});

	mainWindow.on('closed', () => {
		mainWindow = null;

		if (overlayWindow && !overlayWindow.isDestroyed()) {
			overlayWindow.close();
		}
	});

	await loadRendererWindow(mainWindow);
};

const createOverlayWindow = async () => {
	overlayWindow = new BrowserWindow({
		...OVERLAY_WINDOW_DIMENSIONS,
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
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
		},
	});

	overlayWindow.setIgnoreMouseEvents(true, { forward: true });
	overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
	overlayWindow.setAlwaysOnTop(true, 'screen-saver', 1);

	overlayWindow.once('ready-to-show', () => {
		overlayWindow?.showInactive();
	});

	overlayWindow.on('closed', () => {
		overlayWindow = null;
		stopCursorTracking();
	});

	await loadRendererWindow(overlayWindow, 'overlay');
};

const createWindows = async () => {
	await createMainWindow();
	await createOverlayWindow();
	startCursorTracking();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
	void createWindows();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
	stopCursorTracking();

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
