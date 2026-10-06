const fs = require("node:fs");
const path = require("node:path");
const mysql = require("mysql2/promise");
require("dotenv").config({ path: path.join(__dirname, "../../.env"), quiet: true });

async function disposableDatabase(label) {
  const name = `a3_test_${label}_${process.pid}_${Date.now()}`;
  const options = {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    dateStrings: true,
    decimalNumbers: true,
    charset: "utf8mb4",
  };
  const admin = await mysql.createConnection({ ...options, multipleStatements: true });
  const sql = fs.readFileSync(path.join(__dirname, "../../database/charityevents_db.sql"), "utf8")
    .replace(/^DELIMITER.*$/gm, "").replaceAll("END$$", "END;");
  try {
    await admin.query(`CREATE DATABASE \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; USE \`${name}\`;\n` + sql);
  } catch (error) {
    await admin.query(`DROP DATABASE IF EXISTS \`${name}\``);
    await admin.end();
    throw error;
  }
  const db = mysql.createPool({ ...options, database: name, connectionLimit: 5 });
  return { db, name, async close() {
    await db.end();
    await admin.query(`DROP DATABASE \`${name}\``);
    await admin.end();
  } };
}

module.exports = { disposableDatabase };
