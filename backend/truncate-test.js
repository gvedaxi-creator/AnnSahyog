require("dotenv").config();
const mysql = require("mysql2/promise");

(async () => {
  const db = "annsahyog_test"; // hard-coded: this script never touches annsahyog
  const c = await mysql.createConnection({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: db,
  });
  const [rows] = await c.query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
  const tables = rows.map((r) => Object.values(r)[0]);
  await c.query("SET FOREIGN_KEY_CHECKS = 0");
  for (const t of tables) await c.query(`TRUNCATE TABLE \`${t}\``);
  await c.query("SET FOREIGN_KEY_CHECKS = 1");
  console.log(`Truncated ${tables.length} tables in ${db}`);
  await c.end();
})().catch((e) => { console.error(e.message); process.exit(1); });
