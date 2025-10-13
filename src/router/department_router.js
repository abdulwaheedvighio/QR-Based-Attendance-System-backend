const express = require('express');
const { addDepartment, getAllDepartments } = require('../controllers/department_controller');
const { authMiddleware, isAdmin } = require("../middlewares/auth");

const router = express.Router();

// ✅ Correct middleware order: auth first, then admin check
router.post("/add-department", authMiddleware, isAdmin, addDepartment);

// ✅ Optional: Get all departments
router.get("/departments", authMiddleware, getAllDepartments);

module.exports = router;
