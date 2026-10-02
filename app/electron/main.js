const { app, BrowserWindow, globalShortcut, screen } = require("electron");
const path = require("path");

let mainWindow;
let hiddenByShortcut = false;

function showWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createWindow();
  }

  mainWindow.setAlwaysOnTop(true, "floating");
  mainWindow.show();
  mainWindow.moveTop();
  mainWindow.focus();
}

function toggleWindow() {
  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible()) {
    hiddenByShortcut = true;
    mainWindow.setAlwaysOnTop(false);
    mainWindow.hide();
    return;
  }
  hiddenByShortcut = false;
  showWindow();
}

if (process.platform === "darwin") {
  app.setActivationPolicy("accessory");
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: true,
    skipTaskbar: true,

    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const area = screen.getPrimaryDisplay().workArea;
  mainWindow.setPosition(
    Math.round(area.x + (area.width - 1400) / 2),
    Math.round(area.y + (area.height - 900) / 2),
  );
  mainWindow.on("hide", () => {
    if (!hiddenByShortcut && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
    }
  });
  mainWindow.loadURL("http://127.0.0.1:3002");
  mainWindow.setContentProtection(true);
  if (process.platform === "darwin") {
    mainWindow.setHiddenInMissionControl(true);
    mainWindow.excludedFromShownWindowsMenu = true;
    app.dock?.hide();
  }
}


app.whenReady().then(() => {
  createWindow();
  const shortcut =
    process.platform === "darwin"
      ? "Command+Shift+O"
      : "Alt+Shift+O";

  const registered = globalShortcut.register(shortcut, toggleWindow);
  if (!registered) {
    console.error(`${shortcut} could not be registered.`);
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});