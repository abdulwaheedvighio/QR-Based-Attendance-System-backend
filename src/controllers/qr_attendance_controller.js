const QRCodeModel = require("../models/qr_code_attendance_model");
const AttendanceModel = require("../models/attendance_model");
const { v4: uuidv4 } = require("uuid");
const QRCode = require("qrcode");
const { calculateDistance } = require("../utils/distance");

// ============================
// Generate QR Code (Teacher)
// ============================
const generateQRCode = async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res
        .status(403)
        .json({ success: false, message: "Only teachers can generate QR codes" });
    }

    const { title, geo, maxUses = 0, durationMinutes = 10 } = req.body;

    if (!title || !geo?.latitude || !geo?.longitude || !geo?.radiusMeters) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

    const qrDoc = await QRCodeModel.create({
      token,
      teacher: req.user.id,
      title,
      expiresAt,
      geo,
      maxUses,
    });

    const qrImage = await QRCode.toDataURL(token);

    return res.status(201).json({
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
    console.error("❌ QR Generate Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

// ============================
// Scan QR Code (Student)
// ============================
const scanQRCode = async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res
        .status(403)
        .json({ success: false, message: "Only students can scan QR codes" });
    }

    const { token, latitude, longitude, selfieImageUrl, deviceId } = req.body;

    if (!token || !latitude || !longitude) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const qrDoc = await QRCodeModel.findOne({ token }).populate("teacher");
    if (!qrDoc)
      return res
        .status(404)
        .json({ success: false, message: "QR code not found" });

    // Check validity
    if (!qrDoc.isValid()) {
      return res
        .status(400)
        .json({ success: false, message: "QR code expired or inactive" });
    }

    // ✅ Calculate distance between student & teacher
    const distance = calculateDistance(
      { latitude, longitude },
      qrDoc.geo
    );

    if (distance > qrDoc.geo.radiusMeters) {
      return res
        .status(403)
        .json({ success: false, message: "Out of allowed location range" });
    }

    // ✅ Prevent duplicate attendance
    const existingAttendance = await AttendanceModel.findOne({
      student: req.user.id,
      date: new Date().toISOString().split("T")[0],
      qrCode: qrDoc._id,
    });

    if (existingAttendance) {
      return res
        .status(400)
        .json({ success: false, message: "Attendance already marked" });
    }

    // ✅ Save attendance record
    const attendance = await AttendanceModel.create({
      student: req.user.id,
      teacher: qrDoc.teacher,
      qrCode: qrDoc._id,
      name: req.user.name,
      rollNumber: req.user.rollNumber,
      department: req.user.department,
      subject: qrDoc.title, // Using QR Title as subject (or pass separately)
      status: "Present",
      remarks: "On time",
      latitude,
      longitude,
      selfieImageUrl: selfieImageUrl || null,
      deviceId: deviceId || "unknown-device",
      qrCodeToken: token,
    });

    // ✅ Update QR’s scannedBy list
    await qrDoc.registerScan(req.user.id, { latitude, longitude });

    return res.status(200).json({
      success: true,
      message: "✅ Attendance marked successfully",
      data: attendance,
    });
  } catch (error) {
    console.error("❌ QR Scan Error:", error);
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ success: false, message: "Duplicate attendance record" });
    }
    return res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

// ============================
// Deactivate QR Code (Teacher)
// ============================
const deactivateQRCode = async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res
        .status(403)
        .json({ success: false, message: "Only teachers can deactivate QR codes" });
    }

    const { qrId } = req.params;
    const qrDoc = await QRCodeModel.findById(qrId);

    if (!qrDoc)
      return res
        .status(404)
        .json({ success: false, message: "QR code not found" });

    if (!qrDoc.teacher.equals(req.user.id)) {
      return res
        .status(403)
        .json({ success: false, message: "You can only deactivate your own QR" });
    }

    qrDoc.isActive = false;
    await qrDoc.save();

    return res.status(200).json({
      success: true,
      message: "QR code deactivated successfully",
      qr: {
        id: qrDoc._id,
        title: qrDoc.title,
        isActive: qrDoc.isActive,
      },
    });
  } catch (error) {
    console.error("❌ Deactivate QR Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

module.exports = { generateQRCode, scanQRCode, deactivateQRCode };
