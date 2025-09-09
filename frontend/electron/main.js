const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');

// Meilleure détection de l'environnement de développement
const isDev = process.env.NODE_ENV === 'development' || 
              process.env.ELECTRON_IS_DEV === '1' || 
              process.defaultApp || 
              /node_modules[\\/]electron[\\/]/.test(process.execPath);

class AppManager {
    constructor() {
        this.mainWindow = null;
        this.splashWindow = null;
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
                    .logo {
                        font-size: 48px;
                        font-weight: bold;
                        margin-bottom: 20px;
                    }
                    .loading {
                        font-size: 16px;
                        opacity: 0.8;
                    }
                </style>
            </head>
            <body>
                <div class="logo">Gestion AO</div>
                <div class="loading">Chargement...</div>
            </body>
            </html>
        `;

        this.splashWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(splashHtml)}`);
        
        this.splashWindow.once('ready-to-show', () => {
            this.splashWindow.show();
        });
    }

    createMainWindow() {
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

        // Charger l'application
        console.log('Mode développement:', isDev);
        
        if (isDev) {
            console.log('Chargement en mode développement: http://localhost:5173');
            this.mainWindow.loadURL('http://localhost:5173');
            this.mainWindow.webContents.openDevTools();
            
            // Gérer les erreurs de chargement
            this.mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
                console.error('Erreur de chargement:', errorCode, errorDescription, validatedURL);
                // Essayer de recharger après 2 secondes
                setTimeout(() => {
                    console.log('Tentative de rechargement...');
                    this.mainWindow.loadURL('http://localhost:5173');
                }, 2000);
            });
        } else {
            console.log('Chargement en mode production: dist/index.html');
            this.mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
        }

        // Gérer l'événement ready-to-show
        this.mainWindow.once('ready-to-show', () => {
            if (this.splashWindow) {
                this.splashWindow.close();
                this.splashWindow = null;
            }
            this.mainWindow.show();
            this.mainWindow.focus();
        });

        // Gérer la fermeture de la fenêtre
        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
        });

        // Intercepter les liens externes
        this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
            shell.openExternal(url);
            return { action: 'deny' };
        });

        // Créer le menu de l'application
        this.createMenu();
    }

    createMenu() {
        const template = [
            {
                label: 'Fichier',
                submenu: [
                    {
                        label: 'Actualiser',
                        accelerator: 'CmdOrCtrl+R',
                        click: () => {
                            if (this.mainWindow) {
                                this.mainWindow.reload();
                            }
                        }
                    },
                    { type: 'separator' },
                    {
                        label: 'Quitter',
                        accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                        click: () => {
                            app.quit();
                        }
                    }
                ]
            },
            {
                label: 'Affichage',
                submenu: [
                    { role: 'reload', label: 'Recharger' },
                    { role: 'forceReload', label: 'Recharger (forcé)' },
                    { role: 'toggleDevTools', label: 'Outils de développement' },
                    { type: 'separator' },
                    { role: 'resetZoom', label: 'Zoom normal' },
                    { role: 'zoomIn', label: 'Zoom avant' },
                    { role: 'zoomOut', label: 'Zoom arrière' },
                    { type: 'separator' },
                    { role: 'togglefullscreen', label: 'Plein écran' }
                ]
            },
            {
                label: 'Fenêtre',
                submenu: [
                    { role: 'minimize', label: 'Réduire' },
                    { role: 'close', label: 'Fermer' }
                ]
            },
            {
                label: 'Aide',
                submenu: [
                    {
                        label: 'À propos',
                        click: () => {
                            dialog.showMessageBox(this.mainWindow, {
                                type: 'info',
                                title: 'À propos',
                                message: 'Gestion AO',
                                detail: 'Application de gestion d\'appels d\'offres\\nVersion 1.0.0'
                            });
                        }
                    }
                ]
            }
        ];

        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
    }
}

// Instance globale du gestionnaire d'application
const appManager = new AppManager();

// Événements de l'application
app.whenReady().then(() => {
    appManager.createSplashWindow();
    
    // Attendre un peu avant de créer la fenêtre principale
    setTimeout(() => {
        appManager.createMainWindow();
    }, 1500);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            appManager.createMainWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Gestion IPC pour la communication avec le renderer
ipcMain.handle('app-version', () => {
    return app.getVersion();
});

ipcMain.handle('show-message-box', async (event, options) => {
    const result = await dialog.showMessageBox(appManager.mainWindow, options);
    return result;
});

ipcMain.handle('show-save-dialog', async (event, options) => {
    const result = await dialog.showSaveDialog(appManager.mainWindow, options);
    return result;
});

ipcMain.handle('show-open-dialog', async (event, options) => {
    const result = await dialog.showOpenDialog(appManager.mainWindow, options);
    return result;
});
