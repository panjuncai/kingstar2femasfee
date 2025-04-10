const { app } = require('electron');
const isDev = process.env.NODE_ENV === 'development';
const dbInstance = require('./src/backend/database');
const mainWindow = require('./src/backend/window');
const ipcHandlers = require('./src/backend/ipc');
app.on('ready', async () => {
  const userDataPath = isDev
    ? '/Users/panjc/Documents/Project/kingstar2femasfee'
    : app.getPath('userData');
  await dbInstance.init(userDataPath);
  if (!dbInstance.db) {
    throw new Error('数据库未初始化');
  }
  mainWindow.create(isDev);
  ipcHandlers.register();
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (!mainWindow.window) {
    mainWindow.create(isDev);
  }
});

// 应用关闭时保存数据库
app.on('will-quit', () => {
  if (dbInstance) {
    dbInstance.cleanup();
  }
});
