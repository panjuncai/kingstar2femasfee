const { ipcMain, dialog } = require('electron');
const dbInstance = require('../database');
const ExcelService = require('../services/excel');
const { parseRate, parseAmount } = require('../utils');

class IpcHandlers {
  register() {
    ipcMain.handle('import-excel', this.handleImportExcel);
    ipcMain.handle('query-exchange-fees', this.handleQueryExchangeFees);
    ipcMain.handle('clear-exchange-trade-fee', () =>
      this.handleClearTable('t_exchange_trade_fee'),
    );
    ipcMain.handle('exec-sql', this.handleExecSql);
  }

  async handleImportExcel() {
    try {
      const db = dbInstance.db;
      if (!db) {
        throw new Error('数据库未初始化');
      }
      const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'Excel Files', extensions: ['xlsx', 'xls'] }],
      });

      if (canceled || filePaths.length === 0) {
        return { success: false, message: '未选择文件' };
      }

      const data = ExcelService.parseExcelData(filePaths[0]);
      // console.log('data', data);

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

          // console.log('row🌻', row);
          const exch_code = row['交易所名称'] || '';
          const product_type = row['产品类型'] || '';
          const product_id = row['产品代码'] || '';
          const product_name = row['产品名称'] || '';
          const option_series_id = row['期权系列'] || '';
          const instrument_id = row['合约代码'] || '*';
          const hedge_flag = row['投保标识'] || '*';
          const buy_sell = row['买卖标识'] || '*';
          // 解析各个费率和费额字段
          const open_fee_rate = parseRate(row, '开仓手续费率（按金额）');
          const open_fee_amt = parseAmount(row, '开仓手续费额（按手数）');
          const short_open_fee_rate = parseRate(
            row,
            '短线开仓手续费率（按金额）',
          );
          const short_open_fee_amt = parseAmount(
            row,
            '短线开仓手续费额（按手数）',
          );
          const offset_fee_rate = parseRate(row, '平仓手续费率（按金额）');
          const offset_fee_amt = parseAmount(row, '平仓手续费额（按手数）');
          const ot_fee_rate = parseRate(row, '平今手续费率（按金额）');
          const ot_fee_amt = parseAmount(row, '平今手续费额（按手数）');
          const exec_clear_fee_rate = parseRate(row, '行权手续费率（按金额）');
          const exec_clear_fee_amt = parseAmount(row, '行权手续费额（按手数）');

          // console.log(
          //   `导入数据🌻: ${exch_code}, ${product_type}, ${product_id}, ${instrument_id},${option_series_id} ` +
          //     `投保标识: ${hedge_flag}, 买卖标识: ${buy_sell}, ` +
          //     `开仓费率: ${open_fee_rate}, 开仓费额: ${open_fee_amt}`,
          // );

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
        console.log('🌻提交事务');

        dbInstance.saveDatabase();
        console.log('🌻保存数据库');
        return { success: true, message: `🌻成功导入${data.length}条数据` };
      } catch (error) {
        // 回滚事务
        db.exec('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('导入Excel文件失败:', error);
      return { success: false, message: `导入失败: ${error.message}` };
    }
  }

  handleQueryExchangeFees() {
    try {
      const db = dbInstance.db;
      if (!db) {
        throw new Error('数据库未初始化');
      }
      const result = db.exec('SELECT * FROM t_exchange_trade_fee');
      // console.log('result🌻', result);
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
  }

  handleClearTable(tableName) {
    try {
      const db = dbInstance.db;
      if (!db) {
        throw new Error('数据库未初始化');
      }
      // 使用事务处理
      db.exec('BEGIN TRANSACTION');

      try {
        // 清空数据表
        db.exec(`DELETE FROM ${tableName}`);

        // 提交事务
        db.exec('COMMIT');

        // 保存到文件
        dbInstance.saveDatabase();

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
  }

  handleExecSql(event, sql) {
    try {
      const db = dbInstance.db;
      if (!db) {
        throw new Error('数据库未初始化');
      }
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
  }
}

module.exports = new IpcHandlers();
