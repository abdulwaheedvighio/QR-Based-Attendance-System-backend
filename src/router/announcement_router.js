const express = require('express');
const router = express.Router();
const { authMiddleware, isAdmin, isTeacher, isStudent } = require("../middlewares/auth");

const {
  createAnnouncement,
  getTeacherAnnouncements,
  getStudentAnnouncements,
} = require('../controllers/announcement_controller');

// =================================================================
// 📌 Create Announcement (Only Admin)
// =================================================================

router.get('/teacher-announcements', authMiddleware, getTeacherAnnouncements);
router.get('/student-announcements', authMiddleware, getStudentAnnouncements);
router.post('/send-announcement', authMiddleware, isAdmin, createAnnouncement);

module.exports = router;
