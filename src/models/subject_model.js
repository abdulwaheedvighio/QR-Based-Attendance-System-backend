const mongoose = require("mongoose");

const SubjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Subject Name is required"],
      trim: true,
    },
    code: {
      type: String,
      required: [true, "Subject Code is required"],
      unique: true,
      trim: true,
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
        required: true,
    },
    assignedTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher", // ✅ Teacher who teaches this subject
      default: null,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subject", SubjectSchema);
