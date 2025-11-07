const express = require("express");
const {
  createAdmin,
  registerStudent,
  registerTeacher,
  getAllStudents,
  getAllTeachers,
  enrollStudentToSubject, // ✅ Enroll Student
  getEnrolledStudentsBySubject, // ✅ New Controller 1
  getAllSubjectsWithEnrollmentCount, // ✅ New Controller 2
} = require("../controllers/admin_controller");

const { authMiddleware, isAdmin } = require("../middlewares/auth");
const upload = require("../middlewares/multer");

const router = express.Router();

// 🟢 Create First Admin (Public)
router.post("/create-admin", upload.single("profileImage"), createAdmin);

// 🟢 Add Student (Admin Only)
router.post("/add-student", authMiddleware, isAdmin, upload.single("profileImage"), registerStudent);

// 🟢 Get All Students (Admin Only)
router.get("/get-all-students", authMiddleware, isAdmin, getAllStudents);

// 🟢 Add Teacher (Admin Only)
router.post("/add-teacher", authMiddleware, isAdmin, upload.single("profileImage"), registerTeacher);

// 🟢 Get All Teachers (Admin Only)
router.get("/get-all-teachers", authMiddleware, isAdmin, getAllTeachers);

// 🆕 ✅ Enroll Student to Subject (Admin Only)
router.post("/enroll-student", authMiddleware, isAdmin, enrollStudentToSubject);

// 🆕 ✅ Get enrolled students for a specific subject
router.get(
  "/subject/:id/enrolled-students",
  authMiddleware,
  isAdmin,
  getEnrolledStudentsBySubject
);

// 🆕 ✅ Get all subjects with total enrolled student count
router.get(
  "/enrollment-summary",
  authMiddleware,
  isAdmin,
  getAllSubjectsWithEnrollmentCount
);

module.exports = router;
