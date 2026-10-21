// One-time migration: allow pickup tasks with no volunteer yet, so an
// approved donation can sit as an open task until a volunteer accepts
// it or the admin assigns one. Safe to run more than once.
const db = require("./db");

db.query(
  "ALTER TABLE pickup_delivery MODIFY volunteer_id INT NULL",
  (err) => {
    if (err) {
      console.error("Migration failed:", err.message);
      process.exit(1);
    }

    console.log("pickup_delivery.volunteer_id now allows NULL (open tasks).");
    process.exit(0);
  }
);
