const initSqlJs = require('sql.js');
const fs = require('fs-extra');
const path = require('path');
const createTables = require('./createTables');
class Database {
  constructor() {
    this.db = null;
    this.SQL = null;
    this.userDataPath = null;
  }

  async init(userDataPath) {
    this.userDataPath = userDataPath;
    this.SQL = await initSqlJs();
    await this.connect();
    await createTables(this.db);
    this.startAutoSave();
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
        this.db = new this.SQL.Database();
      }
    } else {
      this.db = new this.SQL.Database();
      this.saveDatabase(this.dbPath);
    }
  }

  saveDatabase() {
    if (this.db) {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(this.dbPath, buffer);
    } else {
      throw new Error('数据库未初始化');
    }
  }

  startAutoSave() {
    setInterval(() => this.saveDatabase(), 10000);
  }
}

module.exports = new Database();
