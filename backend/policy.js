// Login and role check for every API route.
// Public routes need no login. Every other /api route needs a valid token,
// the right role, and (where an id is in the URL or body) the caller's own id.
const { verifyToken } = require("./auth");

const ANY = ["DONOR", "NGO", "VOLUNTEER", "ADMIN"];

const PUBLIC = [
  ["GET", /^\/$/],
  ["POST", /^\/api\/users\/(register|login)$/],
  ["GET", /^\/api\/donations$/],          // browse / home page
  ["GET", /^\/api\/donations\/\d+$/],     // donation details page
  ["GET", /^\/api\/public\/home-stats$/],  // home page counts (no personal data)
];

const same = (a, b) => a != null && b != null && String(a) === String(b);

// Rules are checked in order; the first match decides.
// ok(match, req, user)  -> the id in the URL/body must be the caller's own
// db                    -> extra ownership check in the database
const RULES = [
  { re: /^\/api\/admin\//, roles: ["ADMIN"] },

  { method: "POST", re: /^\/api\/donations$/, roles: ["DONOR"],
    ok: (m, req, u) => same(req.body && req.body.donor_id, u.donor_id) },
  { method: "GET", re: /^\/api\/donations\/donor\/(\d+)/, roles: ["DONOR"],
    ok: (m, req, u) => same(m[1], u.donor_id) },
  { method: "GET", re: /^\/api\/donation-requests\/donor\/(\d+)$/, roles: ["DONOR"],
    ok: (m, req, u) => same(m[1], u.donor_id) },
  { method: "PUT", re: /^\/api\/donation-requests\/(\d+)\/respond$/, roles: ["DONOR"],
    ok: (m, req, u) => same(req.body && req.body.donor_id, u.donor_id),
    db: {
      sql: "SELECT dr.request_id FROM donation_requests dr JOIN donations d ON d.donation_id = dr.donation_id WHERE dr.request_id = ? AND d.donor_id = ?",
      params: (m, req, u) => [m[1], u.donor_id],
    } },
  { re: /^\/api\/donors\/(\d+)\//, roles: ["DONOR"],
    ok: (m, req, u) => same(m[1], u.donor_id) },

  { re: /^\/api\/notifications\/user\/(\d+)/, roles: ANY,
    ok: (m, req, u) => same(m[1], u.uid) },
  { method: "PUT", re: /^\/api\/notifications\/(\d+)\/read$/, roles: ANY,
    db: {
      sql: "SELECT notification_id FROM notifications WHERE notification_id = ? AND user_id = ?",
      params: (m, req, u) => [m[1], u.uid],
    } },

  { re: /^\/api\/ngos\/(\d+)\//, roles: ["NGO"],
    ok: (m, req, u) => same(m[1], u.ngo_id) },
  { method: "POST", re: /^\/api\/donation-requests$/, roles: ["NGO"],
    ok: (m, req, u) => same(req.body && req.body.ngo_id, u.ngo_id) },
  { method: "GET", re: /^\/api\/donation-requests\/ngo\/(\d+)$/, roles: ["NGO"],
    ok: (m, req, u) => same(m[1], u.ngo_id) },
  { method: "PUT", re: /^\/api\/donation-requests\/(\d+)\/cancel$/, roles: ["NGO"],
    db: {
      sql: "SELECT request_id FROM donation_requests WHERE request_id = ? AND ngo_id = ?",
      params: (m, req, u) => [m[1], u.ngo_id],
    } },
  { method: "PUT", re: /^\/api\/pickup-delivery\/\d+\/confirm-receipt$/, roles: ["NGO"] },

  { method: "POST", re: /^\/api\/feedback$/, roles: ANY,
    ok: (m, req, u) => same(req.body && req.body.user_id, u.uid) },

  { re: /^\/api\/volunteers\/tasks\/\d+/, roles: ["VOLUNTEER"] },
  { re: /^\/api\/volunteers\/(\d+)\//, roles: ["VOLUNTEER"],
    ok: (m, req, u) => same(m[1], u.volunteer_id) },
];

function isPublic(method, path) {
  return PUBLIC.some(([m, re]) => m === method && re.test(path));
}

module.exports = function makePolicy(db) {
  return function policy(req, res, next) {
    const path = req.path;
    if (!path.startsWith("/api/") && path !== "/") return next();
    if (isPublic(req.method, path)) return next();

    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    const u = verifyToken(token);
    if (!u) return res.status(401).json({ success: false, message: "Please log in again." });

    const rule = RULES.find((r) => (!r.method || r.method === req.method) && r.re.test(path));
    if (!rule) return res.status(403).json({ success: false, message: "This action is not allowed." });
    if (!rule.roles.includes(u.role)) {
      return res.status(403).json({ success: false, message: "You do not have access to this action." });
    }

    const m = path.match(rule.re);
    if (rule.ok && !rule.ok(m, req, u)) {
      return res.status(403).json({ success: false, message: "You can only access your own records." });
    }

    if (rule.db) {
      // No 'return' here: Express 5 would treat the mysql2 Query object as a promise
      db.query(rule.db.sql, rule.db.params(m, req, u), (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: "Database error" });
        if (!rows || rows.length === 0) {
          return res.status(403).json({ success: false, message: "You can only access your own records." });
        }
        next();
      });
      return;
    }
    next();
  };
};
