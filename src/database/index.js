const initSqlJs = require('sql.js');
const fs = require('fs-extra');
const path = require('path');

class Database {
  constructor() {
    this.db = null;
    this.SQL = null;
  }

  async init(userDataPath) {
    this.SQL = await initSqlJs();
    await this.connect(userDataPath);
    await this.createTables();
    this.startAutoSave(userDataPath);
  }

  async connect(userDataPath) {
    const dbDir = path.join(userDataPath, 'db');
    const dbPath = path.join(dbDir, 'kingstar2femasfee.db');

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    if (fs.existsSync(dbPath)) {
      try {
        const filebuffer = fs.readFileSync(dbPath);
        this.db = new this.SQL.Database(filebuffer);
      } catch (err) {
        this.db = new this.SQL.Database();
      }
    } else {
      this.db = new this.SQL.Database();
    }
  }

  createTables() {
    // 创建表的SQL语句
  }

  saveDatabase(dbPath) {
    if (this.db) {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(dbPath, buffer);
    }
  }

  startAutoSave(userDataPath) {
    const dbPath = path.join(userDataPath, 'db', 'kingstar2femasfee.db');
    setInterval(() => this.saveDatabase(dbPath), 10000);
  }
}

module.exports = new Database();
