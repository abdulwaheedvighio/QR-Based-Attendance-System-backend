const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema(
  {
    teacherName: {
      type: String,
      required: [true, "Teacher name is required"],
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
    facultyMember: {
      type: String,
      required: [true, "Faculty member is required"],
    },
    phoneNumber: {
      type: String,
      match: [/^[0-9]{10,15}$/, "Invalid phone number format"],
    },
    address: { type: String, trim: true },
    profileImage: { type: String, default: "" },
    qualification: { type: String, trim: true },
    experience: { type: Number, default: 0 },
    subjects: {
      type: [String],
      default: [],
    },
    role: {
      type: String,
      default: "teacher",
      enum: ["teacher"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Teacher", teacherSchema);
