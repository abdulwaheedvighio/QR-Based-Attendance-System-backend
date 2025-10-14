const mongoose = require("mongoose");

const SemesterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Semester name is required"],
      trim: true,
    },
    number: {
      type: Number,
      required: [true, "Semester number is required"],
      min: 1,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Semester", SemesterSchema);
