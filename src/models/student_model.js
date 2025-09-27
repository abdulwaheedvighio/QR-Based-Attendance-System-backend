const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    studentName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    rollNumber: { type: String, required: true, unique: true },
    department: { type: String, required: true },
    semester: { type: String, required: true },
    phoneNumber: { type: String },
    address: { type: String },
    profileImage: { type: String },
    role: { type: String, default: "student" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);
