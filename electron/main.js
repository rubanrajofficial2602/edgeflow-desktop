const { app, BrowserWindow, Menu, shell, ipcMain, dialog, net } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");

// ── App config ────────────────────────────────────────────────────────────────
// EDGEFLOW_URL env var overrides everything (set in GitHub Actions secrets for custom domains)
const APP_URL = process.env.EDGEFLOW_URL
  || "https://edgeflow-erp.rubanrajofficial2602.replit.app/";
const IS_DEV  = !app.isPackaged;

// Offline fallback HTML shown when no internet connection
const OFFLINE_HTML = `data:text/html;charset=utf-8,
<!DOCTYPE html><html>
<head><meta charset="utf-8"><title>EdgeFlow ERP — Offline</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#060B14;color:#fff;font-family:system-ui,sans-serif;
       display:flex;flex-direction:column;align-items:center;justify-content:center;
       height:100vh;gap:24px;text-align:center;padding:32px}
  .logo{font-size:64px;margin-bottom:8px}
  h1{font-size:28px;font-weight:800;background:linear-gradient(135deg,#7c3aed,#db2777);
     -webkit-background-clip:text;-webkit-text-fill-color:transparent}
  p{color:#94a3b8;font-size:16px;max-width:420px;line-height:1.6}
  button{margin-top:8px;padding:12px 32px;background:linear-gradient(135deg,#7c3aed,#db2777);
         border:none;border-radius:12px;color:#fff;font-size:15px;font-weight:700;
         cursor:pointer;border-radius:12px}
  .status{font-size:13px;color:#475569;margin-top:4px}
</style></head>
<body>
  <div class="logo">⚡</div>
  <h1>EdgeFlow ERP</h1>
  <p>No internet connection detected. EdgeFlow ERP requires internet access to sync your data and GST filings.</p>
  <button onclick="location.reload()">🔄 Retry Connection</button>
  <p class="status">Loading from: ${APP_URL}</p>
</body></html>`;


let mainWindow = null;

// ── Single-instance lock ──────────────────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// ── Create main window ────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    title: "EdgeFlow ERP",
    backgroundColor: "#060B14",
    icon: getAppIcon(),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      spellcheck: true,
    },
    show: false,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
  });

  // Show splash then load
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    if (IS_DEV) mainWindow.webContents.openDevTools({ mode: "detach" });
  });

  // Load app with offline fallback
  if (net.isOnline()) {
    mainWindow.loadURL(APP_URL);
  } else {
    mainWindow.loadURL(OFFLINE_HTML);
  }

  // If page fails to load (DNS error, server down) — show offline screen
  mainWindow.webContents.on("did-fail-load", (event, errorCode, errorDescription) => {
    if (errorCode < -100) { // Network errors
      mainWindow.loadURL(OFFLINE_HTML);
    }
  });

  // Reconnect when internet comes back
  mainWindow.webContents.on("did-finish-load", () => {
    // Check if we're showing the offline page and connection is restored
    mainWindow.webContents.executeJavaScript(
      `document.title`
    ).then(title => {
      if (title.includes("Offline") && net.isOnline()) {
        mainWindow.loadURL(APP_URL);
      }
    }).catch(() => {});
  });

  // Open external links in browser, not in the app
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(APP_URL) && !url.startsWith("data:")) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  mainWindow.on("closed", () => { mainWindow = null; });

  buildMenu();
}

// ── App icon helper ───────────────────────────────────────────────────────────
function getAppIcon() {
  if (process.platform === "win32")  return path.join(__dirname, "../build/icon.ico");
  if (process.platform === "darwin") return path.join(__dirname, "../build/icon.icns");
  return path.join(__dirname, "../build/icon.png");
}

// ── Native menu ───────────────────────────────────────────────────────────────
function buildMenu() {
  const isMac = process.platform === "darwin";
  const template = [
    ...(isMac ? [{
      label: "EdgeFlow ERP",
      submenu: [
        { role: "about" },
        { type: "separator" },
        { role: "services" },
        { type: "separator" },
        { role: "hide" },
        { role: "hideOthers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit" },
      ],
    }] : []),
    {
      label: "File",
      submenu: [
        {
          label: "New Invoice",
          accelerator: "CmdOrCtrl+N",
          click: () => mainWindow?.loadURL(`${APP_URL}#/invoices/new`),
        },
        { type: "separator" },
        { role: isMac ? "close" : "quit" },
      ],
    },
    {
      label: "Navigate",
      submenu: [
        { label: "Dashboard",   accelerator: "CmdOrCtrl+1", click: () => mainWindow?.loadURL(`${APP_URL}#/dashboard`) },
        { label: "Invoices",    accelerator: "CmdOrCtrl+2", click: () => mainWindow?.loadURL(`${APP_URL}#/invoices`) },
        { label: "GST Returns", accelerator: "CmdOrCtrl+3", click: () => mainWindow?.loadURL(`${APP_URL}#/gst`) },
        { label: "Inventory",   accelerator: "CmdOrCtrl+4", click: () => mainWindow?.loadURL(`${APP_URL}#/inventory`) },
        { label: "Reports",     accelerator: "CmdOrCtrl+5", click: () => mainWindow?.loadURL(`${APP_URL}#/reports`) },
        { label: "Settings",    accelerator: "CmdOrCtrl+,", click: () => mainWindow?.loadURL(`${APP_URL}#/settings`) },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
        ...( IS_DEV ? [{ type: "separator" }, { role: "toggleDevTools" }] : [] ),
      ],
    },
    {
      label: "Help",
      submenu: [
        { label: "EdgeFlow Documentation", click: () => shell.openExternal("https://edgeflow.in/docs") },
        { label: "Support",                click: () => shell.openExternal("mailto:support@edgeflow.in") },
        { type: "separator" },
        {
          label: "Check for Updates…",
          click: () => autoUpdater.checkForUpdatesAndNotify(),
        },
        { type: "separator" },
        { label: `Version ${app.getVersion()}`, enabled: false },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ── Auto-updater ──────────────────────────────────────────────────────────────
function initAutoUpdater() {
  autoUpdater.autoDownload = false;

  autoUpdater.on("update-available", (info) => {
    dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "Update Available",
      message: `EdgeFlow ERP v${info.version} is available. Download now?`,
      buttons: ["Download", "Later"],
    }).then(({ response }) => {
      if (response === 0) autoUpdater.downloadUpdate();
    });
  });

  autoUpdater.on("update-downloaded", () => {
    dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "Update Ready",
      message: "Restart EdgeFlow ERP to install the update.",
      buttons: ["Restart Now", "Later"],
    }).then(({ response }) => {
      if (response === 0) autoUpdater.quitAndInstall();
    });
  });

  autoUpdater.checkForUpdatesAndNotify().catch(() => {});
}

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow();
  if (!IS_DEV) initAutoUpdater();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// ── IPC handlers ──────────────────────────────────────────────────────────────
ipcMain.handle("get-app-version", () => app.getVersion());
ipcMain.handle("get-platform",    () => process.platform);
ipcMain.handle("open-external",   (_, url) => shell.openExternal(url));
