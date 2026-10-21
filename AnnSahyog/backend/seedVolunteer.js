const bcrypt = require("bcrypt");
const db = require("./db");

async function seedVolunteer() {
  console.log("=== Seeding Volunteer Data ===");

  try {
    const hashedPassword = await bcrypt.hash("volunteer123", 10);

    // 1. Check or create volunteer user
    db.query(
      "SELECT user_id, email FROM users WHERE email = 'volunteer@annsahyog.org'",
      async (err, users) => {
        if (err) {
          console.error("Error checking user:", err);
          process.exit(1);
        }

        let userId;

        if (users.length === 0) {
          const insertUserSql = `
            INSERT INTO users (name, email, password, phone, role, status, created_at)
            VALUES ('Rahul Verma', 'volunteer@annsahyog.org', ?, '+91 98250 12345', 'VOLUNTEER', 'ACTIVE', NOW())
          `;

          const userRes = await new Promise((resolve, reject) => {
            db.query(insertUserSql, [hashedPassword], (e, r) => {
              if (e) return reject(e);
              resolve(r);
            });
          });

          userId = userRes.insertId;
          console.log(`Created user 'volunteer@annsahyog.org' (user_id: ${userId})`);
        } else {
          userId = users[0].user_id;
          console.log(`Found existing user (user_id: ${userId})`);
        }

        // 2. Check or create volunteer profile
        db.query(
          "SELECT volunteer_id FROM volunteers WHERE user_id = ?",
          [userId],
          async (vErr, vList) => {
            if (vErr) {
              console.error("Error checking volunteer:", vErr);
              process.exit(1);
            }

            let volunteerId;

            if (vList.length === 0) {
              const insertVolSql = `
                INSERT INTO volunteers (user_id, address, city, availability)
                VALUES (?, 'C.G. Road, Navrangpura', 'Ahmedabad', 'AVAILABLE')
              `;

              const volRes = await new Promise((resolve, reject) => {
                db.query(insertVolSql, [userId], (e, r) => {
                  if (e) return reject(e);
                  resolve(r);
                });
              });

              volunteerId = volRes.insertId;
              console.log(`Created volunteer record (volunteer_id: ${volunteerId})`);
            } else {
              volunteerId = vList[0].volunteer_id;
              console.log(`Found existing volunteer (volunteer_id: ${volunteerId})`);
            }

            // 3. Find existing donations to link pickup tasks
            db.query(
              "SELECT donation_id, pickup_address, city FROM donations LIMIT 3",
              async (dErr, dList) => {
                if (dErr || dList.length === 0) {
                  console.log("No donations found to attach pickups.");
                  process.exit(0);
                }

                // Check existing pickups
                db.query("SELECT COUNT(*) AS count FROM pickup_delivery", async (pErr, pCount) => {
                  if (pCount[0].count === 0) {
                    console.log("Seeding sample pickup delivery tasks...");

                    // Task 1: Assigned to this volunteer
                    const don1 = dList[0];
                    const sql1 = `
                      INSERT INTO pickup_delivery (donation_id, volunteer_id, pickup_location, delivery_location, status, pickup_timestamp)
                      VALUES (?, ?, ?, 'Aashray Shelter, Kalupur, Ahmedabad', 'ASSIGNED', NULL)
                    `;
                    await new Promise((res) => db.query(sql1, [don1.donation_id, volunteerId, don1.pickup_address || "Navrangpura, Ahmedabad"], res));
                    console.log("Seeded assigned pickup task (assigned to Rahul Verma)");

                    // Task 2: Open / Available rescue task (volunteer_id = NULL)
                    if (dList.length > 1) {
                      const don2 = dList[1];
                      const sql2 = `
                        INSERT INTO pickup_delivery (donation_id, volunteer_id, pickup_location, delivery_location, status, pickup_timestamp)
                        VALUES (?, NULL, ?, 'Seva Kitchen Center, Satellite, Ahmedabad', 'ASSIGNED', NULL)
                      `;
                      await new Promise((res) => db.query(sql2, [don2.donation_id, don2.pickup_address || "Prahlad Nagar, Ahmedabad"], res));
                      console.log("Seeded open rescue task available for acceptance");
                    }

                    // Task 3: Completed historical task
                    if (dList.length > 2) {
                      const don3 = dList[2];
                      const sql3 = `
                        INSERT INTO pickup_delivery (donation_id, volunteer_id, pickup_location, delivery_location, status, pickup_timestamp, delivery_timestamp)
                        VALUES (?, ?, ?, 'Apna Ghar Orphanage, Paldi, Ahmedabad', 'DELIVERED', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY))
                      `;
                      await new Promise((res) => db.query(sql3, [don3.donation_id, volunteerId, don3.pickup_address || "Vastrapur, Ahmedabad"], res));
                      console.log("Seeded completed historical delivery task");
                    }
                  } else {
                    console.log(`Found ${pCount[0].count} existing pickup delivery tasks.`);
                  }

                  console.log("\n=== Volunteer seeding completed successfully! ===");
                  process.exit(0);
                });
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
}

seedVolunteer();
