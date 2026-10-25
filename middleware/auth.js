const getFirebaseAuth = require("../config/firebase");

async function requireAuth(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const token = authorization.slice("Bearer ".length).trim();

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    req.user = await getFirebaseAuth().verifyIdToken(token);
    next();
  } catch (error) {
    console.error("Authentication failed:", error.message);
    res.status(401).json({ message: "Invalid or expired authentication token" });
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    next();
  };
}

module.exports = {
  requireAuth,
  requireRole
};
