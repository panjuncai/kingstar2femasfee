const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs-extra');
const initSqlJs = require('sql.js');
const XLSX = require('xlsx');
const isDev = process.env.NODE_ENV === 'development';

// 在app ready事件中初始化数据库
let db;
let SQL;

app.on('ready', () => {
  createWindow();
  initDatabase();
});

async function initDatabase() {
  try {
    // 加载 SQL.js
    SQL = await initSqlJs();
    console.log('SQL.js 已加载');

    // 设置数据库路径
    const userDataPath = '/Users/panjc/Documents/Project/kingstar2femasfee';
    console.log('应用数据目录:', userDataPath);

    const dbDir = path.join(userDataPath, 'db');
    console.log('数据库目录:', dbDir);

    if (!fs.existsSync(dbDir)) {
      console.log('数据库目录不存在，尝试创建');
      fs.mkdirSync(dbDir, { recursive: true });
      console.log('成功创建数据库目录');
    }

    const dbPath = path.join(dbDir, 'kingstar2femasfee.db');
    console.log('数据库文件路径:', dbPath);

    // 尝试加载现有数据库或创建新数据库
    console.log('尝试连接数据库...');
    if (fs.existsSync(dbPath)) {
      try {
        const filebuffer = fs.readFileSync(dbPath);
        db = new SQL.Database(filebuffer);
        console.log('已加载现有数据库文件');
      } catch (err) {
        console.error('加载现有数据库失败，创建新数据库:', err);
        db = new SQL.Database();
        console.log('已创建新的数据库实例');
      }
    } else {
      db = new SQL.Database();
      console.log('已创建新的数据库实例');
    }

    // 创建表
    createTables();

    // 定期保存数据库到文件
    setInterval(() => saveDatabase(dbPath), 10000);
  } catch (err) {
    console.error('数据库初始化错误:', err.message);
    console.error('错误详情:', err);
  }
}

// 保存数据库到文件
function saveDatabase(dbPath) {
  try {
    if (db) {
      const data = db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(dbPath, buffer);
      console.log('数据库已保存到文件');
    }
  } catch (err) {
    console.error('保存数据库失败:', err);
  }
}

// 创建必要的表
function createTables() {
  try {
    db.exec(`CREATE TABLE IF NOT EXISTS t_exchange_trade_fee (
      exch_code TEXT NOT NULL,
      product_type TEXT NOT NULL,
      product_id TEXT,
      instrument_id TEXT NOT NULL,
      open_amt DECIMAL(10,2) DEFAULT 0.00,
      open_rate DECIMAL(10,2) DEFAULT 0.00,
      PRIMARY KEY (exch_code, product_type, product_id, instrument_id)
    )`);
    console.log('表已创建或已存在');
  } catch (err) {
    console.error('创建表失败:', err.message);
  }
}

let mainWindow;

function createWindow() {
  // 确保preload脚本路径正确
  const preloadPath = path.join(__dirname, 'preload.js');
  console.log('Preload脚本路径:', preloadPath);
  console.log('Preload脚本是否存在:', fs.existsSync(preloadPath));

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
    },
  });

  const startUrl =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:8000'
      : url.format({
          pathname: path.join(__dirname, './dist/index.html'),
          protocol: 'file:',
          slashes: true,
        });

  mainWindow.loadURL(startUrl);

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

// 导入Excel文件
ipcMain.handle('import-excel', async (event) => {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Excel Files', extensions: ['xlsx', 'xls'] }],
    });

    if (canceled || filePaths.length === 0) {
      return { success: false, message: '未选择文件' };
    }

    const filePath = filePaths[0];
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return { success: false, message: 'Excel文件为空' };
    }

    // 使用事务处理
    db.exec('BEGIN TRANSACTION');

    try {
      // 清空现有数据
      db.exec('DELETE FROM t_exchange_trade_fee');

      // 插入新数据
      for (const row of data) {
        const stmt = db.prepare(`
          INSERT INTO t_exchange_trade_fee (exch_code, product_type, product_id, instrument_id, open_amt, open_rate)
          VALUES (?, ?, ?, ?, ?, ?)
        `);

        const exch_code = row['交易所'] || '';
        const product_type = row['产品类型'] || '';
        const product_id = row['产品代码'] || '';
        const instrument_id = row['合约代码'] || '';
        const open_amt = parseFloat(row['开仓手续费（按手数）'] || 0).toFixed(
          2,
        );
        const open_rate = parseFloat(row['开仓手续费（按金额）'] || 0).toFixed(
          2,
        );

        stmt.run([
          exch_code,
          product_type,
          product_id,
          instrument_id,
          open_amt,
          open_rate,
        ]);
        stmt.free();
      }

      // 提交事务
      db.exec('COMMIT');

      // 保存到文件
      const dbPath = path.join(
        '/Users/panjc/Documents/Project/kingstar2femasfee/db',
        'kingstar2femasfee.db',
      );
      saveDatabase(dbPath);

      return { success: true, message: `成功导入${data.length}条数据` };
    } catch (error) {
      // 回滚事务
      db.exec('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('导入Excel文件失败:', error);
    return { success: false, message: `导入失败: ${error.message}` };
  }
});

// 查询数据
ipcMain.handle('query-exchange-fees', () => {
  try {
    const result = db.exec('SELECT * FROM t_exchange_trade_fee');
    // 将结果转换为对象数组
    const rows =
      result.length > 0
        ? result[0].values.map((row) => {
            const obj = {};
            result[0].columns.forEach((col, i) => {
              obj[col] = row[i];
            });
            return obj;
          })
        : [];

    return { success: true, data: rows };
  } catch (error) {
    console.error('查询数据失败:', error);
    return { success: false, message: `查询失败: ${error.message}` };
  }
});

// 清空数据
ipcMain.handle('clear-exchange-fees', () => {
  try {
    // 使用事务处理
    db.exec('BEGIN TRANSACTION');

    try {
      // 清空数据表
      db.exec('DELETE FROM t_exchange_trade_fee');

      // 提交事务
      db.exec('COMMIT');

      // 保存到文件
      const dbPath = path.join(
        '/Users/panjc/Documents/Project/kingstar2femasfee/db',
        'kingstar2femasfee.db',
      );
      saveDatabase(dbPath);

      return { success: true, message: '数据已清空' };
    } catch (error) {
      // 回滚事务
      db.exec('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('清空数据失败:', error);
    return { success: false, message: `清空失败: ${error.message}` };
  }
});

// 应用关闭时保存数据库
app.on('will-quit', () => {
  if (db) {
    try {
      const dbPath = path.join(
        '/Users/panjc/Documents/Project/kingstar2femasfee/db',
        'kingstar2femasfee.db',
      );
      saveDatabase(dbPath);
      console.log('数据库已在应用关闭时保存');
    } catch (err) {
      console.error('关闭时保存数据库失败:', err.message);
    }
  }
});
