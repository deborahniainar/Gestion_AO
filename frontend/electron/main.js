const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

const isDev = process.env.NODE_ENV === 'development' || 
              process.defaultApp || 
              /node_modules[\\/]electron[\\/]/.test(process.execPath);

class AppManager {
    constructor() {
        this.mainWindow = null;
        this.splashWindow = null;
        this.backendProcess = null;
    }

    startBackend() {
        const env = { ...process.env };
        Object.keys(env).forEach(k => { if (k.startsWith('VITE_')) delete env[k]; });

        let backendPath;

        if (isDev) {
            // Dev : script Python
            backendPath = path.join(__dirname, "../../backend/run_backend.py");
            this.backendProcess = spawn(
                process.platform === "win32" ? "python" : "python3",
                [backendPath],
                { env, stdio: 'pipe' }
            );
        } else {
            // Prod : uniquement l'exe
            backendPath = path.join(process.resourcesPath, "backend", "run_backend.exe");
            const fs = require('fs');
            console.log("Spawning backend exe:", backendPath, "Exists?", fs.existsSync(backendPath));

            this.backendProcess = spawn(
                backendPath,
                [],
                { env, stdio: 'pipe', shell: true } // shell: true pour Windows
            );
        }

        this.backendProcess.stdout.on("data", data => console.log(`[BACKEND]: ${data}`));
        this.backendProcess.stderr.on("data", data => console.error(`[BACKEND ERROR]: ${data}`));
        this.backendProcess.on("close", code => console.log(`Backend exited with code ${code}`));
    }

    stopBackend() {
        if (this.backendProcess) {
            this.backendProcess.kill();
            this.backendProcess = null;
        }
    }

    waitForBackend(url = 'http://127.0.0.1:8000', interval = 11000, timeout = 120000) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const check = () => {
                http.get(url, () => resolve()).on('error', () => {
                    if (Date.now() - start > timeout) reject(new Error('Timeout backend'));
                    else setTimeout(check, interval);
                });
            };
            check();
        });
    }

    createSplashWindow() {
        this.splashWindow = new BrowserWindow({
            width: 400, height: 300, frame: false, show: false,
            webPreferences: { nodeIntegration: false, contextIsolation: true }
        });

        const splashHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { margin:0; padding:0; background: linear-gradient(135deg,#667eea 0%,#764ba2 100%);
                        color:white; font-family:-apple-system,BlinkMacSystemFont,sans-serif;
                        display:flex; flex-direction:column; justify-content:center; align-items:center; height:100vh; }
                    .logo { font-size:48px; font-weight:bold; margin-bottom:20px; }
                    .loading { font-size:16px; opacity:0.8; }
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
            width:1000, height:700, minWidth:800, minHeight:600, show:false, resizable:true,
            icon: path.join(__dirname, '../public/Logo-STC.png'),
            webPreferences: {
                nodeIntegration:false, contextIsolation:true, enableRemoteModule:false,
                preload: path.join(__dirname, 'preload.js'), webSecurity:true
            }
        });

        console.log('Mode développement:', isDev);

        if (isDev) {
            this.mainWindow.loadURL('http://localhost:5173');
            this.mainWindow.webContents.openDevTools();
        } else {
            this.mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
        }

        this.mainWindow.once('ready-to-show', () => {
            if (this.splashWindow) { this.splashWindow.close(); this.splashWindow=null; }
            this.mainWindow.show();
            this.mainWindow.focus();
        });

        this.mainWindow.on('closed', () => { this.mainWindow = null; });
        this.mainWindow.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action:'deny' }; });

        this.createMenu();
    }

    createMenu() {
        const template = [
            { label:'Fichier', submenu:[
                { label:'Actualiser', accelerator:'CmdOrCtrl+R', click:()=>this.mainWindow?.reload() },
                { type:'separator' },
                { label:'Quitter', accelerator:process.platform==='darwin'?'Cmd+Q':'Ctrl+Q', click:()=>app.quit() }
            ]},
            { label:'Affichage', submenu:[
                { role:'reload', label:'Recharger' },
                { role:'forceReload', label:'Recharger (forcé)' },
                { role:'toggleDevTools', label:'Outils de développement' },
                { type:'separator' },
                { role:'resetZoom', label:'Zoom normal' },
                { role:'zoomIn', label:'Zoom avant' },
                { role:'zoomOut', label:'Zoom arrière' },
                { type:'separator' },
                { role:'togglefullscreen', label:'Plein écran' }
            ]},
            { label:'Fenêtre', submenu:[
                { role:'minimize', label:'Réduire' },
                { role:'close', label:'Fermer' }
            ]},
            { label:'Aide', submenu:[
                { label:'À propos', click:()=>dialog.showMessageBox(this.mainWindow, { 
                    type:'info', title:'À propos', message:'Gestion AO', detail:'Application de gestion d\'appels d\'offres\nVersion 1.0.0' 
                })}
            ]}
        ];
        Menu.setApplicationMenu(Menu.buildFromTemplate(template));
    }
}

// --- Initialisation ---
const appManager = new AppManager();

app.whenReady().then(async ()=>{
    appManager.createSplashWindow();
    appManager.startBackend();

    try {
        // Allow overriding the wait interval and timeout via environment variables
        const waitInterval = Number(process.env.BACKEND_WAIT_INTERVAL) || 1000; // ms between checks
        const waitTimeout = Number(process.env.BACKEND_WAIT_TIMEOUT) || 60000;  // total timeout in ms
        console.log(`Waiting for backend at http://127.0.0.1:8000 (interval=${waitInterval}ms, timeout=${waitTimeout}ms)`);
        await appManager.waitForBackend('http://127.0.0.1:8000', waitInterval, waitTimeout);
        appManager.createMainWindow();
    } catch(err) {
        console.error('Backend failed to start:', err);
        dialog.showErrorBox('Erreur','Le backend n’a pas démarré à temps.');
        app.quit();
    }

    app.on('activate', ()=>{ if (BrowserWindow.getAllWindows().length===0) appManager.createMainWindow(); });
});

app.on('window-all-closed', ()=>{
    appManager.stopBackend();
    if(process.platform!=='darwin') app.quit();
});

ipcMain.handle('app-version',()=>app.getVersion());
ipcMain.handle('show-message-box', async (e,opt)=>dialog.showMessageBox(appManager.mainWindow,opt));
ipcMain.handle('show-save-dialog', async (e,opt)=>dialog.showSaveDialog(appManager.mainWindow,opt));
ipcMain.handle('show-open-dialog', async (e,opt)=>dialog.showOpenDialog(appManager.mainWindow,opt));
