const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const url = require('url');
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
    let userDataPath;
    if (isDev) {
      userDataPath = '/Users/panjc/Documents/Project/kingstar2femasfee';
      console.log('应用数据目录:', userDataPath);
    } else {
      userDataPath = app.getPath('userData');
      console.log('应用数据目录:', userDataPath);
    }

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
    db.exec(`DROP TABLE IF EXISTS t_exchange_trade_fee`);
    db.exec(`CREATE TABLE IF NOT EXISTS t_exchange_trade_fee (
      exch_code TEXT NOT NULL,           -- 交易所名称
      product_type TEXT NOT NULL,        -- 产品类型
      product_id TEXT,                   -- 产品代码
      product_name TEXT,                 -- 产品名称
      option_series_id TEXT,             -- 期权系列
      instrument_id TEXT NOT NULL,       -- 合约代码
      hedge_flag TEXT,                   -- 投保标识
      buy_sell TEXT,                     -- 买卖标识
      open_fee_rate DECIMAL(10,8) DEFAULT 0.00000000,       -- 开仓手续费率（按金额）
      open_fee_amt DECIMAL(10,2) DEFAULT 0.00,             -- 开仓手续费额（按手数）
      short_open_fee_rate DECIMAL(10,8) DEFAULT 0.00000000, -- 短线开仓手续费率（按金额）
      short_open_fee_amt DECIMAL(10,2) DEFAULT 0.00,       -- 短线开仓手续费额（按手数）
      offset_fee_rate DECIMAL(10,8) DEFAULT 0.00000000,     -- 平仓手续费率（按金额）
      offset_fee_amt DECIMAL(10,2) DEFAULT 0.00,           -- 平仓手续费额（按手数）
      ot_fee_rate DECIMAL(10,8) DEFAULT 0.00000000,         -- 平今手续费率（按金额）
      ot_fee_amt DECIMAL(10,2) DEFAULT 0.00,               -- 平今手续费额（按手数）
      exec_clear_fee_rate DECIMAL(10,8) DEFAULT 0.00000000, -- 行权手续费率（按金额）
      exec_clear_fee_amt DECIMAL(10,2) DEFAULT 0.00,       -- 行权手续费额（按手数）
      PRIMARY KEY (exch_code, product_type, product_id, option_series_id, instrument_id, hedge_flag, buy_sell)
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
    console.log('data', data);

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
          INSERT INTO t_exchange_trade_fee (
            exch_code, product_type, product_id, product_name, option_series_id, instrument_id, 
            hedge_flag, buy_sell, open_fee_rate, open_fee_amt, short_open_fee_rate, short_open_fee_amt, 
            offset_fee_rate, offset_fee_amt, ot_fee_rate, ot_fee_amt, exec_clear_fee_rate, exec_clear_fee_amt
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const exch_code = row['交易所名称'] || '';
        const product_type = row['产品类型'] || '';
        const product_id = row['产品代码'] || '';
        const product_name = row['产品名称'] || '';
        const option_series_id = row['期权系列'] || '';
        const instrument_id = row['合约代码'] || '*';
        const hedge_flag = row['投保标识'] || '*';
        const buy_sell = row['买卖标识'] || '*';

        // 解析所有费率和费额字段，处理格式和默认值
        const parseRate = (fieldName) => {
          if (row[fieldName] === undefined || row[fieldName] === null) return 0;
          // 处理百分比值，去除逗号，转换为小数
          const strValue = String(row[fieldName])
            .replace(/,/g, '')
            .replace(/%/g, '');
          const value = parseFloat(strValue) / 100; // 百分比转小数
          return isNaN(value) ? 0 : value;
        };

        const parseAmount = (fieldName) => {
          if (row[fieldName] === undefined || row[fieldName] === null) return 0;
          // 处理费额，去除逗号等格式符号
          const strValue = String(row[fieldName]).replace(/,/g, '');
          const value = parseFloat(strValue);
          return isNaN(value) ? 0 : value;
        };

        // 解析各个费率和费额字段
        const open_fee_rate = parseRate('开仓手续费率（按金额）');
        const open_fee_amt = parseAmount('开仓手续费额（按手数）');
        const short_open_fee_rate = parseRate('短线开仓手续费率（按金额）');
        const short_open_fee_amt = parseAmount('短线开仓手续费额（按手数）');
        const offset_fee_rate = parseRate('平仓手续费率（按金额）');
        const offset_fee_amt = parseAmount('平仓手续费额（按手数）');
        const ot_fee_rate = parseRate('平今手续费率（按金额）');
        const ot_fee_amt = parseAmount('平今手续费额（按手数）');
        const exec_clear_fee_rate = parseRate('行权手续费率（按金额）');
        const exec_clear_fee_amt = parseAmount('行权手续费额（按手数）');

        console.log(
          `导入数据: ${exch_code}, ${product_type}, ${product_id}, ${instrument_id}, ` +
            `投保标识: ${hedge_flag}, 买卖标识: ${buy_sell}, ` +
            `开仓费率: ${open_fee_rate}, 开仓费额: ${open_fee_amt}`,
        );

        stmt.run([
          exch_code,
          product_type,
          product_id,
          product_name,
          option_series_id,
          instrument_id,
          hedge_flag,
          buy_sell,
          open_fee_rate,
          open_fee_amt,
          short_open_fee_rate,
          short_open_fee_amt,
          offset_fee_rate,
          offset_fee_amt,
          ot_fee_rate,
          ot_fee_amt,
          exec_clear_fee_rate,
          exec_clear_fee_amt,
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
              // 确保数值字段作为数值类型传递
              if (col.endsWith('_amt') || col.endsWith('_rate')) {
                // 确保是数值类型
                obj[col] =
                  typeof row[i] === 'string' ? parseFloat(row[i]) : row[i];

                // 如果转换后是NaN，设为0
                if (isNaN(obj[col])) obj[col] = 0;
              } else {
                obj[col] = row[i] || ''; // 确保字符串字段为空字符串而不是null
              }
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

// 执行SQL查询（仅用于调试）
ipcMain.handle('exec-sql', (event, sql) => {
  try {
    console.log('执行SQL查询:', sql);

    // 执行SQL查询
    const result = db.exec(sql);

    // 将结果转换为易于阅读的格式
    if (result.length === 0) {
      return { success: true, message: '查询执行成功，但没有返回数据' };
    }

    // 将结果转换为对象数组
    const rows = result[0].values.map((row) => {
      const obj = {};
      result[0].columns.forEach((col, i) => {
        obj[col] = row[i];
      });
      return obj;
    });

    return {
      success: true,
      data: rows,
      columnNames: result[0].columns,
      rowCount: rows.length,
    };
  } catch (error) {
    console.error('执行SQL查询失败:', error);
    return {
      success: false,
      message: `查询失败: ${error.message}`,
      sql: sql,
    };
  }
});
