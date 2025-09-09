const { contextBridge, ipcRenderer } = require('electron');

// Exposer des APIs sécurisées au processus de rendu
contextBridge.exposeInMainWorld('electronAPI', {
    // Informations de l'application
    getAppVersion: () => ipcRenderer.invoke('app-version'),
    
    // Boîtes de dialogue
    showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
    showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
    showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
    
    // Événements de l'application
    onAppReady: (callback) => {
        ipcRenderer.on('app-ready', callback);
    },
    
    // Fonctions utilitaires pour l'interface
    platform: process.platform,
    isElectron: true,
    
    // Gestion des notifications (optionnel)
    showNotification: (title, body) => {
        if ('Notification' in window) {
            new Notification(title, { body });
        }
    }
});

// Ajouter des styles spécifiques à Electron si nécessaire
window.addEventListener('DOMContentLoaded', () => {
    // Ajouter une classe CSS pour identifier l'environnement Electron
    document.body.classList.add('electron-app');
    
    // Désactiver le menu contextuel par défaut (optionnel)
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
    
    // Gérer les raccourcis clavier
    document.addEventListener('keydown', (e) => {
        // Bloquer F12 en production (garder les DevTools en développement)
        if (e.key === 'F12' && process.env.NODE_ENV !== 'development') {
            e.preventDefault();
        }
        
        // Bloquer Ctrl+Shift+I en production
        if (e.ctrlKey && e.shiftKey && e.key === 'I' && process.env.NODE_ENV !== 'development') {
            e.preventDefault();
        }
    });
});

// Logger pour le débogage (uniquement en développement)
if (process.env.NODE_ENV === 'development') {
    window.electronAPI.log = (message) => {
        console.log('[Electron Preload]:', message);
    };
}
