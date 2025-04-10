const { BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');

class MainWindow {
  constructor() {
    this.window = null;
  }

  create(isDev) {
    const preloadPath = path.join(__dirname, '../preload/index.js');
    this.window = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: preloadPath,
      },
    });

    const startUrl = isDev
      ? process.env.DEV_SERVER
      : url.format({
          pathname: path.join(__dirname, '../../../dist/index.html'),
          protocol: 'file:',
          slashes: true,
        });

    this.window.loadURL(startUrl);

    if (isDev) {
      this.window.webContents.openDevTools();
    }
  }
}

module.exports = new MainWindow();
