const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    studentName: {
      type: String,
      required: [true, "Student name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
    rollNumber: {
      type: String,
      required: [true, "Roll number is required"],
      unique: true,
      trim: true,
    },
    department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
  },
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Semester",
  },
    phoneNumber: {
      type: String,
      match: [/^[0-9]{10,15}$/, "Invalid phone number format"],
    },
    address: { type: String, trim: true },
    profileImage: { type: String, default: "" },
    role: {
      type: String,
      default: "student",
      enum: ["student"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);
