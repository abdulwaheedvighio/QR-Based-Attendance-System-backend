const express = require("express");
const router = express.Router();
const {
    sendMessage,
  getMessages,
  markAsSeen, } = require("../controllers/chat_controller"); // Chat controller ka path check karlo

// ============================
// 💬 Send a message
// POST /api/chat/send
// ============================
router.post("/send", sendMessage);

// ============================
// 📄 Get chat messages between two users
// GET /api/chat/:user1Id/:user1Model/:user2Id/:user2Model
// ============================
router.get("/:user1Id/:user1Model/:user2Id/:user2Model", getMessages);

// ============================
// ✅ Mark message as seen
// PUT /api/chat/seen
// ============================
router.put("/seen", markAsSeen);

module.exports = router;
