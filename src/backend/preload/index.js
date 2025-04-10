const { contextBridge, ipcRenderer } = require('electron');

// 向渲染进程暴露API
contextBridge.exposeInMainWorld('electronAPI', {
  importExcel: () => {
    return ipcRenderer.invoke('import-excel');
  },
  queryExchangeFees: () => {
    return ipcRenderer.invoke('query-exchange-fees');
  },
  clearExchangeTradeFee: () => {
    return ipcRenderer.invoke('clear-exchange-trade-fee');
  },
  readReadme: () => {
    return ipcRenderer.invoke('read-readme');
  },
  execSql: (sql) => {
    return ipcRenderer.invoke('exec-sql', sql);
  },
});
