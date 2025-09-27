const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  adminName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "admin" }, // fixed role
  phoneNumber: { type: String },
  address: { type: String },
  profileImage: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("Admin", adminSchema);
