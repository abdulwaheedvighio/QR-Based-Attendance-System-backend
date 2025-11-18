const jwt = require("jsonwebtoken");
const TeacherModel = require("../models/teacher_model");
const AdminModel = require("../models/admin_model");
const StudentModel = require("../models/student_model");

// 🔹 Auth Middleware - Verify JWT
const authMiddleware = async (req, res, next) => {
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
    if (!decoded || !decoded.role || !decoded.id) {
      return res.status(403).json({
        success: false,
        message: "Token invalid or missing role/id",
      });
    }

    // Fetch full user from DB based on role
    let user;
    switch (decoded.role) {
      case "teacher":
        user = await TeacherModel.findById(decoded.id);
        break;
      case "student":
        user = await StudentModel.findById(decoded.id);
        break;
      case "admin":
        user = await AdminModel.findById(decoded.id);
        break;
      default:
        return res.status(403).json({
          success: false,
          message: "Invalid role",
        });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user; // ✅ now req.user._id exists
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
        message: "Forbidden - Role not found",
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
