const express = require("express");
const router = express.Router();
const {generateQRCode,scanQRCode} = require("../controllers/qr_attendance_controller");
const { authMiddleware, } = require("../middlewares/auth");


router.post("/generate",authMiddleware, generateQRCode);
router.post("/scan",authMiddleware,scanQRCode)

module.exports = router;