// One-time migration: allow donations.status = 'COMPLETED'.
// The app sets COMPLETED when an NGO confirms receipt, but the column ENUM
// did not include it, so the update failed silently and donations stayed DELIVERED.
// Run once per database:  node migrateDonationCompleted.js
const db = require("./db");

// Report connection problems cleanly instead of crashing on a closed connection.
db.on("error", (e) => console.error("Database error:", e.message));

const sql = `
  ALTER TABLE donations
  MODIFY COLUMN status ENUM('AVAILABLE','REQUESTED','ACCEPTED','PICKED_UP','DELIVERED','CANCELLED','COMPLETED')
  DEFAULT 'AVAILABLE'
`;

setTimeout(() => {
  db.query(sql, (err) => {
    if (err) {
      console.error("Migration failed:", err.message);
      process.exitCode = 1;
    } else {
      console.log("Migration done: donations.status now accepts COMPLETED.");
    }
    db.end(() => {});
  });
}, 500);
