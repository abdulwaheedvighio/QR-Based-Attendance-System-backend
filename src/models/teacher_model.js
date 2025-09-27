const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema({
    teacherName : { type:String, required:true },
    email : { type:String, required: true, unique: true },
    password : { type:String, required:true },
    facultyMember : { type:String, required: true },
    phoneNumber: { type: String },
    address: { type: String },
    profileImage: { type: String },
    qualification: { type: String },
    experience: { type: Number },
    subjects: { type: [String] }, // Array of subjects teacher handles
    role: { type: String, default: "teacher" }, // JWT aur role-based auth ke liye
},
{ timestamps:true });

module.exports = mongoose.model("Teacher", teacherSchema);
