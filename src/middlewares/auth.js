const jwt = require("jsonwebtoken");

// 🔹 Auth Middleware - Verify JWT
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1]; // Format: Bearer <token>
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Invalid token format. Use: Bearer <token>",
      });
    }

    // ✅ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.role) {
      return res.status(403).json({
        success: false,
        message: "Token invalid or missing role",
      });
    }

    req.user = decoded; // Contains { id, email, role }
    next();
  } catch (error) {
    let message = "Unauthorized - Invalid token";
    if (error.name === "TokenExpiredError") {
      message = "Unauthorized - Token expired";
    }
    return res.status(401).json({
      success: false,
      message,
      error: error.message,
    });
  }
};

// 🔹 Role-based Middleware
const roleMiddleware = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        success: false,
        message: "Forbidden - Role not found in token",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden - ${allowedRoles.join(" or ")} only`,
      });
    }

    next();
  };
};

// Convenience wrappers
const isAdmin = roleMiddleware(["admin"]);
const isTeacher = roleMiddleware(["teacher"]);
const isStudent = roleMiddleware(["student"]);

module.exports = { authMiddleware, isAdmin, isTeacher, isStudent };
