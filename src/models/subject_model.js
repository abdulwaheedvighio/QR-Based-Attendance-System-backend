const mongoose = require("mongoose");

const SubjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Subject name is required"],
      trim: true,
    },
    code: {
      type: String,
      required: [true, "Subject code is required"],
      unique: true,
      trim: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    semester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Semester",
      required: true,
    },
    assignedTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
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
      default: null,
    },

    // 🆕 ✅ Added field for student enrollment
    enrolledStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student", // make sure your student model name is "Student"
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subject", SubjectSchema);
