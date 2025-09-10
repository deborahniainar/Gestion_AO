const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

const isDev = process.env.NODE_ENV === 'development' || 
              process.env.ELECTRON_IS_DEV === '1' || 
              process.defaultApp || 
              /node_modules[\\/]electron[\\/]/.test(process.execPath);

class AppManager {
    constructor() {
        this.mainWindow = null;
        this.splashWindow = null;
        this.backendProcess = null;
    }

    startBackend() {
        // Nettoyer les variables vite_* pour que le backend Pydantic ne plante pas
        const env = { ...process.env };
        Object.keys(env).forEach(k => {
            if (k.startsWith('VITE_')) delete env[k];
        });

        let backendPath;
        let options = { env };


        if (process.platform === "win32") {
            // 🔹 Windows → utiliser l'exe packagé
            backendPath = path.join(__dirname, "../../backend/dist/run_backend.exe");
            console.log("Démarrage du backend (Windows exe):", backendPath);
            options.shell = true;
            this.backendProcess = spawn(backendPath, [], options);
        } else {
            // Sur Linux/Mac → utiliser Python
            backendPath = path.join(__dirname, "../../backend/run_backend.py");
            console.log("Démarrage du backend (Python script):", backendPath);
            this.backendProcess = spawn("python3", [backendPath], options);
        }

        this.backendProcess.stdout.on("data", (data) => {
            console.log(`[BACKEND]: ${data}`);
        });

        this.backendProcess.stderr.on("data", (data) => {
            console.error(`[BACKEND ERROR]: ${data}`);
        });

        this.backendProcess.on("close", (code) => {
            console.log(`Backend exited with code ${code}`);
        });
    }

    waitForBackend(url = 'http://127.0.0.1:8000', interval = 1000, timeout = 20000) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const check = () => {
                http.get(url, (res) => {
                    resolve();
                }).on('error', () => {
                    if (Date.now() - start > timeout) {
                        reject(new Error('Timeout backend'));
                    } else {
                        setTimeout(check, interval);
                    }
                });
            };
            check();
        });
    }

    createSplashWindow() {
        this.splashWindow = new BrowserWindow({
            width: 400,
            height: 300,
            frame: false,
            show: false,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true
            }
        });

        const splashHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        margin: 0;
                        padding: 0;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                    }
                    .logo { font-size: 48px; font-weight: bold; margin-bottom: 20px; }
                    .loading { font-size: 16px; opacity: 0.8; }
                </style>
            </head>
            <body>
                <div class="logo">Gestion AO</div>
                <div class="loading">Chargement...</div>
            </body>
            </html>
        `;

        this.splashWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(splashHtml)}`);
        this.splashWindow.once('ready-to-show', () => this.splashWindow.show());
    }

    async createMainWindow() {
        this.mainWindow = new BrowserWindow({
            width: 1000,
            height: 700,
            minWidth: 800,
            minHeight: 600,
            show: false,
            resizable: true,
            icon: path.join(__dirname, '../public/Logo-STC.png'),
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                enableRemoteModule: false,
                preload: path.join(__dirname, 'preload.js'),
                webSecurity: true
            }
        });

        console.log('Mode développement:', isDev);

        if (isDev) {
            console.log('Chargement en mode développement: http://localhost:5173');
            this.mainWindow.loadURL('http://localhost:5173');
            this.mainWindow.webContents.openDevTools();
        } else {
            console.log('Chargement en mode production: dist/index.html');
            this.mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
        }

        this.mainWindow.once('ready-to-show', () => {
            if (this.splashWindow) {
                this.splashWindow.close();
                this.splashWindow = null;
            }
            this.mainWindow.show();
            this.mainWindow.focus();
        });

        this.mainWindow.on('closed', () => { this.mainWindow = null; });
        this.mainWindow.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
        this.createMenu();
    }

    createMenu() {
        const template = [
            { label: 'Fichier', submenu: [
                { label: 'Actualiser', accelerator: 'CmdOrCtrl+R', click: () => this.mainWindow?.reload() },
                { type: 'separator' },
                { label: 'Quitter', accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q', click: () => app.quit() }
            ]},
            { label: 'Affichage', submenu: [
                { role: 'reload', label: 'Recharger' },
                { role: 'forceReload', label: 'Recharger (forcé)' },
                { role: 'toggleDevTools', label: 'Outils de développement' },
                { type: 'separator' },
                { role: 'resetZoom', label: 'Zoom normal' },
                { role: 'zoomIn', label: 'Zoom avant' },
                { role: 'zoomOut', label: 'Zoom arrière' },
                { type: 'separator' },
                { role: 'togglefullscreen', label: 'Plein écran' }
            ]},
            { label: 'Fenêtre', submenu: [
                { role: 'minimize', label: 'Réduire' },
                { role: 'close', label: 'Fermer' }
            ]},
            { label: 'Aide', submenu: [
                { label: 'À propos', click: () => dialog.showMessageBox(this.mainWindow, { type: 'info', title: 'À propos', message: 'Gestion AO', detail: 'Application de gestion d\'appels d\'offres\nVersion 1.0.0' }) }
            ]}
        ];
        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
    }
}

// --- Initialisation de l'app ---
const appManager = new AppManager();

app.whenReady().then(async () => {
    appManager.createSplashWindow();
    appManager.startBackend();

    try {
        await appManager.waitForBackend('http://127.0.0.1:8000', 500, 20000);
        appManager.createMainWindow();
    } catch (err) {
        console.error('Backend failed to start:', err);
        dialog.showErrorBox('Erreur', 'Le backend n’a pas démarré à temps.');
        app.quit();
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) appManager.createMainWindow();
    });
});


app.on('window-all-closed', () => {
    appManager.stopBackend();
    if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('app-version', () => app.getVersion());
ipcMain.handle('show-message-box', async (event, options) => dialog.showMessageBox(appManager.mainWindow, options));
ipcMain.handle('show-save-dialog', async (event, options) => dialog.showSaveDialog(appManager.mainWindow, options));
ipcMain.handle('show-open-dialog', async (event, options) => dialog.showOpenDialog(appManager.mainWindow, options));
