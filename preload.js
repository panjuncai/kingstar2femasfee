const { contextBridge, ipcRenderer } = require('electron');

// 添加一些调试信息
console.log('Preload script is running');

// 向渲染进程暴露API
contextBridge.exposeInMainWorld('electronAPI', {
  importExcel: () => {
    console.log('调用importExcel方法');
    return ipcRenderer.invoke('import-excel');
  },
  queryExchangeFees: () => {
    console.log('调用queryExchangeFees方法');
    return ipcRenderer.invoke('query-exchange-fees');
  },
  clearExchangeFees: () => {
    console.log('调用clearExchangeFees方法');
    return ipcRenderer.invoke('clear-exchange-fees');
  },
  readReadme: () => {
    console.log('调用readReadme方法');
    return ipcRenderer.invoke('read-readme');
  },
  // 添加执行SQL的调试函数
  execSql: (sql) => {
    console.log('调用execSql方法:', sql);
    return ipcRenderer.invoke('exec-sql', sql);
  },
});
