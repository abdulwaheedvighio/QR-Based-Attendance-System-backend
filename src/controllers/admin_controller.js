const AdminModel = require("../models/admin_model");
const studentModel = require("../models/student_model");
const teacherModel = require("../models/teacher_model");
const { hashPassword } = require("../utils/hashedPassword");

// ✅ Create First Admin (Direct Signup)
const createAdmin = async (req, res) => {
  try {
    const { adminName, email, password, phoneNumber, address } = req.body || {};

    if (!adminName || !email || !password) {
      return res.status(400).json({ success: false, message: "All required fields must be provided" });
    }

    const existingAdmin = await AdminModel.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ success: false, message: "Admin already exists with this email" });
    }

    const hashedPass = await hashPassword(password);
    let profileImageUrl = req.file ? req.file.path : null;

    const newAdmin = new AdminModel({
      adminName,
      email,
      password: hashedPass,
      phoneNumber,
      address,
      profileImage: profileImageUrl,
    });

    await newAdmin.save();

    return res.status(201).json({
      success: true,
      message: "✅ Admin account created successfully",
      admin: {
        id: newAdmin._id,
        adminName: newAdmin.adminName,
        email: newAdmin.email,
        role: newAdmin.role,
        phoneNumber: newAdmin.phoneNumber,
        address: newAdmin.address,
        profileImage: newAdmin.profileImage,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error creating admin", error: error.message });
  }
};

// ✅ Register Student (by Admin)
const registerStudent = async (req, res) => {
  try {
    const { studentName, email, password, rollNumber, department, semester, phoneNumber, address } = req.body;

    if (!studentName || !email || !password || !rollNumber || !department || !semester) {
      return res.status(400).json({ success: false, message: "All required fields must be provided" });
    }

    const existingStudent = await studentModel.findOne({ $or: [{ email }, { rollNumber }] });
    if (existingStudent) {
      return res.status(400).json({ success: false, message: "Student already exists with this email or roll number" });
    }

    const hashedPass = await hashPassword(password);
    let profileImageUrl = req.file ? req.file.path : null;

    const newStudent = new studentModel({
      studentName,
      email,
      password: hashedPass,
      rollNumber,
      department,
      semester,
      phoneNumber,
      address,
      profileImage: profileImageUrl,
    });

    await newStudent.save();

    return res.status(201).json({
      success: true,
      message: "✅ Student registered successfully by Admin",
      student: newStudent,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error registering student", error: error.message });
  }
};

// ✅ Register Teacher (by Admin)
const registerTeacher = async (req, res) => {
  try {
    const { teacherName, email, password, facultyMember, phoneNumber, address, qualification, experience, subjects } = req.body;

    if (!teacherName || !email || !password || !facultyMember || !phoneNumber) {
      return res.status(400).json({ success: false, message: "All required fields must be provided" });
    }

    const existingUser = await teacherModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Teacher already exists with this email" });
    }

    const hashedPass = await hashPassword(password);
    let profileImageUrl = req.file ? req.file.path : null;

    const newTeacher = new teacherModel({
      teacherName,
      email,
      password: hashedPass,
      facultyMember,
      phoneNumber,
      address,
      profileImage: profileImageUrl,
      qualification,
      experience,
      subjects,
    });

    await newTeacher.save();

    return res.status(201).json({
      success: true,
      message: "✅ Teacher registered successfully by Admin",
      teacher: newTeacher,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error registering teacher", error: error.message });
  }
};

module.exports = { createAdmin, registerStudent, registerTeacher };
