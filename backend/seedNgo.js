require("dotenv").config();
const bcrypt = require("bcrypt");
const db = require("./db");

async function seedNgo() {
  const ngoEmail = "ngo@annsahyog.org";
  const ngoPassword = "ngo123";
  const contactName = "Rajesh Sharma";
  const phone = "9825012345";
  const orgName = "Aashray Community Food Shelter";
  const regNumber = "NGO-GJ-2024-8841";
  const address = "42, Ashram Road, Near Riverfront";
  const city = "Ahmedabad";
  const role = "NGO";
  const userStatus = "ACTIVE";
  const verificationStatus = "ACTIVE";

  // Check if user exists
  const checkUserSql = "SELECT user_id, email, role FROM users WHERE email = ?";

  db.query(checkUserSql, [ngoEmail], async (err, users) => {
    if (err) {
      console.error("Database query error:", err);
      process.exit(1);
    }

    let userId;

    if (users.length > 0) {
      userId = users[0].user_id;
      console.log(`NGO user (${ngoEmail}) already exists with ID: ${userId}`);
    } else {
      try {
        const hashedPassword = await bcrypt.hash(ngoPassword, 10);
        const insertUserSql = `
          INSERT INTO users (name, email, password, phone, role, status)
          VALUES (?, ?, ?, ?, ?, ?)
        `;

        const userResult = await new Promise((resolve, reject) => {
          db.query(
            insertUserSql,
            [contactName, ngoEmail, hashedPassword, phone, role, userStatus],
            (err, res) => (err ? reject(err) : resolve(res))
          );
        });

        userId = userResult.insertId;
        console.log(`Created user record for NGO, ID: ${userId}`);
      } catch (userErr) {
        console.error("Error creating NGO user:", userErr);
        process.exit(1);
      }
    }

    // Now check if profile exists in ngos table
    const checkNgoSql = "SELECT ngo_id FROM ngos WHERE user_id = ?";
    db.query(checkNgoSql, [userId], (ngoErr, ngos) => {
      if (ngoErr) {
        console.error("Error checking ngos table:", ngoErr);
        process.exit(1);
      }

      if (ngos.length > 0) {
        console.log(`NGO profile already exists (NGO ID: ${ngos[0].ngo_id}). Ensuring ACTIVE status...`);
        const updateSql = `
          UPDATE ngos
          SET organization_name = ?, registration_number = ?, address = ?, city = ?, verification_status = ?
          WHERE ngo_id = ?
        `;
        db.query(
          updateSql,
          [orgName, regNumber, address, city, verificationStatus, ngos[0].ngo_id],
          (uErr) => {
            if (uErr) console.error("Update error:", uErr);
            else console.log("NGO profile updated successfully!");
            db.end();
          }
        );
      } else {
        const insertNgoSql = `
          INSERT INTO ngos (user_id, organization_name, registration_number, address, city, verification_status)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        db.query(
          insertNgoSql,
          [userId, orgName, regNumber, address, city, verificationStatus],
          (iErr, iRes) => {
            if (iErr) {
              console.error("Failed to insert NGO profile:", iErr);
              process.exit(1);
            }
            console.log(`NGO profile created successfully! NGO ID: ${iRes.insertId}`);
            console.log(`Credentials -> Email: ${ngoEmail} | Password: ${ngoPassword}`);
            db.end();
          }
        );
      }
    });
  });
}

seedNgo();
