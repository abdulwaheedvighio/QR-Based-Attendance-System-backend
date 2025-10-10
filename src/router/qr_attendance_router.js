const express = require("express");
const router = express.Router();
const {generateQRCode} = require("../controllers/qr_attendance_controller");
const { authMiddleware, } = require("../middlewares/auth");


router.post("/generate",authMiddleware, generateQRCode);

module.exports = router;