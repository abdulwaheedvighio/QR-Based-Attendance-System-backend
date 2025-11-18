const express = require("express");
const router = express.Router();

const {
  generateQRCode,
  scanQRCode,
  getAttendance,
  getAttendanceSummary, // ✅ Add this line
  deactivateQRCode,     // ✅ Optional (if you want to manually close QR)
  getAdminAttendanceReport
} = require("../controllers/qr_attendance_controller");

const { authMiddleware } = require("../middlewares/auth");

// =====================
// QR Attendance Routes
// =====================

// ✅ Teacher generates QR for attendance
router.post("/generate", authMiddleware, generateQRCode);

// ✅ Student scans QR for marking attendance
router.post("/scan", authMiddleware, scanQRCode);

// ✅ Teacher or Student fetch attendance list
router.get("/get-all-attendance", authMiddleware, getAttendance);

// ✅ Teacher checks attendance summary (Present + Absent)
router.get("/attendance-summary/:qrId", authMiddleware, getAttendanceSummary); // 👈 Add this

router.get("/admin-report", authMiddleware, getAdminAttendanceReport);


// ✅ Teacher manually deactivate QR (optional)
router.put("/deactivate/:qrId", authMiddleware, deactivateQRCode); // 👈 Optional

module.exports = router;
