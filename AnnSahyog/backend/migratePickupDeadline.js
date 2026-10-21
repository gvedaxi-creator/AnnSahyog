// One-time migration: keep the time of day on donation dates.
// The donor form already sends "prepared" and "best before" as date + time,
// but the columns were DATE, so the time was dropped. "Best before" is the
// pickup deadline the admin is alerted about. Safe to run more than once;
// existing dates keep their day at 00:00.
const db = require("./db");

db.query(
  "ALTER TABLE donations MODIFY prepared_date DATETIME, MODIFY expiry_date DATETIME",
  (err) => {
    if (err) {
      console.error("Migration failed:", err.message);
      process.exit(1);
    }

    console.log("donations.prepared_date and expiry_date now store date and time.");
    process.exit(0);
  }
);
