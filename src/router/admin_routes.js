const express = require("express");
const { createAdmin, registerStudent, registerTeacher } = require("../controllers/admin_controller");
const { authMiddleware, isAdmin } = require("../middlewares/auth");
const upload = require("../middlewares/multer");

const router = express.Router();

// Public route for first Admin
router.post("/create-admin", upload.single("profileImage"), createAdmin);


// ✅ Add Student (Admin Only) with profile image
router.post("/add-student", authMiddleware, isAdmin, upload.single("profileImage"), registerStudent);

// ✅ Add Teacher (Admin Only) with profile image
router.post("/add-teacher", authMiddleware, isAdmin, upload.single("profileImage"), registerTeacher);


module.exports = router;
