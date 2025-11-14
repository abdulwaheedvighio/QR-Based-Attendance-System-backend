const express = require('express');
const router = express.Router();

const {
  createAnnouncement,
  getAllAnnouncements
} = require('../controllers/announcement_controller');

// Create Announcement by Admin
router.post('/send-announcement', createAnnouncement);

// Get All Announcements
router.get('/all-announcements', getAllAnnouncements);

module.exports = router;
