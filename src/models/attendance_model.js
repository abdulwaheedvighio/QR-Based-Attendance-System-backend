const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    // 🔹 Basic References
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Or "Student" if you have separate model
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    qrCode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QRCode",
      required: true,
    },

    // 🔹 Student Info Snapshot (optional but useful for reporting)
    name: { type: String },
    rollNumber: { type: String },
    department: { type: String },
    subject: { type: String },

    // 🔹 Attendance Details
    status: {
      type: String,
      enum: ["Present", "Absent", "Late"],
      default: "Present",
    },
    remarks: { type: String },

    // 🔹 Time & Date Info
    date: {
      type: String,
      default: () => new Date().toISOString().split("T")[0], // e.g. 2025-10-11
    },
    time: {
      type: String,
      default: () => {
        const now = new Date();
        return now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
      },
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },

    // 🔹 Location Info
    latitude: { type: Number },
    longitude: { type: Number },

    // 🔹 Selfie Verification
    selfieImageUrl: { type: String },

    // 🔹 Device Tracking
    deviceId: { type: String },

    // 🔹 Extra Fields
    qrCodeToken: { type: String }, // if you want to store QR UUID
  },
  { timestamps: true }
);

// ✅ Indexes for faster teacher/student searches
attendanceSchema.index({ student: 1, date: 1 });
attendanceSchema.index({ teacher: 1, date: 1 });
attendanceSchema.index({ qrCode: 1 });

module.exports = mongoose.model("Attendance", attendanceSchema);
