// Simple signed-token login check (HMAC-SHA256, no extra packages).
const crypto = require("crypto");

const SECRET =
  process.env.AUTH_SECRET ||
  (() => {
    console.warn("AUTH_SECRET is not set. Using a random secret: users must log in again after the server restarts.");
    return crypto.randomBytes(32).toString("hex");
  })();

const TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

function sign(body) {
  return crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
}

function signToken(user) {
  const payload = {
    uid: user.user_id,
    role: user.role,
    donor_id: user.donor_id || null,
    ngo_id: user.ngo_id || null,
    volunteer_id: user.volunteer_id || null,
    exp: Date.now() + TTL_MS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function verifyToken(token) {
  if (typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(body));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let payload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch (e) {
    return null;
  }
  if (!payload.exp || payload.exp < Date.now()) return null;
  return payload;
}

// requireAuth(["ADMIN"]) -> 401 if no valid login, 403 if role not allowed
function requireAuth(roles) {
  return (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ success: false, message: "Please log in again." });
    }
    if (roles && !roles.includes(payload.role)) {
      return res.status(403).json({ success: false, message: "You do not have access to this action." });
    }
    req.user = payload;
    next();
  };
}

module.exports = { signToken, verifyToken, requireAuth };
