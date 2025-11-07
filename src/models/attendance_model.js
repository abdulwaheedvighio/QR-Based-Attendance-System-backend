const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
    qrCode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QRCode",
      required: true,
    },

    
    // 🎯 Subject reference (helps populate data easily)
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: false,
    },

    // 📚 Subject name stored for quick display (avoid extra populate)
    subjectName: {
      type: String,
      trim: true,
    },

    // 🟢 Attendance status
    status: {
      type: String,
      enum: ["Present", "Absent", "Late"],
      default: "Present",
    },

    remarks: {
      type: String,
      trim: true,
    },

    // 📅 Date & time
    date: {
      type: String,
      default: () => new Date().toISOString().split("T")[0],
    },
    time: {
      type: String,
      default: () =>
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
    },

    // 📍 Location and proof
    latitude: Number,
    longitude: Number,
    selfieImageUrl: String,
    deviceId: String,
    qrCodeToken: String,
  },
  { timestamps: true }
);

// 🧠 Optional: prevent duplicate attendance (student + date + subject)
attendanceSchema.index({ student: 1, date: 1, subject: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
