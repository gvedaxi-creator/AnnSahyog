require("dotenv").config();
const bcrypt = require("bcrypt");
const db = require("./db");

async function seedAdmin() {
  const adminEmail = "admin@annsahyog.org";
  const adminPassword = "admin123";
  const adminName = "Platform Administrator";
  const adminPhone = "9999999999";
  const adminRole = "ADMIN";
  const adminStatus = "ACTIVE";

  const checkSql = "SELECT user_id, email, role, status FROM users WHERE email = ?";

  db.query(checkSql, [adminEmail], async (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      process.exit(1);
    }

    if (results.length > 0) {
      console.log(`Admin account (${adminEmail}) already exists (User ID: ${results[0].user_id}).`);
      
      // Ensure status is ACTIVE and role is ADMIN
      const updateSql = "UPDATE users SET role = 'ADMIN', status = 'ACTIVE' WHERE email = ?";
      db.query(updateSql, [adminEmail], (updateErr) => {
        if (updateErr) {
          console.error("Error updating admin status:", updateErr);
        } else {
          console.log("Admin account status ensured as ACTIVE.");
        }
        db.end();
      });
      return;
    }

    try {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const insertSql = `
        INSERT INTO users (name, email, password, phone, role, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      db.query(
        insertSql,
        [adminName, adminEmail, hashedPassword, adminPhone, adminRole, adminStatus],
        (insertErr, result) => {
          if (insertErr) {
            console.error("Failed to insert admin user:", insertErr);
            process.exit(1);
          }

          console.log(`Admin account created successfully! User ID: ${result.insertId}`);
          console.log(`Credentials -> Email: ${adminEmail} | Password: ${adminPassword}`);
          db.end();
        }
      );
    } catch (hashError) {
      console.error("Error hashing password:", hashError);
      process.exit(1);
    }
  });
}

seedAdmin();
