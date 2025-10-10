const QRAttendanceModel = require("../models/qr_code_attendance_model");
const { v4: uuidv4 } = require("uuid");
const QRCode = require("qrcode");
const { calculateDistance } = require("../utils/distance");

// ============================
// Generate QR Code (Teacher)
// ============================
const generateQRCode = async (req, res) => {
  try {
    // Role validation
    if (req.user.role !== "teacher") {
      return res.status(403).json({ success: false, message: "Only teachers can generate QR codes" });
    }

    const { title, geo } = req.body;

    // Input validation
    if (!title || !geo || !geo.latitude || !geo.longitude || !geo.radiusMeters) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Generate unique token and expiry
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create QR record
    const qrDoc = await QRAttendanceModel.create({
      token,
      teacher: req.user.id,
      title,
      expiresAt,
      geo,
    });

    // Generate QR image (Base64)
    const qrImage = await QRCode.toDataURL(token);

    res.status(201).json({
      success: true,
      message: "QR code generated successfully",
      qr: {
        id: qrDoc._id,
        token,
        title,
        expiresAt,
        geo,
        qrImage,
      },
    });
  } catch (error) {
    console.error("QR Generate Error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// ============================
// Scan QR Code (Student)
// ============================
const scanQRCode = async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ success: false, message: "Only students can scan QR codes" });
    }

    const { token, latitude, longitude } = req.body;
    if (!token || !latitude || !longitude) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const qrDoc = await QRAttendanceModel.findOne({ token });
    if (!qrDoc) return res.status(404).json({ success: false, message: "QR code not found" });

    // Check validity and expiry
    if (!qrDoc.isValid()) {
      return res.status(400).json({ success: false, message: "QR code expired or inactive" });
    }

    // Check geo-distance
    const distance = calculateDistance(latitude, longitude, qrDoc.geo.latitude, qrDoc.geo.longitude);
    if (distance > qrDoc.geo.radiusMeters) {
      return res.status(400).json({ success: false, message: "Out of allowed location range" });
    }

    // Prevent duplicate scans
    const alreadyScanned = qrDoc.scannedBy.some(scan => scan.student.equals(req.user.id));
    if (alreadyScanned) {
      return res.status(400).json({ success: false, message: "You have already scanned this QR" });
    }

    // Register new scan
    qrDoc.scannedBy.push({
      student: req.user.id,
      location: { latitude, longitude },
    });
    await qrDoc.save();

    res.status(200).json({
      success: true,
      message: "Attendance marked successfully",
      qr: {
        id: qrDoc._id,
        title: qrDoc.title,
        teacher: qrDoc.teacher,
        scannedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("QR Scan Error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// ============================
// Deactivate QR Code (Teacher)
// ============================
const deactivateQRCode = async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ success: false, message: "Only teachers can deactivate QR codes" });
    }

    const { qrId } = req.params;
    const qrDoc = await QRAttendanceModel.findById(qrId);

    if (!qrDoc) {
      return res.status(404).json({ success: false, message: "QR code not found" });
    }

    // ✅ Security: Teacher can only deactivate their own QR
    if (!qrDoc.teacher.equals(req.user.id)) {
      return res.status(403).json({ success: false, message: "You can only deactivate your own QR codes" });
    }

    qrDoc.isActive = false;
    await qrDoc.save();

    res.status(200).json({
      success: true,
      message: "QR code deactivated successfully",
      qr: { id: qrDoc._id, title: qrDoc.title, isActive: qrDoc.isActive },
    });
  } catch (error) {
    console.error("Deactivate QR Error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

module.exports = {
  generateQRCode,
  scanQRCode,
  deactivateQRCode,
};
