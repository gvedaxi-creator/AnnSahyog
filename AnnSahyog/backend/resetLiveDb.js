// Clears ALL demo/test data from the live database and creates one real admin.
// Keeps the table structure. Run it yourself, after taking a backup:
//   mysqldump -u root -p annsahyog > annsahyog_backup_before_reset.sql
// Then in the backend folder (PowerShell example):
//   $env:CONFIRM_RESET="YES-DELETE-ALL-DATA"; $env:ADMIN_EMAIL="you@example.com"; $env:ADMIN_PASSWORD="a-strong-password"; node resetLiveDb.js
require("dotenv").config();
const bcrypt = require("bcrypt");
const mysql = require("mysql2/promise");

(async () => {
  const dbName = process.env.DB_NAME;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Platform Administrator";
  const phone = process.env.ADMIN_PHONE || "";

  if (dbName !== "annsahyog") throw new Error("Refusing to run: DB_NAME must be 'annsahyog' (live). Found: " + dbName);
  if (process.env.CONFIRM_RESET !== "YES-DELETE-ALL-DATA") throw new Error("Set CONFIRM_RESET=YES-DELETE-ALL-DATA to confirm.");
  if (!email || !password || password.length < 8) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD (password at least 8 characters).");

  const hash = await bcrypt.hash(password, 10);
  const c = await mysql.createConnection({
    host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: dbName,
  });

  const [rows] = await c.query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
  const tables = rows.map((r) => Object.values(r)[0]);

  await c.query("SET FOREIGN_KEY_CHECKS = 0");
  for (const t of tables) {
    await c.query("TRUNCATE TABLE `" + t + "`");
    console.log("cleared:", t);
  }
  await c.query("SET FOREIGN_KEY_CHECKS = 1");

  const [res] = await c.query(
    "INSERT INTO users (name, email, password, phone, role, status) VALUES (?, ?, ?, ?, 'ADMIN', 'ACTIVE')",
    [name, email, hash, phone]
  );
  console.log("Admin created. User ID:", res.insertId, "Email:", email);
  await c.end();
})().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });
