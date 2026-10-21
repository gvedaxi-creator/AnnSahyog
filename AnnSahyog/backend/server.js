const express = require("express");
const cors = require("cors");
const db = require("./db");
const bcrypt = require("bcrypt");
const { signToken, requireAuth } = require("./auth");

const app = express();

app.use(cors());
app.use(express.json());

// Admin APIs are for ADMIN accounts only
app.use("/api/admin", requireAuth(["ADMIN"]));

// Login and role check for all other API routes (see policy.js)
app.use(require("./policy")(db));

app.get("/", (req, res) => {
  res.send("AnnSahyog Backend is Running!");
});

const PORT = 5000;

// ======================================================
// PICKUP TASK HELPERS
// Flow: donor approves an NGO request -> an open pickup
// task is created (volunteer_id NULL) -> a volunteer in
// that area accepts it, or the admin assigns one.
// ======================================================

const AREA_RADIUS_KM = 25;

// If no volunteer has accepted a pickup this many hours before its
// pickup deadline (the donation's "best before" time), the admin is
// alerted to assign one.
const ADMIN_ALERT_HOURS = 2;

// SQL condition: is donation `d` within volunteer `v`'s area?
// Uses distance when both have coordinates, otherwise the city
// (also matching addresses that mention the city, e.g. suburbs).
const inVolunteerArea = (v, d) => `(
  (
    ${v}.latitude IS NOT NULL AND ${d}.latitude IS NOT NULL AND
    6371 * ACOS(LEAST(1,
      COS(RADIANS(${v}.latitude)) * COS(RADIANS(${d}.latitude)) *
      COS(RADIANS(${d}.longitude) - RADIANS(${v}.longitude)) +
      SIN(RADIANS(${v}.latitude)) * SIN(RADIANS(${d}.latitude))
    )) <= ${AREA_RADIUS_KM}
  )
  OR (
    COALESCE(${v}.city, '') <> '' AND (
      LOWER(${d}.city) = LOWER(${v}.city) OR
      LOWER(${d}.pickup_address) LIKE CONCAT('%', LOWER(${v}.city), '%')
    )
  )
)`;

// Creates the open pickup task for approved donations that don't
// have one yet. Pass a donation id, or null to sync all of them.
const OPEN_PICKUP_INSERT_SQL = `
  INSERT INTO pickup_delivery (
    donation_id,
    volunteer_id,
    pickup_location,
    delivery_location,
    status,
    pickup_latitude,
    pickup_longitude,
    delivery_latitude,
    delivery_longitude
  )
  SELECT
    d.donation_id,
    NULL,
    CONCAT_WS(', ', NULLIF(d.pickup_address, ''), NULLIF(d.city, '')),
    CONCAT_WS(', ', n.organization_name, NULLIF(n.address, ''), NULLIF(n.city, '')),
    'ASSIGNED',
    d.latitude,
    d.longitude,
    n.latitude,
    n.longitude
  FROM donations d
  INNER JOIN donation_requests dr
    ON dr.request_id = (
      SELECT MIN(r.request_id)
      FROM donation_requests r
      WHERE r.donation_id = d.donation_id
        AND r.status = 'APPROVED'
    )
  INNER JOIN ngos n
    ON dr.ngo_id = n.ngo_id
  WHERE d.status NOT IN ('DELIVERED', 'CANCELLED')
    AND NOT EXISTS (
      SELECT 1 FROM pickup_delivery p WHERE p.donation_id = d.donation_id
    )
    AND (? IS NULL OR d.donation_id = ?)
`;

function createOpenPickup(donationId, callback = () => {}) {
  db.query(OPEN_PICKUP_INSERT_SQL, [donationId, donationId], callback);
}


// ======================================================
// REGISTER USER
// ======================================================

app.post("/api/users/register", async (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    role,
  } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({
      success: false,
      message: "Name, email, password and role are required",
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    // Start transaction
    db.beginTransaction((transactionError) => {
      if (transactionError) {
        console.error("Transaction error:", transactionError);

        return res.status(500).json({
          success: false,
          message: "Failed to start registration",
        });
      }

      // --------------------------------------------------
      // Create user
      // --------------------------------------------------

      const userSql = `
        INSERT INTO users
        (name, email, password, phone, role)
        VALUES (?, ?, ?, ?, ?)
      `;

      db.query(
        userSql,
        [
          name,
          email,
          hashedPassword,
          phone || null,
          role,
        ],
        (userError, userResult) => {
          if (userError) {
            return db.rollback(() => {
              console.error("Registration error:", userError);

              if (userError.code === "ER_DUP_ENTRY") {
                return res.status(409).json({
                  success: false,
                  message: "Email already registered",
                });
              }

              res.status(500).json({
                success: false,
                message: "Database error",
                error: userError.message,
              });
            });
          }

          const userId = userResult.insertId;

          // ------------------------------------------------
          // Create NGO profile
          // ------------------------------------------------
          if (role.toUpperCase() === "NGO") {
            const ngoSql = `
              INSERT INTO ngos (user_id, organization_name, registration_number, address, city, verification_status)
              VALUES (?, ?, ?, ?, ?, 'PENDING')
            `;

            return db.query(
              ngoSql,
              [
                userId,
                req.body.organization_name || name,
                req.body.registration_number || null,
                req.body.address || null,
                req.body.city || null,
              ],
              (ngoError, ngoResult) => {
                if (ngoError) {
                  return db.rollback(() => {
                    console.error("NGO profile creation error:", ngoError);
                    res.status(500).json({
                      success: false,
                      message: "Failed to create NGO profile",
                      error: ngoError.message,
                    });
                  });
                }

                db.commit((commitError) => {
                  if (commitError) {
                    return db.rollback(() => {
                      res.status(500).json({
                        success: false,
                        message: "Failed to complete registration",
                      });
                    });
                  }

                  res.status(201).json({
                    success: true,
                    message: "NGO registered successfully (pending admin verification)",
                    user_id: userId,
                    ngo_id: ngoResult.insertId,
                  });
                });
              }
            );
          }

          // ------------------------------------------------
          // Create Volunteer profile
          // ------------------------------------------------
          if (role.toUpperCase() === "VOLUNTEER") {
            const volSql = `
              INSERT INTO volunteers (user_id, address, city, availability)
              VALUES (?, ?, ?, 'AVAILABLE')
            `;

            return db.query(
              volSql,
              [
                userId,
                req.body.address || null,
                req.body.city || "Ahmedabad",
              ],
              (volError, volResult) => {
                if (volError) {
                  return db.rollback(() => {
                    console.error("Volunteer profile creation error:", volError);
                    res.status(500).json({
                      success: false,
                      message: "Failed to create volunteer profile",
                      error: volError.message,
                    });
                  });
                }

                db.commit((commitError) => {
                  if (commitError) {
                    return db.rollback(() => {
                      res.status(500).json({
                        success: false,
                        message: "Failed to complete registration",
                      });
                    });
                  }

                  res.status(201).json({
                    success: true,
                    message: "Volunteer registered successfully",
                    user_id: userId,
                    volunteer_id: volResult.insertId,
                  });
                });
              }
            );
          }

          // ------------------------------------------------
          // Create donor profile
          // ------------------------------------------------
          if (role.toUpperCase() !== "DONOR") {
            return db.commit((commitError) => {
              if (commitError) {
                return db.rollback(() => {
                  console.error(
                    "Commit error:",
                    commitError
                  );

                  res.status(500).json({
                    success: false,
                    message: "Failed to complete registration",
                  });
                });
              }

              res.status(201).json({
                success: true,
                message: "User registered successfully",
                user_id: userId,
              });
            });
          }

          const donorSql = `
            INSERT INTO donors (user_id)
            VALUES (?)
          `;

          db.query(
            donorSql,
            [userId],
            (donorError, donorResult) => {
              if (donorError) {
                return db.rollback(() => {
                  console.error(
                    "Donor profile creation error:",
                    donorError
                  );

                  res.status(500).json({
                    success: false,
                    message: "Failed to create donor profile",
                    error: donorError.message,
                  });
                });
              }

              // ------------------------------------------
              // Commit
              // ------------------------------------------

              db.commit((commitError) => {
                if (commitError) {
                  return db.rollback(() => {
                    console.error(
                      "Commit error:",
                      commitError
                    );

                    res.status(500).json({
                      success: false,
                      message:
                        "Failed to complete registration",
                    });
                  });
                }

                res.status(201).json({
                  success: true,
                  message: "Donor registered successfully",
                  user_id: userId,
                  donor_id: donorResult.insertId,
                });
              });
            }
          );
        }
      );
    });
  } catch (error) {
    console.error("Server error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});


// ======================================================
// GET AVAILABLE DONATIONS
// ======================================================

app.get("/api/donations", (req, res) => {
  const sql = `
    SELECT
      d.donation_id,
      d.donor_id,
      d.food_type,
      d.quantity,
      d.unit,
      d.description,
      d.prepared_date,
      d.expiry_date,
      d.pickup_address,
      d.city,
      d.latitude,
      d.longitude,
      d.status,
      d.created_at,

      di.item_id,
      di.food_item,
      di.quantity AS item_quantity,
      di.unit AS item_unit

    FROM donations d

    LEFT JOIN donation_items di
      ON di.donation_id = d.donation_id

    WHERE d.status = 'AVAILABLE'

    ORDER BY d.created_at DESC, di.item_id ASC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching donations:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch donations",
        error: err.message,
      });
    }

    const donationsMap = new Map();

    results.forEach((row) => {
      if (!donationsMap.has(row.donation_id)) {
        donationsMap.set(row.donation_id, {
          donation_id: row.donation_id,
          donor_id: row.donor_id,
          food_type: row.food_type,
          quantity: row.quantity,
          unit: row.unit,
          description: row.description,
          prepared_date: row.prepared_date,
          expiry_date: row.expiry_date,
          pickup_address: row.pickup_address,
          city: row.city,
          latitude: row.latitude,
          longitude: row.longitude,
          status: row.status,
          created_at: row.created_at,
          items: [],
        });
      }

      if (row.item_id) {
        donationsMap.get(row.donation_id).items.push({
          item_id: row.item_id,
          food_item: row.food_item,
          quantity: row.item_quantity,
          unit: row.item_unit,
        });
      }
    });

    res.status(200).json({
      success: true,
      donations: Array.from(donationsMap.values()),
    });
  });
});


// ======================================================
// LOGIN USER
// ======================================================

app.post("/api/users/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required"
    });
  }

  const sql = `
    SELECT
      u.user_id,
      u.name,
      u.email,
      u.password,
      u.role,
      u.status,
      d.donor_id,
      n.ngo_id,
      n.organization_name,
      n.verification_status,
      v.volunteer_id,
      v.city AS volunteer_city,
      v.availability
    FROM users u
    LEFT JOIN donors d
      ON d.user_id = u.user_id
    LEFT JOIN ngos n
      ON n.user_id = u.user_id
    LEFT JOIN volunteers v
      ON v.user_id = u.user_id
    WHERE u.email = ?
  `;

  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error(err);

      return res.status(500).json({
        message: "Database error"
      });
    }

    if (results.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const user = results[0];

    // Compare entered password with bcrypt hash
    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        message: "Account is inactive"
      });
    }

    res.status(200).json({
      message: "Login successful",

      user: {
        token: signToken(user),
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,

        // Available for donor accounts
        donor_id: user.donor_id || null,

        // Available for NGO accounts
        ngo_id: user.ngo_id || null,
        organization_name: user.organization_name || null,
        verification_status: user.verification_status || null,

        // Available for Volunteer accounts
        volunteer_id: user.volunteer_id || null,
        city: user.volunteer_city || null,
        availability: user.availability || "AVAILABLE",
      }
    });
  });
});


// ======================================================
// CREATE DONATION
// ======================================================

app.post("/api/donations", (req, res) => {
  const {
    donor_id,
    items,
    description,
    prepared_date,
    expiry_date,
    pickup_address,
    city,
    latitude,
    longitude,
  } = req.body;

  // ------------------------------------------------------
  // Basic validation
  // ------------------------------------------------------

  if (prepared_date && expiry_date && new Date(expiry_date) < new Date(prepared_date)) {
    return res.status(400).json({
      success: false,
      message: "Expiry date cannot be before the prepared date.",
    });
  }

  if (
    !donor_id ||
    !Array.isArray(items) ||
    items.length === 0 ||
    !prepared_date ||
    !expiry_date ||
    !pickup_address ||
    !city
  ) {
    return res.status(400).json({
      success: false,
      message: "Please provide all required donation details.",
    });
  }

  // ------------------------------------------------------
  // Validate food items
  // ------------------------------------------------------

  const invalidItem = items.some(
    (item) =>
      !item ||
      !item.food_item ||
      !item.food_item.trim() ||
      !item.quantity ||
      Number(item.quantity) <= 0 ||
      !item.unit
  );

  if (invalidItem) {
    return res.status(400).json({
      success: false,
      message:
        "Please provide a valid food item, quantity and unit for every item.",
    });
  }

  // ------------------------------------------------------
  // Validate Google Maps location
  // ------------------------------------------------------

  if (
    latitude === null ||
    latitude === undefined ||
    longitude === null ||
    longitude === undefined
  ) {
    return res.status(400).json({
      success: false,
      message: "Please select a valid pickup location on the map.",
    });
  }

  // ------------------------------------------------------
  // Compatibility values
  // ------------------------------------------------------
  // These keep the existing donations table compatible
  // with your existing dashboard and donation pages.

  const foodTypeSummary = items
    .map((item) => item.food_item.trim())
    .join(", ");

  const totalQuantity = items.reduce(
    (total, item) => total + Number(item.quantity),
    0
  );

  const unitSummary =
    items.length === 1 ? items[0].unit : "mixed";

  // ------------------------------------------------------
  // Insert main donation
  // ------------------------------------------------------

  const donationSql = `
    INSERT INTO donations (
      donor_id,
      food_type,
      quantity,
      unit,
      description,
      prepared_date,
      expiry_date,
      pickup_address,
      city,
      latitude,
      longitude,
      status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'AVAILABLE')
  `;

  const donationValues = [
    donor_id,
    foodTypeSummary,
    totalQuantity,
    unitSummary,
    description || null,
    prepared_date,
    expiry_date,
    pickup_address,
    city,
    latitude,
    longitude,
  ];

  // ------------------------------------------------------
  // Start transaction
  // ------------------------------------------------------

  db.beginTransaction((transactionError) => {
    if (transactionError) {
      console.error(
        "Transaction error:",
        transactionError
      );

      return res.status(500).json({
        success: false,
        message: "Failed to start donation transaction.",
        error: transactionError.message,
      });
    }

    // ----------------------------------------------------
    // Insert donation
    // ----------------------------------------------------

    db.query(
      donationSql,
      donationValues,
      (donationError, donationResult) => {
        if (donationError) {
          return db.rollback(() => {
            console.error(
              "Error creating donation:",
              donationError
            );

            res.status(500).json({
              success: false,
              message: "Failed to create donation.",
              error: donationError.message,
            });
          });
        }

        const donationId = donationResult.insertId;

        // ------------------------------------------------
        // Insert food items
        // ------------------------------------------------

        const itemSql = `
          INSERT INTO donation_items (
            donation_id,
            food_item,
            quantity,
            unit
          )
          VALUES ?
        `;

        const itemValues = items.map((item) => [
          donationId,
          item.food_item.trim(),
          Number(item.quantity),
          item.unit,
        ]);

        db.query(
          itemSql,
          [itemValues],
          (itemError) => {
            if (itemError) {
              return db.rollback(() => {
                console.error(
                  "Error creating donation items:",
                  itemError
                );

                res.status(500).json({
                  success: false,
                  message: "Failed to save donation items.",
                  error: itemError.message,
                });
              });
            }

            // --------------------------------------------
            // Commit transaction
            // --------------------------------------------

            db.commit((commitError) => {
              if (commitError) {
                return db.rollback(() => {
                  console.error(
                    "Error committing donation:",
                    commitError
                  );

                  res.status(500).json({
                    success: false,
                    message: "Failed to save donation.",
                    error: commitError.message,
                  });
                });
              }

              // ------------------------------------------
              // Success response
              // ------------------------------------------

              res.status(201).json({
                success: true,
                message: "Donation created successfully.",
                donation_id: donationId,
              });
            });
          }
        );
      }
    );
  });
});


// ======================================================
// GET DONATIONS FOR A SPECIFIC DONOR
// ======================================================

app.get("/api/donations/donor/:donor_id", (req, res) => {
  const { donor_id } = req.params;

  const sql = `
    SELECT
      d.donation_id,
      d.donor_id,
      d.food_type,
      d.quantity,
      d.unit,
      d.description,
      d.prepared_date,
      d.expiry_date,
      d.pickup_address,
      d.city,
      d.latitude,
      d.longitude,
      d.status,
      d.created_at,

      di.item_id,
      di.food_item,
      di.quantity AS item_quantity,
      di.unit AS item_unit

    FROM donations d

    LEFT JOIN donation_items di
      ON di.donation_id = d.donation_id

    WHERE d.donor_id = ?

    ORDER BY d.created_at DESC, di.item_id ASC
  `;

  db.query(sql, [donor_id], (err, results) => {
    if (err) {
      console.error(
        "Error fetching donor donations:",
        err
      );

      return res.status(500).json({
        success: false,
        message: "Failed to fetch donor donations",
        error: err.message,
      });
    }

    const donationsMap = new Map();

    results.forEach((row) => {
      if (!donationsMap.has(row.donation_id)) {
        donationsMap.set(row.donation_id, {
          donation_id: row.donation_id,
          donor_id: row.donor_id,
          food_type: row.food_type,
          quantity: row.quantity,
          unit: row.unit,
          description: row.description,
          prepared_date: row.prepared_date,
          expiry_date: row.expiry_date,
          pickup_address: row.pickup_address,
          city: row.city,
          latitude: row.latitude,
          longitude: row.longitude,
          status: row.status,
          created_at: row.created_at,
          items: [],
        });
      }

      if (row.item_id) {
        donationsMap.get(row.donation_id).items.push({
          item_id: row.item_id,
          food_item: row.food_item,
          quantity: row.item_quantity,
          unit: row.item_unit,
        });
      }
    });

    res.status(200).json({
      success: true,
      donations: Array.from(donationsMap.values()),
    });
  });
});


// ======================================================
// GET SINGLE DONATION BY ID
// ======================================================

app.get("/api/donations/:donation_id", (req, res) => {
  const { donation_id } = req.params;

  if (!donation_id) {
    return res.status(400).json({
      success: false,
      message: "Donation ID is required",
    });
  }

  const sql = `
    SELECT
      d.donation_id,
      d.donor_id,
      d.food_type,
      d.quantity,
      d.unit,
      d.description,
      d.prepared_date,
      d.expiry_date,
      d.pickup_address,
      d.city,
      d.latitude,
      d.longitude,
      d.status,
      d.created_at,

      di.item_id,
      di.food_item,
      di.quantity AS item_quantity,
      di.unit AS item_unit

    FROM donations d

    LEFT JOIN donation_items di
      ON di.donation_id = d.donation_id

    WHERE d.donation_id = ?

    ORDER BY di.item_id ASC
  `;

  db.query(sql, [donation_id], (err, results) => {
    if (err) {
      console.error("Error fetching donation:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch donation",
        error: err.message,
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Donation not found",
      });
    }

    // ---------------------------------------------
    // Create the main donation object
    // ---------------------------------------------

    const firstRow = results[0];

    const donation = {
      donation_id: firstRow.donation_id,
      donor_id: firstRow.donor_id,

      // Kept for compatibility with existing pages
      food_type: firstRow.food_type,
      quantity: firstRow.quantity,
      unit: firstRow.unit,

      description: firstRow.description,
      prepared_date: firstRow.prepared_date,
      expiry_date: firstRow.expiry_date,
      pickup_address: firstRow.pickup_address,
      city: firstRow.city,
      latitude: firstRow.latitude,
      longitude: firstRow.longitude,
      status: firstRow.status,
      created_at: firstRow.created_at,

      // New detailed food items
      items: [],
    };

    // ---------------------------------------------
    // Add individual food items
    // ---------------------------------------------

    results.forEach((row) => {
      if (row.item_id) {
        donation.items.push({
          item_id: row.item_id,
          food_item: row.food_item,
          quantity: row.item_quantity,
          unit: row.item_unit,
        });
      }
    });

    // ---------------------------------------------
    // Send response
    // ---------------------------------------------

    res.status(200).json({
      success: true,
      donation,
    });
  });
});


// ======================================================
// GET DONATION REQUESTS FOR A DONOR
// ======================================================

app.get("/api/donation-requests/donor/:donor_id", (req, res) => {
  const { donor_id } = req.params;

  if (!donor_id) {
    return res.status(400).json({
      success: false,
      message: "Donor ID is required",
    });
  }

  const sql = `
    SELECT
      dr.request_id,
      dr.donation_id,
      dr.ngo_id,

      dr.requested_quantity,
      dr.message,
      dr.status,
      dr.requested_at,
      dr.responded_at,

      -- Donation information
      d.food_type,
      d.quantity AS donation_quantity,
      d.unit AS donation_unit,
      d.description AS donation_description,
      d.city,
      d.pickup_address,
      d.expiry_date,

      -- NGO information
      u.name AS ngo_name,
      u.email AS ngo_email

    FROM donation_requests dr

    INNER JOIN donations d
      ON dr.donation_id = d.donation_id

    INNER JOIN ngos n
      ON dr.ngo_id = n.ngo_id

    INNER JOIN users u
      ON n.user_id = u.user_id

    WHERE d.donor_id = ?

    ORDER BY dr.requested_at DESC
  `;

  db.query(sql, [donor_id], (err, results) => {
    if (err) {
      console.error(
        "Error fetching donor donation requests:",
        err
      );

      return res.status(500).json({
        success: false,
        message: "Failed to fetch donation requests",
        error: err.message,
      });
    }

    res.status(200).json({
      success: true,
      requests: results,
    });
  });
});

// ======================================================
// RESPOND TO DONATION REQUEST
// ======================================================

app.put("/api/donation-requests/:request_id/respond", (req, res) => {
  const { request_id } = req.params;
  const { donor_id, status } = req.body;

  if (!request_id || !donor_id || !status) {
    return res.status(400).json({
      success: false,
      message: "Request ID, donor ID and status are required",
    });
  }

  if (!["APPROVED", "REJECTED"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Status must be APPROVED or REJECTED",
    });
  }

  // ------------------------------------------------------
  // Check request ownership and current status
  // ------------------------------------------------------

  const checkSql = `
    SELECT
      dr.request_id,
      dr.donation_id,
      dr.status AS request_status,
      d.donor_id,
      d.status AS donation_status,
      (
        SELECT COUNT(*) FROM donation_requests x
        WHERE x.donation_id = dr.donation_id
          AND x.status = 'APPROVED'
          AND x.request_id <> dr.request_id
      ) AS other_approved
    FROM donation_requests dr

    INNER JOIN donations d
      ON dr.donation_id = d.donation_id

    WHERE dr.request_id = ?
      AND d.donor_id = ?
  `;

  db.query(
    checkSql,
    [request_id, donor_id],
    (err, results) => {
      if (err) {
        console.error(
          "Error checking donation request:",
          err
        );

        return res.status(500).json({
          success: false,
          message: "Database error",
          error: err.message,
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Donation request not found",
        });
      }

      const request = results[0];

      // --------------------------------------------------
      // Only pending requests can be responded to
      // --------------------------------------------------

      if (request.request_status !== "PENDING") {
        return res.status(400).json({
          success: false,
          message: `This request has already been ${request.request_status.toLowerCase()}`,
        });
      }

      // A donation can go to only one NGO
      if (status === "APPROVED" && Number(request.other_approved) > 0) {
        return res.status(409).json({
          success: false,
          message: "This donation has already been approved for another NGO.",
        });
      }

      // --------------------------------------------------
      // Approve / Reject request
      // --------------------------------------------------

      const updateRequestSql = `
        UPDATE donation_requests
        SET
          status = ?,
          responded_at = CURRENT_TIMESTAMP
        WHERE request_id = ?
      `;

      db.query(
        updateRequestSql,
        [status, request_id],
        (updateError) => {
          if (updateError) {
            console.error(
              "Error updating donation request:",
              updateError
            );

            return res.status(500).json({
              success: false,
              message: "Failed to update donation request",
              error: updateError.message,
            });
          }

          // ------------------------------------------------
          // If approved, mark donation as REQUESTED
          // ------------------------------------------------

          if (status === "APPROVED") {
            const donationSql = `
              UPDATE donations
              SET status = 'REQUESTED'
              WHERE donation_id = ?
                AND status = 'AVAILABLE'
            `;

            db.query(
              donationSql,
              [request.donation_id],
              (donationError) => {
                if (donationError) {
                  console.error(
                    "Error updating donation status:",
                    donationError
                  );

                  return res.status(500).json({
                    success: false,
                    message:
                      "Request approved, but donation status could not be updated",
                    error: donationError.message,
                  });
                }

                // Open the pickup task so nearby volunteers can accept it
                createOpenPickup(request.donation_id, (pickupError) => {
                  if (pickupError) {
                    console.error(
                      "Error creating pickup task:",
                      pickupError
                    );
                  }

                  return res.status(200).json({
                    success: true,
                    message:
                      "Donation request approved successfully",
                    request_id: Number(request_id),
                    donation_id: request.donation_id,
                    request_status: "APPROVED",
                    donation_status: "REQUESTED",
                  });
                });
              }
            );

            return;
          }

          // ------------------------------------------------
          // Rejected request
          // Donation remains AVAILABLE
          // ------------------------------------------------

          return res.status(200).json({
            success: true,
            message:
              "Donation request rejected successfully",
            request_id: Number(request_id),
            donation_id: request.donation_id,
            request_status: "REJECTED",
            donation_status: request.donation_status,
          });
        }
      );
    }
  );
});

// ======================================================
// GET DONOR PROFILE
// ======================================================

app.get("/api/donors/:donor_id/profile", (req, res) => {
  const { donor_id } = req.params;

  const sql = `
    SELECT
      d.donor_id,
      d.user_id,
      d.organization_name,
      d.address,
      d.city,
      d.latitude,
      d.longitude,

      u.name,
      u.email,
      u.phone,
      u.role,
      u.status,
      u.created_at

    FROM donors d

    INNER JOIN users u
      ON d.user_id = u.user_id

    WHERE d.donor_id = ?
  `;

  db.query(sql, [donor_id], (err, results) => {
    if (err) {
      console.error("Error fetching donor profile:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch donor profile",
        error: err.message,
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Donor profile not found",
      });
    }

    res.json({
      success: true,
      profile: results[0],
    });
  });
});

// ======================================================
// UPDATE DONOR PROFILE
// ======================================================

app.put("/api/donors/:donor_id/profile", (req, res) => {
  const { donor_id } = req.params;

  const {
    phone,
    organization_name,
    address,
    city,
    latitude,
    longitude,
  } = req.body;

  // Phone is the only required editable account field
  if (!phone || !phone.trim()) {
    return res.status(400).json({
      success: false,
      message: "Phone number is required",
    });
  }

  // ======================================================
  // FIND DONOR
  // ======================================================

  const findDonorSql = `
    SELECT user_id
    FROM donors
    WHERE donor_id = ?
  `;

  db.query(
    findDonorSql,
    [donor_id],
    (findError, donorResults) => {
      if (findError) {
        console.error(
          "Error finding donor:",
          findError
        );

        return res.status(500).json({
          success: false,
          message: "Database error",
          error: findError.message,
        });
      }

      if (donorResults.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Donor not found",
        });
      }

      const userId = donorResults[0].user_id;

      // ==================================================
      // UPDATE USER INFORMATION
      // ==================================================

      const userSql = `
        UPDATE users
        SET phone = ?
        WHERE user_id = ?
      `;

      db.query(
        userSql,
        [phone.trim(), userId],
        (userError) => {
          if (userError) {
            console.error(
              "Error updating user profile:",
              userError
            );

            return res.status(500).json({
              success: false,
              message:
                "Failed to update user profile",
              error: userError.message,
            });
          }

          // ==============================================
          // UPDATE DONOR INFORMATION
          // ==============================================

          const donorSql = `
            UPDATE donors
            SET
              organization_name = ?,
              address = ?,
              city = ?,
              latitude = ?,
              longitude = ?
            WHERE donor_id = ?
          `;

          db.query(
            donorSql,
            [
              organization_name?.trim() || null,
              address?.trim() || null,
              city?.trim() || null,
              latitude !== ""
                ? latitude
                : null,
              longitude !== ""
                ? longitude
                : null,
              donor_id,
            ],
            (donorError) => {
              if (donorError) {
                console.error(
                  "Error updating donor profile:",
                  donorError
                );

                return res.status(500).json({
                  success: false,
                  message:
                    "Failed to update donor profile",
                  error: donorError.message,
                });
              }

              return res.status(200).json({
                success: true,
                message:
                  "Profile updated successfully",
              });
            }
          );
        }
      );
    }
  );
});

// ======================================================
// GET DONOR DONATION HISTORY
// ======================================================

app.get(
  "/api/donations/donor/:donor_id/history",
  (req, res) => {
    const { donor_id } = req.params;

    const sql = `
      SELECT
        d.donation_id,
        d.donor_id,
        d.food_type,
        d.quantity,
        d.unit,
        d.description,
        d.prepared_date,
        d.expiry_date,
        d.pickup_address,
        d.city,
        d.latitude,
        d.longitude,
        d.status AS donation_status,
        d.created_at,

        pd.pickup_id,
        pd.volunteer_id,
        pd.pickup_location,
        pd.delivery_location,
        pd.status AS pickup_status,
        pd.pickup_timestamp,
        pd.delivery_timestamp,

        u.name AS volunteer_name,
        u.phone AS volunteer_phone

      FROM donations d

      LEFT JOIN pickup_delivery pd
        ON pd.donation_id = d.donation_id

      LEFT JOIN volunteers v
        ON pd.volunteer_id = v.volunteer_id

      LEFT JOIN users u
        ON v.user_id = u.user_id

      WHERE d.donor_id = ?

      AND (
        d.status IN ('PICKED_UP', 'DELIVERED')
        OR pd.status IN (
          'PICKED_UP',
          'IN_TRANSIT',
          'DELIVERED'
        )
      )

      ORDER BY d.created_at DESC
    `;

    db.query(sql, [donor_id], (err, results) => {
      if (err) {
        console.error(
          "Error fetching donor history:",
          err
        );

        return res.status(500).json({
          success: false,
          message: "Failed to fetch donation history",
          error: err.message,
        });
      }

      res.json({
        success: true,
        donations: results,
      });
    });
  }
);

// ======================================================
// GET DONOR PICKUP / DELIVERY TRACKING
// ======================================================

app.get(
  "/api/donations/donor/:donor_id/pickups",
  (req, res) => {
    const { donor_id } = req.params;

    const sql = `
      SELECT
        pd.pickup_id,
        pd.donation_id,
        pd.volunteer_id,

        pd.pickup_location,
        pd.delivery_location,
        pd.status,
        pd.pickup_timestamp,
        pd.delivery_timestamp,

        d.food_type,
        d.quantity,
        d.unit,
        d.city,
        d.pickup_address,
        d.status AS donation_status,

        u.name AS volunteer_name,
        u.phone AS volunteer_phone,
        u.email AS volunteer_email

      FROM pickup_delivery pd

      INNER JOIN donations d
        ON pd.donation_id = d.donation_id

      INNER JOIN volunteers v
        ON pd.volunteer_id = v.volunteer_id

      INNER JOIN users u
        ON v.user_id = u.user_id

      WHERE d.donor_id = ?

      ORDER BY pd.pickup_id DESC
    `;

    db.query(sql, [donor_id], (err, results) => {
      if (err) {
        console.error(
          "Error fetching pickup tracking:",
          err
        );

        return res.status(500).json({
          success: false,
          message: "Failed to fetch pickup tracking",
          error: err.message,
        });
      }

      res.json({
        success: true,
        pickups: results,
      });
    });
  }
);

// ======================================================
// GET USER NOTIFICATIONS
// ======================================================

app.get(
  "/api/notifications/user/:user_id",
  (req, res) => {
    const { user_id } = req.params;

    const sql = `
      SELECT
        notification_id,
        user_id,
        message,
        type,
        status,
        created_date

      FROM notifications

      WHERE user_id = ?

      ORDER BY created_date DESC
    `;

    db.query(sql, [user_id], (err, results) => {
      if (err) {
        console.error(
          "Error fetching notifications:",
          err
        );

        return res.status(500).json({
          success: false,
          message: "Failed to fetch notifications",
          error: err.message,
        });
      }

      res.json({
        success: true,
        notifications: results,
      });
    });
  }
);

// ======================================================
// MARK NOTIFICATION AS READ
// ======================================================

app.put(
  "/api/notifications/:notification_id/read",
  (req, res) => {
    const { notification_id } = req.params;
    const { user_id } = req.body;

    const sql = `
      UPDATE notifications
      SET status = 'READ'
      WHERE notification_id = ?
        AND user_id = ?
    `;

    db.query(
      sql,
      [notification_id, user_id],
      (err, result) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Failed to update notification",
            error: err.message,
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            success: false,
            message: "Notification not found",
          });
        }

        res.json({
          success: true,
          message: "Notification marked as read",
        });
      }
    );
  }
);

// ======================================================
// GET UNREAD NOTIFICATION COUNT
// ======================================================

app.get(
  "/api/notifications/user/:user_id/unread-count",
  (req, res) => {
    const { user_id } = req.params;

    const sql = `
      SELECT COUNT(*) AS unread_count
      FROM notifications
      WHERE user_id = ?
        AND status = 'UNREAD'
    `;

    db.query(
      sql,
      [user_id],
      (err, results) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message:
              "Failed to fetch notification count",
            error: err.message,
          });
        }

        res.json({
          success: true,
          unread_count:
            Number(results[0].unread_count),
        });
      }
    );
  }
);

// ======================================================
// ADMIN DASHBOARD STATISTICS
// ======================================================

app.get("/api/admin/dashboard", (req, res) => {
  const sql = `
    SELECT

      /* Users */
      (SELECT COUNT(*)
       FROM users) AS total_users,

      /* Donors */
      (SELECT COUNT(*)
       FROM users
       WHERE role = 'DONOR') AS total_donors,

      /* NGOs / Receiving Organisations */
      (SELECT COUNT(*)
       FROM users
       WHERE role = 'NGO') AS total_ngos,

      /* Volunteers */
      (SELECT COUNT(*)
       FROM users
       WHERE role = 'VOLUNTEER') AS total_volunteers,

      /* Donations */
      (SELECT COUNT(*)
       FROM donations) AS total_donations,

      /* Available Donations */
      (SELECT COUNT(*)
       FROM donations
       WHERE status = 'AVAILABLE') AS available_donations,

      /* Pending Donation Requests */
      (SELECT COUNT(*)
       FROM donation_requests
       WHERE status = 'PENDING') AS pending_requests,

      /* Active Pickups */
      (SELECT COUNT(*)
       FROM pickup_delivery
       WHERE status IN ('ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'))
       AS active_pickups,

      /* Delivered Donations */
      (SELECT COUNT(*)
       FROM donations
       WHERE status = 'DELIVERED') AS delivered_donations,

      /* Completed Donations */
      (SELECT COUNT(*)
       FROM donations
       WHERE status = 'COMPLETED') AS completed_donations
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error(
        "Error fetching admin dashboard:",
        err
      );

      return res.status(500).json({
        success: false,
        message: "Failed to fetch admin dashboard",
        error: err.message,
      });
    }

    res.status(200).json({
      success: true,
      statistics: results[0],
    });
  });
});


// ======================================================
// ADMIN - GET ALL USERS
// ======================================================

app.get("/api/admin/users", (req, res) => {
  const sql = `
    SELECT
      u.user_id,
      u.name,
      u.email,
      u.phone,
      u.role,
      u.status,
      u.created_at,
      COALESCE(
        (SELECT n.city FROM ngos n WHERE n.user_id = u.user_id LIMIT 1),
        (SELECT v.city FROM volunteers v WHERE v.user_id = u.user_id LIMIT 1)
      ) AS city
    FROM users u
    ORDER BY u.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error(
        "Error fetching admin users:",
        err
      );

      return res.status(500).json({
        success: false,
        message: "Failed to fetch users",
        error: err.message,
      });
    }

    res.status(200).json({
      success: true,
      users: results,
    });
  });
});

// ======================================================
// ADMIN - UPDATE USER STATUS
// ======================================================

app.put("/api/admin/users/:user_id/status", (req, res) => {
  const { user_id } = req.params;
  const { status } = req.body;

  if (!status || !["ACTIVE", "INACTIVE"].includes(status.toUpperCase())) {
    return res.status(400).json({
      success: false,
      message: "Status must be either ACTIVE or INACTIVE",
    });
  }

  const sql = "UPDATE users SET status = ? WHERE user_id = ?";

  db.query(sql, [status.toUpperCase(), user_id], (err, result) => {
    if (err) {
      console.error("Error updating user status:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to update user status",
        error: err.message,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `User status successfully updated to ${status.toUpperCase()}`,
    });
  });
});

// ======================================================
// ADMIN - GET ALL DONATIONS
// ======================================================

app.get("/api/admin/donations", (req, res) => {
  const sql = `
    SELECT
      d.donation_id,
      d.donor_id,
      d.food_type,
      d.quantity,
      d.unit,
      d.description,
      d.prepared_date,
      d.expiry_date,
      d.pickup_address,
      d.city,
      d.latitude,
      d.longitude,
      d.status,
      d.created_at,

      u.name AS donor_name,
      u.email AS donor_email,
      u.phone AS donor_phone

    FROM donations d

    INNER JOIN donors dn
      ON d.donor_id = dn.donor_id

    INNER JOIN users u
      ON dn.user_id = u.user_id

    ORDER BY d.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error(
        "Error fetching admin donations:",
        err
      );

      return res.status(500).json({
        success: false,
        message: "Failed to fetch donations",
        error: err.message,
      });
    }

    res.status(200).json({
      success: true,
      donations: results,
    });
  });
});

// ======================================================
// ADMIN - GET DONATION DETAILS
// ======================================================

app.get(
  "/api/admin/donations/:donation_id",
  (req, res) => {
    const { donation_id } = req.params;

    const sql = `
      SELECT
        d.donation_id,
        d.donor_id,
        d.food_type,
        d.quantity,
        d.unit,
        d.description,
        d.prepared_date,
        d.expiry_date,
        d.pickup_address,
        d.city,
        d.latitude,
        d.longitude,
        d.status,
        d.created_at,

        u.name AS donor_name,
        u.email AS donor_email,
        u.phone AS donor_phone,

        pd.pickup_id,
        pd.volunteer_id,
        pd.pickup_location,
        pd.delivery_location,
        pd.status AS pickup_status,
        pd.pickup_timestamp,
        pd.delivery_timestamp,

        vu.name AS volunteer_name,
        vu.phone AS volunteer_phone

      FROM donations d

      INNER JOIN donors dn
        ON d.donor_id = dn.donor_id

      INNER JOIN users u
        ON dn.user_id = u.user_id

      LEFT JOIN pickup_delivery pd
        ON d.donation_id = pd.donation_id

      LEFT JOIN volunteers v
        ON pd.volunteer_id = v.volunteer_id

      LEFT JOIN users vu
        ON v.user_id = vu.user_id

      WHERE d.donation_id = ?
    `;

    db.query(
      sql,
      [donation_id],
      (err, results) => {
        if (err) {
          console.error(
            "Error fetching donation details:",
            err
          );

          return res.status(500).json({
            success: false,
            message: "Failed to fetch donation details",
            error: err.message,
          });
        }

        if (results.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Donation not found",
          });
        }

        res.status(200).json({
          success: true,
          donation: results[0],
        });
      }
    );
  }
);

// ======================================================
// ADMIN - UPDATE DONATION STATUS
// ======================================================

app.put("/api/admin/donations/:donation_id/status", (req, res) => {
  const { donation_id } = req.params;
  const { status } = req.body;

  const validStatuses = [
    "AVAILABLE",
    "REQUESTED",
    "ACCEPTED",
    "PICKED_UP",
    "DELIVERED",
    "CANCELLED",
  ];

  if (!status || !validStatuses.includes(status.toUpperCase())) {
    return res.status(400).json({
      success: false,
      message: `Status must be one of: ${validStatuses.join(", ")}`,
    });
  }

  const sql = "UPDATE donations SET status = ? WHERE donation_id = ?";

  db.query(sql, [status.toUpperCase(), donation_id], (err, result) => {
    if (err) {
      console.error("Error updating donation status:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to update donation status",
        error: err.message,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Donation not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `Donation status updated to ${status.toUpperCase()}`,
    });
  });
});

// ======================================================
// ADMIN - GET ALL VOLUNTEERS
// ======================================================

app.get("/api/admin/volunteers", (req, res) => {
  const sql = `
    SELECT
      v.volunteer_id,
      v.user_id,
      v.address,
      v.city,
      v.latitude,
      v.longitude,
      v.availability,

      u.name,
      u.email,
      u.phone,
      u.status,
      u.created_at

    FROM volunteers v

    INNER JOIN users u
      ON v.user_id = u.user_id

    ORDER BY u.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error(
        "Error fetching volunteers:",
        err
      );

      return res.status(500).json({
        success: false,
        message: "Failed to fetch volunteers",
        error: err.message,
      });
    }

    res.status(200).json({
      success: true,
      volunteers: results,
    });
  });
});

// ======================================================
// ADMIN - GET ALL PICKUPS
// ======================================================

app.get("/api/admin/pickups", (req, res) => {
  const sql = `
    SELECT
      pd.pickup_id,
      pd.donation_id,
      pd.volunteer_id,
      pd.pickup_location,
      pd.delivery_location,
      pd.status,
      pd.pickup_timestamp,
      pd.delivery_timestamp,

      d.food_type,
      d.quantity,
      d.unit,
      d.city,
      d.pickup_address,
      d.status AS donation_status,

      du.name AS donor_name,
      du.phone AS donor_phone,

      vu.name AS volunteer_name,
      vu.phone AS volunteer_phone,

      /* Receiving organisation of the approved request */
      (
        SELECT n.organization_name
        FROM donation_requests dr
        INNER JOIN ngos n ON dr.ngo_id = n.ngo_id
        WHERE dr.donation_id = pd.donation_id AND dr.status = 'APPROVED'
        ORDER BY dr.request_id DESC
        LIMIT 1
      ) AS ngo_name

    FROM pickup_delivery pd

    INNER JOIN donations d
      ON pd.donation_id = d.donation_id

    INNER JOIN donors dn
      ON d.donor_id = dn.donor_id

    INNER JOIN users du
      ON dn.user_id = du.user_id

    LEFT JOIN volunteers v
      ON pd.volunteer_id = v.volunteer_id

    LEFT JOIN users vu
      ON v.user_id = vu.user_id

    ORDER BY pd.pickup_id DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error(
        "Error fetching pickups:",
        err
      );

      return res.status(500).json({
        success: false,
        message: "Failed to fetch pickups",
        error: err.message,
      });
    }

    res.status(200).json({
      success: true,
      pickups: results,
    });
  });
});

// ======================================================
// ADMIN - DONATIONS AWAITING A VOLUNTEER
// Open pickups no volunteer has accepted yet (oldest
// first), so the admin can step in and assign one.
// ======================================================

app.get("/api/admin/pickups/pending", (req, res) => {
  const sql = `
    SELECT
      d.donation_id,
      d.food_type,
      d.quantity,
      d.unit,
      d.pickup_address,
      d.city,
      d.expiry_date,

      du.name AS donor_name,
      du.phone AS donor_phone,

      n.ngo_id,
      n.organization_name AS ngo_name,
      n.address AS ngo_address,
      n.city AS ngo_city,

      pd.pickup_id,
      dr.responded_at AS waiting_since,

      d.expiry_date AS pickup_deadline,
      TIMESTAMPDIFF(MINUTE, NOW(), d.expiry_date) AS minutes_to_deadline,
      (
        d.expiry_date IS NOT NULL
        AND d.expiry_date <= NOW() + INTERVAL ${ADMIN_ALERT_HOURS} HOUR
      ) AS needs_admin

    FROM donations d

    INNER JOIN donation_requests dr
      ON dr.donation_id = d.donation_id
     AND dr.status = 'APPROVED'

    INNER JOIN ngos n
      ON dr.ngo_id = n.ngo_id

    INNER JOIN donors dn
      ON d.donor_id = dn.donor_id

    INNER JOIN users du
      ON dn.user_id = du.user_id

    LEFT JOIN pickup_delivery pd
      ON pd.donation_id = d.donation_id

    WHERE (pd.pickup_id IS NULL OR pd.volunteer_id IS NULL)
      AND d.status NOT IN ('DELIVERED', 'CANCELLED')

    ORDER BY
      needs_admin DESC,
      d.expiry_date IS NULL,
      d.expiry_date ASC,
      dr.responded_at ASC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error(
        "Error fetching pending assignments:",
        err
      );

      return res.status(500).json({
        success: false,
        message: "Failed to fetch donations awaiting a volunteer",
        error: err.message,
      });
    }

    const pending = results.map((row) => ({
      ...row,
      needs_admin: Boolean(row.needs_admin),
    }));

    res.status(200).json({
      success: true,
      pending,
      alert_hours: ADMIN_ALERT_HOURS,
      needs_admin_count: pending.filter((row) => row.needs_admin).length,
    });
  });
});

// ======================================================
// ADMIN - ASSIGN / REASSIGN VOLUNTEER TO A DONATION
// Creates the pickup task if it doesn't exist yet.
// Reassigning is only allowed before pickup.
// ======================================================

app.put("/api/admin/donations/:donation_id/assign-volunteer", (req, res) => {
  const { donation_id } = req.params;
  const { volunteer_id } = req.body;

  if (!volunteer_id) {
    return res.status(400).json({
      success: false,
      message: "Volunteer ID is required",
    });
  }

  const donationSql = `
    SELECT
      d.donation_id,
      d.food_type,
      d.pickup_address,
      d.city,
      d.latitude,
      d.longitude,
      d.status AS donation_status,

      n.organization_name AS ngo_name,
      n.address AS ngo_address,
      n.city AS ngo_city,
      n.latitude AS ngo_latitude,
      n.longitude AS ngo_longitude,

      pd.pickup_id,
      pd.volunteer_id AS current_volunteer_id,
      pd.status AS pickup_status

    FROM donations d

    INNER JOIN donation_requests dr
      ON dr.donation_id = d.donation_id
     AND dr.status = 'APPROVED'

    INNER JOIN ngos n
      ON dr.ngo_id = n.ngo_id

    LEFT JOIN pickup_delivery pd
      ON pd.donation_id = d.donation_id

    WHERE d.donation_id = ?
    LIMIT 1
  `;

  db.query(donationSql, [donation_id], (dErr, dRes) => {
    if (dErr) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: dErr.message,
      });
    }

    if (dRes.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No approved NGO request found for this donation",
      });
    }

    const donation = dRes[0];

    if (donation.pickup_id && donation.pickup_status !== "ASSIGNED") {
      return res.status(400).json({
        success: false,
        message: "This food has already been picked up and can no longer be reassigned",
      });
    }

    const volunteerSql = `
      SELECT v.volunteer_id, v.availability, u.user_id, u.name, u.status,
        (
          SELECT COUNT(*) FROM pickup_delivery x
          WHERE x.volunteer_id = v.volunteer_id
            AND x.status IN ('ASSIGNED', 'PICKED_UP', 'IN_TRANSIT')
            AND x.donation_id <> ?
        ) AS active_count
      FROM volunteers v
      INNER JOIN users u ON v.user_id = u.user_id
      WHERE v.volunteer_id = ?
    `;

    db.query(volunteerSql, [donation_id, volunteer_id], (vErr, vRes) => {
      if (vErr || vRes.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Volunteer not found",
        });
      }

      const volunteer = vRes[0];

      if (volunteer.availability !== "AVAILABLE") {
        return res.status(400).json({
          success: false,
          message: `${volunteer.name} is currently unavailable`,
        });
      }

      if (Number(volunteer.active_count) > 0) {
        return res.status(409).json({
          success: false,
          message: `${volunteer.name} already has an active task. They must complete it before taking another.`,
        });
      }

      const pickupLocation = [donation.pickup_address, donation.city]
        .filter(Boolean)
        .join(", ");

      const deliveryLocation = [donation.ngo_name, donation.ngo_address, donation.ngo_city]
        .filter(Boolean)
        .join(", ");

      let saveSql;
      let saveParams;

      if (donation.pickup_id) {
        saveSql = "UPDATE pickup_delivery SET volunteer_id = ? WHERE pickup_id = ?";
        saveParams = [volunteer_id, donation.pickup_id];
      } else {
        saveSql = `
          INSERT INTO pickup_delivery (
            donation_id,
            volunteer_id,
            pickup_location,
            delivery_location,
            status,
            pickup_latitude,
            pickup_longitude,
            delivery_latitude,
            delivery_longitude
          )
          VALUES (?, ?, ?, ?, 'ASSIGNED', ?, ?, ?, ?)
        `;
        saveParams = [
          donation_id,
          volunteer_id,
          pickupLocation,
          deliveryLocation,
          donation.latitude,
          donation.longitude,
          donation.ngo_latitude,
          donation.ngo_longitude,
        ];
      }

      db.query(saveSql, saveParams, (sErr, sRes) => {
        if (sErr) {
          console.error("Error assigning volunteer:", sErr);

          return res.status(500).json({
            success: false,
            message: "Failed to assign volunteer",
            error: sErr.message,
          });
        }

        const pickupId = donation.pickup_id || sRes.insertId;

        db.query(
          "UPDATE donations SET status = 'ACCEPTED' WHERE donation_id = ? AND status IN ('AVAILABLE', 'REQUESTED')",
          [donation_id],
          () => {}
        );

        db.query(
          "INSERT INTO notifications (user_id, message, type, status, created_date) VALUES (?, ?, 'ASSIGNMENT', 'UNREAD', NOW())",
          [
            volunteer.user_id,
            `You have been assigned a pickup: ${donation.food_type} to ${donation.ngo_name}`,
          ],
          () => {}
        );

        res.status(200).json({
          success: true,
          message: `${volunteer.name} has been assigned to this pickup`,
          pickup_id: pickupId,
          volunteer_id: Number(volunteer_id),
        });
      });
    });
  });
});

// ======================================================
// ADMIN - GET ALL NGOS
// ======================================================

app.get("/api/admin/ngos", (req, res) => {
  const sql = `
    SELECT
      n.ngo_id,
      n.user_id,
      n.organization_name,
      n.registration_number,
      n.verification_status,
      n.address,
      n.city,
      n.latitude,
      n.longitude,

      u.name,
      u.email,
      u.phone,
      u.status,
      u.created_at

    FROM ngos n

    INNER JOIN users u
      ON n.user_id = u.user_id

    ORDER BY u.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error(
        "Error fetching NGOs:",
        err
      );

      return res.status(500).json({
        success: false,
        message: "Failed to fetch NGOs",
        error: err.message,
      });
    }

    res.status(200).json({
      success: true,
      ngos: results,
    });
  });
});

// ======================================================
// ADMIN - CHANGE NGO STATUS
// One status per NGO: PENDING, ACTIVE, DEACTIVE, REJECTED.
// Allowed moves:
//   PENDING  -> ACTIVE (accept) | REJECTED (reject)
//   ACTIVE   -> DEACTIVE
//   DEACTIVE -> ACTIVE
//   REJECTED -> ACTIVE (accept) | REJECTED (reject again)
// ======================================================

const NGO_STATUS_TRANSITIONS = {
  PENDING: ["ACTIVE", "REJECTED"],
  ACTIVE: ["DEACTIVE"],
  DEACTIVE: ["ACTIVE"],
  REJECTED: ["ACTIVE", "REJECTED"],
};

const NGO_STATUS_MESSAGES = {
  ACTIVE: "has been approved and is now Active. You can request surplus food.",
  DEACTIVE: "has been deactivated. Food requests are paused; contact the AnnSahyog team for help.",
  REJECTED: "could not be verified and was rejected. Please check your registration details.",
};

app.put("/api/admin/ngos/:ngo_id/verify", (req, res) => {
  const { ngo_id } = req.params;
  const newStatus = String(req.body.verification_status || "").toUpperCase();

  if (!Object.keys(NGO_STATUS_TRANSITIONS).includes(newStatus)) {
    return res.status(400).json({
      success: false,
      message: "Status must be PENDING, ACTIVE, DEACTIVE, or REJECTED",
    });
  }

  const findSql = "SELECT user_id, organization_name, verification_status FROM ngos WHERE ngo_id = ?";

  db.query(findSql, [ngo_id], (findErr, findRes) => {
    if (findErr) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: findErr.message,
      });
    }

    if (findRes.length === 0) {
      return res.status(404).json({
        success: false,
        message: "NGO not found",
      });
    }

    const ngo = findRes[0];
    const currentStatus = ngo.verification_status || "PENDING";

    if (!NGO_STATUS_TRANSITIONS[currentStatus].includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: `This NGO is ${currentStatus.toLowerCase()} and cannot be changed to ${newStatus.toLowerCase()}`,
      });
    }

    const sql = "UPDATE ngos SET verification_status = ? WHERE ngo_id = ?";

    db.query(sql, [newStatus, ngo_id], (err) => {
      if (err) {
        console.error("Error updating NGO status:", err);

        return res.status(500).json({
          success: false,
          message: "Failed to update NGO status",
          error: err.message,
        });
      }

      // Tell the NGO, unless nothing actually changed
      if (newStatus !== currentStatus && NGO_STATUS_MESSAGES[newStatus]) {
        const notifMsg = `Your NGO profile (${ngo.organization_name}) ${NGO_STATUS_MESSAGES[newStatus]}`;
        const notifSql = "INSERT INTO notifications (user_id, message, type, status, created_date) VALUES (?, ?, 'REQUEST', 'UNREAD', NOW())";
        db.query(notifSql, [ngo.user_id, notifMsg.slice(0, 255)], () => {});
      }

      res.status(200).json({
        success: true,
        message: `NGO status updated to ${newStatus}`,
        verification_status: newStatus,
      });
    });
  });
});

// ======================================================
// ADMIN - GET ALL FEEDBACK
// ======================================================

app.get("/api/admin/feedback", (req, res) => {
  const sql = `
    SELECT
      f.feedback_id,
      f.user_id,
      f.donation_id,
      f.comments,
      f.submitted_date,

      u.name AS user_name,
      u.email AS user_email,
      u.role AS user_role,

      d.food_type

    FROM feedback f

    LEFT JOIN users u
      ON f.user_id = u.user_id

    LEFT JOIN donations d
      ON f.donation_id = d.donation_id

    ORDER BY f.submitted_date DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching feedback:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch feedback",
        error: err.message,
      });
    }

    res.status(200).json({
      success: true,
      feedback: results,
    });
  });
});

// ======================================================
// NGO - DASHBOARD STATISTICS
// ======================================================

app.get("/api/ngos/:ngo_id/dashboard", (req, res) => {
  const { ngo_id } = req.params;

  const sql = `
    SELECT
      n.ngo_id,
      n.organization_name,
      n.city,
      n.verification_status,

      /* Available food donations */
      (SELECT COUNT(*)
       FROM donations
       WHERE status = 'AVAILABLE') AS available_donations,

      /* Pending claims submitted by this NGO */
      (SELECT COUNT(*)
       FROM donation_requests
       WHERE ngo_id = ?
         AND status = 'PENDING') AS pending_requests,

      /* Approved requests */
      (SELECT COUNT(*)
       FROM donation_requests
       WHERE ngo_id = ?
         AND status = 'APPROVED') AS approved_requests,

      /* Active deliveries in transit for this NGO */
      (SELECT COUNT(*)
       FROM pickup_delivery pd
       INNER JOIN donation_requests dr
         ON pd.donation_id = dr.donation_id
       WHERE dr.ngo_id = ?
         AND pd.status IN ('ASSIGNED', 'PICKED_UP', 'IN_TRANSIT')) AS active_deliveries,

      /* Completed deliveries */
      (SELECT COUNT(*)
       FROM donation_requests dr
       INNER JOIN donations d
         ON dr.donation_id = d.donation_id
       WHERE dr.ngo_id = ?
         AND dr.status = 'APPROVED'
         AND d.status IN ('DELIVERED', 'COMPLETED')) AS completed_deliveries,

      /* Total quantity in kg received */
      COALESCE((
        SELECT SUM(dr.requested_quantity)
        FROM donation_requests dr
        INNER JOIN donations d
          ON dr.donation_id = d.donation_id
        WHERE dr.ngo_id = ?
          AND dr.status = 'APPROVED'
          AND d.status IN ('DELIVERED', 'COMPLETED')
      ), 0) AS total_kg_received

    FROM ngos n
    WHERE n.ngo_id = ?
  `;

  db.query(sql, [ngo_id, ngo_id, ngo_id, ngo_id, ngo_id, ngo_id], (err, results) => {
    if (err) {
      console.error("Error fetching NGO dashboard:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch NGO dashboard stats",
        error: err.message,
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "NGO not found",
      });
    }

    res.status(200).json({
      success: true,
      dashboard: results[0],
      stats: results[0],
    });
  });
});

// ======================================================
// NGO - GET PROFILE
// ======================================================

app.get("/api/ngos/:ngo_id/profile", (req, res) => {
  const { ngo_id } = req.params;

  const sql = `
    SELECT
      n.ngo_id,
      n.user_id,
      n.organization_name,
      n.registration_number,
      n.address,
      n.city,
      n.latitude,
      n.longitude,
      n.verification_status,

      u.name,
      u.email,
      u.phone,
      u.status,
      u.created_at

    FROM ngos n
    INNER JOIN users u
      ON n.user_id = u.user_id
    WHERE n.ngo_id = ?
  `;

  db.query(sql, [ngo_id], (err, results) => {
    if (err) {
      console.error("Error fetching NGO profile:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch NGO profile",
        error: err.message,
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "NGO profile not found",
      });
    }

    res.status(200).json({
      success: true,
      profile: results[0],
    });
  });
});

// ======================================================
// NGO - UPDATE PROFILE
// ======================================================

app.put("/api/ngos/:ngo_id/profile", (req, res) => {
  const { ngo_id } = req.params;
  const {
    name,
    phone,
    organization_name,
    registration_number,
    address,
    city,
  } = req.body;

  const findSql = "SELECT user_id FROM ngos WHERE ngo_id = ?";
  db.query(findSql, [ngo_id], (findErr, findRes) => {
    if (findErr || findRes.length === 0) {
      return res.status(404).json({
        success: false,
        message: "NGO profile not found",
      });
    }

    const userId = findRes[0].user_id;

    const userName = name || req.body.contact_person || null;
    const userPhone = phone || null;

    const userUpdateSql = "UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone) WHERE user_id = ?";
    db.query(userUpdateSql, [userName, userPhone, userId], (uErr) => {
      if (uErr) {
        return res.status(500).json({
          success: false,
          message: "Failed to update user info",
          error: uErr.message,
        });
      }

      const ngoUpdateSql = `
        UPDATE ngos
        SET organization_name = ?, registration_number = ?, address = ?, city = ?
        WHERE ngo_id = ?
      `;

      db.query(
        ngoUpdateSql,
        [organization_name, registration_number, address, city, ngo_id],
        (nErr) => {
          if (nErr) {
            return res.status(500).json({
              success: false,
              message: "Failed to update NGO details",
              error: nErr.message,
            });
          }

          res.status(200).json({
            success: true,
            message: "NGO profile updated successfully",
          });
        }
      );
    });
  });
});

// ======================================================
// NGO - REQUEST FOOD (SUBMIT DONATION CLAIM)
// ======================================================

app.post("/api/donation-requests", (req, res) => {
  const { donation_id, ngo_id, requested_quantity, message } = req.body;

  if (!donation_id || !ngo_id || !requested_quantity) {
    return res.status(400).json({
      success: false,
      message: "Donation ID, NGO ID, and requested quantity are required",
    });
  }

  // Check NGO verification
  const ngoCheckSql = "SELECT ngo_id, organization_name, verification_status FROM ngos WHERE ngo_id = ?";
  db.query(ngoCheckSql, [ngo_id], (ngoErr, ngoRes) => {
    if (ngoErr || ngoRes.length === 0) {
      return res.status(404).json({
        success: false,
        message: "NGO not found",
      });
    }

    const ngo = ngoRes[0];
    if (ngo.verification_status !== "ACTIVE") {
      const blockedMessages = {
        DEACTIVE: "Your NGO account has been deactivated. Please contact the AnnSahyog team to reactivate it.",
        REJECTED: "Your NGO registration was rejected. Please update your details and contact the AnnSahyog team.",
      };

      return res.status(403).json({
        success: false,
        message:
          blockedMessages[ngo.verification_status] ||
          "Your NGO account is pending admin verification. Food requests will be enabled once approved.",
      });
    }

    // Check donation availability & quantity
    const donCheckSql = `
      SELECT d.donation_id, d.donor_id, d.food_type, d.quantity, d.status, dn.user_id AS donor_user_id
      FROM donations d
      INNER JOIN donors dn ON d.donor_id = dn.donor_id
      WHERE d.donation_id = ?
    `;

    db.query(donCheckSql, [donation_id], (donErr, donRes) => {
      if (donErr || donRes.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Donation not found",
        });
      }

      const donation = donRes[0];
      if (donation.status !== "AVAILABLE") {
        return res.status(400).json({
          success: false,
          message: `This donation is currently ${donation.status.toLowerCase()} and cannot be requested.`,
        });
      }

      if (Number(requested_quantity) > Number(donation.quantity)) {
        return res.status(400).json({
          success: false,
          message: `Requested quantity (${requested_quantity}) exceeds available quantity (${donation.quantity}).`,
        });
      }

      // Check if duplicate pending request
      const dupSql = "SELECT request_id FROM donation_requests WHERE donation_id = ? AND ngo_id = ? AND status = 'PENDING'";
      db.query(dupSql, [donation_id, ngo_id], (dupErr, dupRes) => {
        if (!dupErr && dupRes.length > 0) {
          return res.status(409).json({
            success: false,
            message: "You already have a pending request for this donation.",
          });
        }

        // Insert request
        const insertSql = `
          INSERT INTO donation_requests (donation_id, ngo_id, requested_quantity, message, status, requested_at)
          VALUES (?, ?, ?, ?, 'PENDING', CURRENT_TIMESTAMP)
        `;

        db.query(
          insertSql,
          [donation_id, ngo_id, requested_quantity, message || null],
          (insertErr, insertRes) => {
            if (insertErr) {
              console.error("Error creating donation request:", insertErr);
              return res.status(500).json({
                success: false,
                message: "Failed to create donation request",
                error: insertErr.message,
              });
            }

            // Create notification for donor
            const notifMsg = `New food request from "${ngo.organization_name}" for ${requested_quantity} of "${donation.food_type}".`;
            const notifSql = "INSERT INTO notifications (user_id, message, type, status, created_date) VALUES (?, ?, 'REQUEST', 'UNREAD', NOW())";
            db.query(notifSql, [donation.donor_user_id, notifMsg], () => {});

            res.status(201).json({
              success: true,
              message: "Food request submitted successfully! The donor has been notified.",
              request_id: insertRes.insertId,
            });
          }
        );
      });
    });
  });
});

// ======================================================
// NGO - GET ALL REQUESTS FOR THIS NGO (TRACK REQUESTS)
// ======================================================

app.get("/api/donation-requests/ngo/:ngo_id", (req, res) => {
  const { ngo_id } = req.params;

  const sql = `
    SELECT
      dr.request_id,
      dr.donation_id,
      dr.ngo_id,
      dr.requested_quantity,
      dr.message,
      dr.status AS request_status,
      dr.requested_at,
      dr.responded_at,

      d.food_type,
      d.quantity AS total_quantity,
      d.unit,
      d.prepared_date,
      d.expiry_date,
      d.pickup_address,
      d.city,
      d.status AS donation_status,

      u.name AS donor_name,
      u.email AS donor_email,
      u.phone AS donor_phone,

      pd.pickup_id,
      pd.status AS delivery_status,
      pd.pickup_timestamp,
      pd.delivery_timestamp,

      vu.name AS volunteer_name,
      vu.phone AS volunteer_phone

    FROM donation_requests dr

    INNER JOIN donations d
      ON dr.donation_id = d.donation_id

    INNER JOIN donors dn
      ON d.donor_id = dn.donor_id

    INNER JOIN users u
      ON dn.user_id = u.user_id

    LEFT JOIN pickup_delivery pd
      ON d.donation_id = pd.donation_id

    LEFT JOIN volunteers v
      ON pd.volunteer_id = v.volunteer_id

    LEFT JOIN users vu
      ON v.user_id = vu.user_id

    WHERE dr.ngo_id = ?

    ORDER BY dr.requested_at DESC
  `;

  db.query(sql, [ngo_id], (err, results) => {
    if (err) {
      console.error("Error fetching NGO requests:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch donation requests",
        error: err.message,
      });
    }

    res.status(200).json({
      success: true,
      requests: results,
    });
  });
});

// ======================================================
// NGO - CANCEL PENDING REQUEST
// ======================================================

app.put("/api/donation-requests/:request_id/cancel", (req, res) => {
  const { request_id } = req.params;
  const { ngo_id } = req.body;

  const sql = `
    UPDATE donation_requests
    SET status = 'CANCELLED'
    WHERE request_id = ?
      AND ngo_id = ?
      AND status = 'PENDING'
  `;

  db.query(sql, [request_id, ngo_id], (err, result) => {
    if (err) {
      console.error("Error cancelling request:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to cancel request",
        error: err.message,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: "Request could not be cancelled. It may have already been responded to.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Food request has been cancelled.",
    });
  });
});

// ======================================================
// NGO - GET INCOMING & PAST DELIVERIES
// ======================================================

app.get("/api/ngos/:ngo_id/deliveries", (req, res) => {
  const { ngo_id } = req.params;

  const sql = `
    SELECT
      pd.pickup_id,
      pd.donation_id,
      pd.volunteer_id,
      pd.pickup_location,
      pd.delivery_location,
      pd.status AS delivery_status,
      pd.pickup_timestamp,
      pd.delivery_timestamp,

      dr.request_id,
      dr.requested_quantity,
      dr.status AS request_status,

      d.food_type,
      d.unit,
      d.city,
      d.status AS donation_status,

      du.name AS donor_name,
      du.phone AS donor_phone,

      vu.name AS volunteer_name,
      vu.phone AS volunteer_phone

    FROM pickup_delivery pd

    INNER JOIN donations d
      ON pd.donation_id = d.donation_id

    INNER JOIN donors dn
      ON d.donor_id = dn.donor_id

    INNER JOIN users du
      ON dn.user_id = du.user_id

    INNER JOIN donation_requests dr
      ON d.donation_id = dr.donation_id

    LEFT JOIN volunteers v
      ON pd.volunteer_id = v.volunteer_id

    LEFT JOIN users vu
      ON v.user_id = vu.user_id

    WHERE dr.ngo_id = ?
      AND dr.status = 'APPROVED'

    ORDER BY pd.pickup_id DESC
  `;

  db.query(sql, [ngo_id], (err, results) => {
    if (err) {
      console.error("Error fetching deliveries:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch deliveries",
        error: err.message,
      });
    }

    res.status(200).json({
      success: true,
      deliveries: results,
    });
  });
});

// ======================================================
// NGO - CONFIRM DELIVERY RECEIPT
// ======================================================

const guardConfirm = (req, res, next) => {
  db.query(
    `SELECT pd.status FROM pickup_delivery pd
     INNER JOIN donation_requests dr ON dr.donation_id = pd.donation_id AND dr.status = 'APPROVED'
     WHERE pd.pickup_id = ? AND dr.ngo_id = ?`,
    [req.params.pickup_id, req.user.ngo_id],
    (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: "Database error" });
      if (!rows.length) {
        return res.status(403).json({ success: false, message: "You can only confirm deliveries sent to your organization." });
      }
      if (rows[0].status !== "DELIVERED") {
        return res.status(400).json({ success: false, message: "Delivery must be marked as delivered before confirming receipt." });
      }
      next();
    }
  );
};

app.put("/api/pickup-delivery/:pickup_id/confirm-receipt", requireAuth(["NGO"]), guardConfirm, (req, res) => {
  const { pickup_id } = req.params;

  const updateDeliverySql = `
    UPDATE pickup_delivery
    SET status = 'DELIVERED', delivery_timestamp = CURRENT_TIMESTAMP
    WHERE pickup_id = ?
  `;

  db.query(updateDeliverySql, [pickup_id], (err, result) => {
    if (err) {
      console.error("Error confirming delivery receipt:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to confirm delivery receipt",
        error: err.message,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Delivery record not found",
      });
    }

    // Complete donation
    const lookupSql = "SELECT donation_id FROM pickup_delivery WHERE pickup_id = ?";
    db.query(lookupSql, [pickup_id], (lookupErr, lookupRes) => {
      if (!lookupErr && lookupRes.length > 0) {
        const donationId = lookupRes[0].donation_id;
        db.query("UPDATE donations SET status = 'COMPLETED' WHERE donation_id = ?", [donationId], (updErr) => {
          if (updErr) console.error("Error marking donation COMPLETED:", updErr.message);
        });
      }
    });

    res.status(200).json({
      success: true,
      message: "Delivery confirmed! Surplus food has been marked as safely received.",
    });
  });
});

// ======================================================
// COMMUNITY FEEDBACK SUBMISSION
// ======================================================

app.post("/api/feedback", (req, res) => {
  const { user_id, donation_id, comments } = req.body;

  if (!user_id || !comments) {
    return res.status(400).json({
      success: false,
      message: "User ID and comments are required",
    });
  }

  const sql = `
    INSERT INTO feedback (user_id, donation_id, comments, submitted_date)
    VALUES (?, ?, ?, NOW())
  `;

  db.query(sql, [user_id, donation_id || null, comments], (err, result) => {
    if (err) {
      console.error("Error saving feedback:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to save feedback",
        error: err.message,
      });
    }

    res.status(201).json({
      success: true,
      message: "Thank you for your feedback!",
      feedback_id: result.insertId,
    });
  });
});

// ======================================================
// VOLUNTEER MODULE API ENDPOINTS
// ======================================================

// GET VOLUNTEER DASHBOARD METRICS
app.get("/api/volunteers/:volunteer_id/dashboard", (req, res) => {
  const { volunteer_id } = req.params;

  const volSql = `
    SELECT
      v.volunteer_id,
      v.user_id,
      v.address,
      v.city,
      v.availability,
      u.name,
      u.email,
      u.phone
    FROM volunteers v
    INNER JOIN users u ON v.user_id = u.user_id
    WHERE v.volunteer_id = ?
  `;

  db.query(volSql, [volunteer_id], (vErr, vRes) => {
    if (vErr || vRes.length === 0) {
      return res.status(404).json({ success: false, message: "Volunteer not found" });
    }

    const volunteer = vRes[0];

    const statsSql = `
      SELECT
        COUNT(CASE WHEN pd.volunteer_id = ? AND pd.status IN ('ASSIGNED', 'PICKED_UP', 'IN_TRANSIT') THEN 1 END) AS active_tasks_count,
        COUNT(CASE WHEN pd.volunteer_id = ? AND pd.status = 'DELIVERED' THEN 1 END) AS completed_tasks_count,
        COUNT(CASE WHEN pd.volunteer_id IS NULL AND pd.status = 'ASSIGNED' AND ${inVolunteerArea("me", "d")} THEN 1 END) AS open_tasks_count,
        COALESCE(SUM(CASE WHEN pd.volunteer_id = ? AND pd.status = 'DELIVERED' THEN d.quantity ELSE 0 END), 0) AS total_kg_delivered
      FROM pickup_delivery pd
      LEFT JOIN donations d ON pd.donation_id = d.donation_id
      INNER JOIN volunteers me ON me.volunteer_id = ?
    `;

    db.query(statsSql, [volunteer_id, volunteer_id, volunteer_id, volunteer_id], (sErr, sRes) => {
      if (sErr) {
        return res.status(500).json({ success: false, message: "Failed to fetch stats", error: sErr.message });
      }

      const activeTaskSql = `
        SELECT
          pd.pickup_id,
          pd.status,
          pd.pickup_location,
          pd.delivery_location,
          pd.pickup_timestamp,
          d.food_type,
          d.quantity,
          d.unit,
          d.city,
          du.name AS donor_name,
          du.phone AS donor_phone
        FROM pickup_delivery pd
        INNER JOIN donations d ON pd.donation_id = d.donation_id
        INNER JOIN donors dn ON d.donor_id = dn.donor_id
        INNER JOIN users du ON dn.user_id = du.user_id
        WHERE pd.volunteer_id = ? AND pd.status IN ('ASSIGNED', 'PICKED_UP', 'IN_TRANSIT')
        ORDER BY pd.pickup_id DESC
        LIMIT 1
      `;

      db.query(activeTaskSql, [volunteer_id], (aErr, aRes) => {
        res.status(200).json({
          success: true,
          volunteer,
          stats: {
            active_tasks: sRes[0]?.active_tasks_count || 0,
            completed_tasks: sRes[0]?.completed_tasks_count || 0,
            open_tasks: sRes[0]?.open_tasks_count || 0,
            total_kg_delivered: sRes[0]?.total_kg_delivered || 0,
            estimated_meals: Math.round((sRes[0]?.total_kg_delivered || 0) * 2.5),
            availability: volunteer.availability,
          },
          active_task: aRes && aRes.length > 0 ? aRes[0] : null,
        });
      });
    });
  });
});

// GET VOLUNTEER PROFILE
app.get("/api/volunteers/:volunteer_id/profile", (req, res) => {
  const { volunteer_id } = req.params;

  const sql = `
    SELECT
      v.volunteer_id,
      v.user_id,
      v.address,
      v.city,
      v.availability,
      u.name,
      u.email,
      u.phone,
      u.status,
      u.created_at
    FROM volunteers v
    INNER JOIN users u ON v.user_id = u.user_id
    WHERE v.volunteer_id = ?
  `;

  db.query(sql, [volunteer_id], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ success: false, message: "Volunteer profile not found" });
    }
    res.status(200).json({ success: true, profile: results[0] });
  });
});

// UPDATE VOLUNTEER PROFILE
app.put("/api/volunteers/:volunteer_id/profile", (req, res) => {
  const { volunteer_id } = req.params;
  const { name, phone, address, city } = req.body;

  const findSql = "SELECT user_id FROM volunteers WHERE volunteer_id = ?";
  db.query(findSql, [volunteer_id], (findErr, findRes) => {
    if (findErr || findRes.length === 0) {
      return res.status(404).json({ success: false, message: "Volunteer not found" });
    }

    const userId = findRes[0].user_id;
    const userUpdateSql = "UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone) WHERE user_id = ?";
    db.query(userUpdateSql, [name || null, phone || null, userId], (uErr) => {
      if (uErr) {
        return res.status(500).json({ success: false, message: "Failed to update user details", error: uErr.message });
      }

      const volUpdateSql = "UPDATE volunteers SET address = ?, city = ? WHERE volunteer_id = ?";
      db.query(volUpdateSql, [address, city, volunteer_id], (vErr) => {
        if (vErr) {
          return res.status(500).json({ success: false, message: "Failed to update volunteer details", error: vErr.message });
        }

        res.status(200).json({ success: true, message: "Volunteer profile updated successfully" });
      });
    });
  });
});

// TOGGLE VOLUNTEER AVAILABILITY (SET AVAILABILITY)
app.put("/api/volunteers/:volunteer_id/availability", (req, res) => {
  const { volunteer_id } = req.params;
  const { availability } = req.body;

  if (!["AVAILABLE", "UNAVAILABLE"].includes(availability)) {
    return res.status(400).json({ success: false, message: "Availability must be AVAILABLE or UNAVAILABLE" });
  }

  const sql = "UPDATE volunteers SET availability = ? WHERE volunteer_id = ?";
  db.query(sql, [availability, volunteer_id], (err) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to update availability", error: err.message });
    }
    res.status(200).json({ success: true, message: `Availability updated to ${availability}`, availability });
  });
});

// GET VOLUNTEER TASKS: their own + open tasks in their area
app.get("/api/volunteers/:volunteer_id/tasks", (req, res) => {
  const { volunteer_id } = req.params;

  const sql = `
    SELECT
      pd.pickup_id,
      pd.donation_id,
      pd.volunteer_id,
      pd.pickup_location,
      pd.delivery_location,
      pd.status,
      pd.pickup_timestamp,
      pd.delivery_timestamp,
      COALESCE(pd.pickup_latitude, d.latitude) AS pickup_latitude,
      COALESCE(pd.pickup_longitude, d.longitude) AS pickup_longitude,
      pd.delivery_latitude,
      pd.delivery_longitude,

      d.food_type,
      d.quantity,
      d.unit,
      d.description AS food_description,
      d.prepared_date,
      d.expiry_date,
      d.pickup_address,
      d.city,

      (SELECT n.organization_name FROM donation_requests dr JOIN ngos n ON n.ngo_id = dr.ngo_id
        WHERE dr.donation_id = d.donation_id AND dr.status = 'APPROVED' ORDER BY dr.request_id DESC LIMIT 1) AS ngo_name,
      (SELECT nu.name FROM donation_requests dr JOIN ngos n ON n.ngo_id = dr.ngo_id JOIN users nu ON nu.user_id = n.user_id
        WHERE dr.donation_id = d.donation_id AND dr.status = 'APPROVED' ORDER BY dr.request_id DESC LIMIT 1) AS ngo_contact_name,
      (SELECT nu.phone FROM donation_requests dr JOIN ngos n ON n.ngo_id = dr.ngo_id JOIN users nu ON nu.user_id = n.user_id
        WHERE dr.donation_id = d.donation_id AND dr.status = 'APPROVED' ORDER BY dr.request_id DESC LIMIT 1) AS ngo_contact_phone,

      du.name AS donor_name,
      du.phone AS donor_phone,
      du.email AS donor_email,

      vu.name AS volunteer_name,

      CASE
        WHEN pd.volunteer_id = me.volunteer_id THEN 'ASSIGNED_TO_ME'
        ELSE 'OPEN'
      END AS task_assignment_type

    FROM pickup_delivery pd

    INNER JOIN volunteers me
      ON me.volunteer_id = ?

    INNER JOIN donations d
      ON pd.donation_id = d.donation_id

    INNER JOIN donors dn
      ON d.donor_id = dn.donor_id

    INNER JOIN users du
      ON dn.user_id = du.user_id

    LEFT JOIN volunteers v
      ON pd.volunteer_id = v.volunteer_id

    LEFT JOIN users vu
      ON v.user_id = vu.user_id

    WHERE pd.volunteer_id = me.volunteer_id
       OR (
         pd.volunteer_id IS NULL
         AND pd.status = 'ASSIGNED'
         AND ${inVolunteerArea("me", "d")}
       )

    ORDER BY
      CASE
        WHEN pd.status = 'IN_TRANSIT' THEN 1
        WHEN pd.status = 'PICKED_UP' THEN 2
        WHEN pd.status = 'ASSIGNED' AND pd.volunteer_id IS NOT NULL THEN 3
        WHEN pd.status = 'ASSIGNED' THEN 4
        ELSE 5
      END,
      pd.pickup_id DESC
  `;

  db.query(sql, [volunteer_id], (err, results) => {
    if (err) {
      console.error("Error fetching volunteer tasks:", err);
      return res.status(500).json({ success: false, message: "Failed to fetch tasks", error: err.message });
    }

    res.status(200).json({ success: true, tasks: results });
  });
});

// GET SINGLE PICKUP TASK DETAILS
app.get("/api/volunteers/tasks/:pickup_id", (req, res) => {
  const { pickup_id } = req.params;

  const sql = `
    SELECT
      pd.pickup_id,
      pd.donation_id,
      pd.volunteer_id,
      pd.pickup_location,
      pd.delivery_location,
      pd.status,
      pd.pickup_timestamp,
      pd.delivery_timestamp,
      COALESCE(pd.pickup_latitude, d.latitude) AS pickup_latitude,
      COALESCE(pd.pickup_longitude, d.longitude) AS pickup_longitude,
      pd.delivery_latitude,
      pd.delivery_longitude,

      d.food_type,
      d.quantity,
      d.unit,
      d.description AS food_description,
      d.prepared_date,
      d.expiry_date,
      d.pickup_address,
      d.city,
      d.latitude,
      d.longitude,

      (SELECT n.organization_name FROM donation_requests dr JOIN ngos n ON n.ngo_id = dr.ngo_id
        WHERE dr.donation_id = d.donation_id AND dr.status = 'APPROVED' ORDER BY dr.request_id DESC LIMIT 1) AS ngo_name,
      (SELECT nu.name FROM donation_requests dr JOIN ngos n ON n.ngo_id = dr.ngo_id JOIN users nu ON nu.user_id = n.user_id
        WHERE dr.donation_id = d.donation_id AND dr.status = 'APPROVED' ORDER BY dr.request_id DESC LIMIT 1) AS ngo_contact_name,
      (SELECT nu.phone FROM donation_requests dr JOIN ngos n ON n.ngo_id = dr.ngo_id JOIN users nu ON nu.user_id = n.user_id
        WHERE dr.donation_id = d.donation_id AND dr.status = 'APPROVED' ORDER BY dr.request_id DESC LIMIT 1) AS ngo_contact_phone,

      du.name AS donor_name,
      du.phone AS donor_phone,
      du.email AS donor_email,

      vu.name AS volunteer_name,
      vu.phone AS volunteer_phone

    FROM pickup_delivery pd

    INNER JOIN donations d
      ON pd.donation_id = d.donation_id

    INNER JOIN donors dn
      ON d.donor_id = dn.donor_id

    INNER JOIN users du
      ON dn.user_id = du.user_id

    LEFT JOIN volunteers v
      ON pd.volunteer_id = v.volunteer_id

    LEFT JOIN users vu
      ON v.user_id = vu.user_id

    WHERE pd.pickup_id = ?
  `;

  db.query(sql, [pickup_id], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    res.status(200).json({ success: true, task: results[0] });
  });
});

// ACCEPT AN OPEN TASK IN THE VOLUNTEER'S AREA
// First volunteer to accept gets it; the UPDATE only succeeds
// while the task is still unclaimed.
const guardAccept = (req, res, next) => {
  const { volunteer_id } = req.body || {};
  if (volunteer_id && (!req.user.volunteer_id || Number(volunteer_id) !== Number(req.user.volunteer_id))) {
    return res.status(403).json({ success: false, message: "You can only accept tasks for your own volunteer account." });
  }
  next();
};

app.put("/api/volunteers/tasks/:pickup_id/accept", requireAuth(["VOLUNTEER"]), guardAccept, (req, res) => {
  const { pickup_id } = req.params;
  const { volunteer_id } = req.body;

  if (!volunteer_id) {
    return res.status(400).json({ success: false, message: "Volunteer ID is required" });
  }

  const checkSql = `
    SELECT
      pd.pickup_id,
      pd.donation_id,
      pd.volunteer_id,
      pd.status,
      me.availability,
      ${inVolunteerArea("me", "d")} AS in_area,
      (
        SELECT COUNT(*) FROM pickup_delivery x
        WHERE x.volunteer_id = ? AND x.status IN ('ASSIGNED', 'PICKED_UP', 'IN_TRANSIT')
      ) AS active_count
    FROM pickup_delivery pd
    INNER JOIN donations d ON pd.donation_id = d.donation_id
    INNER JOIN volunteers me ON me.volunteer_id = ?
    WHERE pd.pickup_id = ?
  `;

  db.query(checkSql, [volunteer_id, volunteer_id, pickup_id], (cErr, cRes) => {
    if (cErr) {
      return res.status(500).json({ success: false, message: "Database error", error: cErr.message });
    }

    if (cRes.length === 0) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const task = cRes[0];

    if (task.volunteer_id === Number(volunteer_id)) {
      return res.status(200).json({ success: true, message: "This task is already yours.", pickup_id: Number(pickup_id) });
    }

    if (task.volunteer_id || task.status !== "ASSIGNED") {
      return res.status(409).json({ success: false, message: "This task has already been taken by another volunteer." });
    }

    if (task.availability !== "AVAILABLE") {
      return res.status(400).json({ success: false, message: "Go on duty before accepting tasks." });
    }

    if (!task.in_area) {
      return res.status(403).json({ success: false, message: "This pickup is outside your area." });
    }

    if (Number(task.active_count) > 0) {
      return res.status(409).json({
        success: false,
        message: "You already have an active task. Complete it before accepting another one.",
      });
    }

    const updateSql = "UPDATE pickup_delivery SET volunteer_id = ? WHERE pickup_id = ? AND volunteer_id IS NULL";

    db.query(updateSql, [volunteer_id, pickup_id], (uErr, uRes) => {
      if (uErr) {
        return res.status(500).json({ success: false, message: "Failed to accept task", error: uErr.message });
      }

      if (uRes.affectedRows === 0) {
        return res.status(409).json({ success: false, message: "This task has already been taken by another volunteer." });
      }

      db.query(
        "UPDATE donations SET status = 'ACCEPTED' WHERE donation_id = ? AND status IN ('AVAILABLE', 'REQUESTED')",
        [task.donation_id],
        () => {}
      );

      res.status(200).json({ success: true, message: "Rescue task accepted! You are now the assigned driver.", pickup_id: Number(pickup_id) });
    });
  });
});

// UPDATE TASK / DELIVERY STATUS (PICKUP FOOD, DELIVER FOOD, UPDATE DELIVERY STATUS, COMPLETE TASK)
const guardTaskOwner = (req, res, next) => {
  db.query("SELECT volunteer_id FROM pickup_delivery WHERE pickup_id = ?", [req.params.pickup_id], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: "Database error" });
    if (!rows.length) return res.status(404).json({ success: false, message: "Task not found" });
    if (!req.user.volunteer_id || Number(rows[0].volunteer_id) !== Number(req.user.volunteer_id)) {
      return res.status(403).json({ success: false, message: "This task is not assigned to you." });
    }
    next();
  });
};

app.put("/api/volunteers/tasks/:pickup_id/status", requireAuth(["VOLUNTEER"]), guardTaskOwner, (req, res) => {
  const { pickup_id } = req.params;
  const { status, notes } = req.body;

  const validStatuses = ["ASSIGNED", "PICKED_UP", "IN_TRANSIT", "DELIVERED"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status value" });
  }

  let updateSql;
  let params;

  if (status === "PICKED_UP") {
    updateSql = "UPDATE pickup_delivery SET status = ?, pickup_timestamp = COALESCE(pickup_timestamp, CURRENT_TIMESTAMP) WHERE pickup_id = ? AND volunteer_id IS NOT NULL";
    params = [status, pickup_id];
  } else if (status === "DELIVERED") {
    updateSql = "UPDATE pickup_delivery SET status = ?, delivery_timestamp = CURRENT_TIMESTAMP WHERE pickup_id = ? AND volunteer_id IS NOT NULL";
    params = [status, pickup_id];
  } else {
    updateSql = "UPDATE pickup_delivery SET status = ? WHERE pickup_id = ? AND volunteer_id IS NOT NULL";
    params = [status, pickup_id];
  }

  db.query(updateSql, params, (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to update delivery status", error: err.message });
    }

    // Only a task with a driver can move along (accept it first)
    if (result.affectedRows === 0) {
      return res.status(400).json({ success: false, message: "Accept this task before updating its delivery status." });
    }

    // Keep the donation's status in step with the run
    // (COMPLETED isn't a valid donation status, so delivered -> DELIVERED)
    const donationStatus = { PICKED_UP: "PICKED_UP", DELIVERED: "DELIVERED" }[status];
    if (donationStatus) {
      const getDonSql = "SELECT donation_id FROM pickup_delivery WHERE pickup_id = ?";
      db.query(getDonSql, [pickup_id], (dErr, dRes) => {
        if (!dErr && dRes.length > 0) {
          db.query("UPDATE donations SET status = ? WHERE donation_id = ?", [donationStatus, dRes[0].donation_id], () => {});
        }
      });
    }

    res.status(200).json({
      success: true,
      message: `Delivery status updated to ${status}`,
      status,
    });
  });
});

// GET VOLUNTEER ACTIVITY HISTORY
app.get("/api/volunteers/:volunteer_id/history", (req, res) => {
  const { volunteer_id } = req.params;

  const sql = `
    SELECT
      pd.pickup_id,
      pd.donation_id,
      pd.pickup_location,
      pd.delivery_location,
      pd.status,
      pd.pickup_timestamp,
      pd.delivery_timestamp,

      d.food_type,
      d.quantity,
      d.unit,
      d.city,

      du.name AS donor_name,
      du.phone AS donor_phone,

      f.comments AS feedback_comments

    FROM pickup_delivery pd

    INNER JOIN donations d
      ON pd.donation_id = d.donation_id

    INNER JOIN donors dn
      ON d.donor_id = dn.donor_id

    INNER JOIN users du
      ON dn.user_id = du.user_id

    LEFT JOIN feedback f
      ON f.donation_id = d.donation_id

    WHERE pd.volunteer_id = ?
      AND pd.status = 'DELIVERED'

    ORDER BY pd.delivery_timestamp DESC, pd.pickup_id DESC
  `;

  db.query(sql, [volunteer_id], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to fetch rescue history", error: err.message });
    }

    res.status(200).json({ success: true, history: results });
  });
});

// ======================================================
// START SERVER
// ======================================================

// ======================================================
// GLOBAL ERROR HANDLER
// Any unexpected error returns a JSON body and logs the stack,
// so the client never gets an empty 500.
// ======================================================

// ======================================================
// PUBLIC - HOME PAGE STATS (live counts from the database)
// ======================================================
app.get("/api/public/home-stats", (req, res) => {
  const sql = `
    SELECT
      (SELECT COUNT(*) FROM donations) AS total_donations,
      (SELECT COUNT(*) FROM donations WHERE status IN ('DELIVERED','COMPLETED')) AS completed_deliveries,
      (SELECT COALESCE(SUM(quantity), 0) FROM donations
         WHERE status IN ('DELIVERED','COMPLETED') AND LOWER(unit) = 'kg') AS kg_delivered,
      (SELECT COUNT(*) FROM ngos WHERE verification_status = 'ACTIVE') AS active_ngos,
      (SELECT COUNT(*) FROM volunteers v INNER JOIN users u ON v.user_id = u.user_id
         WHERE u.status = 'ACTIVE') AS active_volunteers
  `;
  db.query(sql, (err, rows) => {
    if (err) {
      console.error("Error fetching home stats:", err.message);
      return res.status(500).json({ success: false, message: "Failed to load stats" });
    }
    const r = rows[0];
    res.status(200).json({
      success: true,
      stats: {
        donations: Number(r.total_donations),
        deliveries: Number(r.completed_deliveries),
        meals: Math.round(Number(r.kg_delivered) * 2.5),
        ngos: Number(r.active_ngos),
        volunteers: Number(r.active_volunteers),
      },
    });
  });
});

app.use((err, req, res, next) => {
  console.error(`Unhandled error on ${req.method} ${req.originalUrl}:`, err);
  if (res.headersSent) return next(err);
  const status = err.status || err.statusCode || 500;
  return res.status(status).json({
    success: false,
    message: status < 500 ? "Invalid request body." : "Server error. Please try again.",
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);

  // Approvals made before this flow existed have no pickup task yet
  createOpenPickup(null, (err, result) => {
    if (err) {
      console.error("Error syncing open pickup tasks:", err.message);
    } else if (result.affectedRows > 0) {
      console.log(`Opened ${result.affectedRows} pickup task(s) for approved donations`);
    }
  });
});