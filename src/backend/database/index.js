const initSqlJs = require('sql.js');
const fs = require('fs-extra');
const path = require('path');
const createTables = require('./createTables');
class Database {
  constructor() {
    this.db = null;
    this.SQL = null;
    this.userDataPath = null;
    this.autoSaveInterval = null;
  }

  async init(userDataPath) {
    this.userDataPath = userDataPath;
    try {
      this.SQL = await initSqlJs();
      await this.connect();
      await createTables(this.db);
      this.startAutoSave();
    } catch (err) {
      console.error('🧨数据库初始化失败', err);
    }
  }

  async connect() {
    this.dbDir = path.join(this.userDataPath, 'db');
    this.dbPath = path.join(this.dbDir, 'kingstar2femasfee.db');

    if (!fs.existsSync(this.dbDir)) {
      fs.mkdirSync(this.dbDir, { recursive: true });
    }

    if (fs.existsSync(this.dbPath)) {
      try {
        const filebuffer = fs.readFileSync(this.dbPath);
        this.db = new this.SQL.Database(filebuffer);
      } catch (err) {
        console.error('🧨数据库读取失败', err);
        this.db = new this.SQL.Database();
        this.saveDatabase();
      }
    } else {
      console.log('🧨数据库不存在，创建新数据库');
      this.db = new this.SQL.Database();
      this.saveDatabase();
    }
  }

  saveDatabase() {
    if (!this.db) {
      throw new Error('🧨数据库未初始化');
    }
    if (!this.dbPath) {
      throw new Error('🧨数据库路径未定义');
    }

    // console.log('🧨正在保存数据库到路径:', this.dbPath);
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(this.dbPath, buffer);
      const stats = fs.statSync(this.dbPath);
      // console.log('👌数据库保存成功，大小:', stats.size, '字节');
    } catch (err) {
      console.error('🧨数据库保存失败', err);
      throw err;
    }
  }

  startAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    this.autoSaveInterval = setInterval(() => this.saveDatabase(), 10000);
  }

  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  cleanup() {
    try {
      this.stopAutoSave();
      if (this.db) {
        this.saveDatabase();
        this.db = null;
        this.SQL = null;
        this.userDataPath = null;
      }
    } catch (err) {
      console.error('🧨数据库清理失败', err);
    }
  }
}
module.exports = new Database();
