// One-time migration: NGOs use a single status —
// PENDING, ACTIVE, DEACTIVE or REJECTED (VERIFIED becomes ACTIVE).
// Safe to run more than once.
const db = require("./db");

const steps = [
  // 1. Allow old and new values together so existing rows stay valid
  "ALTER TABLE ngos MODIFY verification_status ENUM('PENDING','VERIFIED','ACTIVE','DEACTIVE','REJECTED') DEFAULT 'PENDING'",
  // 2. Verified NGOs are now Active
  "UPDATE ngos SET verification_status = 'ACTIVE' WHERE verification_status = 'VERIFIED'",
  // 3. Drop the old value
  "ALTER TABLE ngos MODIFY verification_status ENUM('PENDING','ACTIVE','DEACTIVE','REJECTED') DEFAULT 'PENDING'",
];

function run(index) {
  if (index >= steps.length) {
    console.log("ngos.verification_status now uses PENDING / ACTIVE / DEACTIVE / REJECTED.");
    process.exit(0);
  }

  db.query(steps[index], (err, result) => {
    if (err) {
      console.error(`Migration step ${index + 1} failed:`, err.message);
      process.exit(1);
    }

    if (index === 1) {
      console.log(`Converted ${result.affectedRows} VERIFIED NGO(s) to ACTIVE.`);
    }

    run(index + 1);
  });
}

run(0);
