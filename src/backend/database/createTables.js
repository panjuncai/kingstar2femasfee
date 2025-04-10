const createTables = async (db) => {
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
};

module.exports = createTables;
