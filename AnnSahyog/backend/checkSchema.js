const db = require('./db');

db.query('DESCRIBE donations', (e, r) => {
  console.log('donations:', r ? r.map(c => c.Field) : e);
  db.query('DESCRIBE volunteers', (e2, r2) => {
    console.log('volunteers:', r2 ? r2.map(c => c.Field) : e2);
    db.query('DESCRIBE ngos', (e3, r3) => {
      console.log('ngos:', r3 ? r3.map(c => c.Field) : e3);
      db.query('DESCRIBE pickup_delivery', (e4, r4) => {
        console.log('pickup_delivery:', r4 ? r4.map(c => c.Field) : e4);
        process.exit(0);
      });
    });
  });
});
