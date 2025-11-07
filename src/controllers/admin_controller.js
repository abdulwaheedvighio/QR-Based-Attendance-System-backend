const AdminModel = require("../models/admin_model");
const studentModel = require("../models/student_model");
const teacherModel = require("../models/teacher_model");
const { hashPassword } = require("../utils/hashedPassword");
const SubjectModel = require("../models/subject_model");
const mongoose = require("mongoose");


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

    // ✅ populate before sending response
    const populatedStudent = await studentModel
      .findById(newStudent._id)
      .populate("department", "name code")
      .populate("semester", "name number");

    return res.status(201).json({
      success: true,
      message: "✅ Student registered successfully by Admin",
      student: populatedStudent,
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

// ✅ Get All Students (Admin Access)
// ✅ Get All Students (Admin Access)
const getAllStudents = async (req, res) => {
  try {
    const students = await studentModel
      .find()
      .populate("department", "name code")  // fetch department name + code only
      .populate("semester", "name number")  // fetch semester name + number only
      .select("-password");                 // hide password

    if (!students.length) {
      return res.status(404).json({
        success: false,
        message: "No students found",
      });
    }

    res.status(200).json({
      success: true,
      count: students.length,
      students,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching students",
      error: error.message,
    });
  }
};

// ✅ Get All Teachers (Admin Access)
const getAllTeachers = async (req, res) => {
  try {
    const teachers = await teacherModel.find().select("-password"); // hide password
    if (!teachers.length) {
      return res.status(404).json({
        success: false,
        message: "No teachers found",
      });
    }

    res.status(200).json({
      success: true,
      count: teachers.length,
      teachers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching teachers",
      error: error.message,
    });
  }
};



// ✅ Enroll Student to Subject
const enrollStudentToSubject = async (req, res) => {
  try {
    console.log("📥 Incoming Body:", req.body);

    const { studentId, subjectId } = req.body;

    if (!studentId || !subjectId) {
      return res.status(400).json({
        success: false,
        message: "Student ID and Subject ID are required",
      });
    }

    // ✅ Validate ObjectId properly (important!)
    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Subject ID format",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Student ID format",
      });
    }

    const subject = await SubjectModel.findById(subjectId);
    if (!subject) {
      console.log("❌ Subject not found for ID:", subjectId);
      return res.status(404).json({ success: false, message: "Subject not found" });
    }

    const student = await studentModel.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // ✅ Initialize array if missing
    if (!Array.isArray(subject.enrolledStudents)) {
      subject.enrolledStudents = [];
    }

    // ✅ Prevent duplicate enrollment
    if (subject.enrolledStudents.some(id => id.toString() === studentId)) {
      return res.status(400).json({
        success: false,
        message: "Student already enrolled in this subject",
      });
    }

    subject.enrolledStudents.push(student._id);
    await subject.save();

    return res.status(200).json({
      success: true,
      message: `✅ ${student.studentName} enrolled successfully in ${subject.name}`,
      subject,
    });

  } catch (error) {
    console.error("🔥 Enrollment Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error enrolling student to subject",
      error: error.message,
    });
  }
};

const getEnrolledStudentsBySubject = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Validate Subject ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid Subject ID" });
    }

    // ✅ Populate enrolled students
    const subject = await SubjectModel.findById(id).populate("enrolledStudents", "studentName rollNumber department ");

    if (!subject) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }

    const totalEnrolled = subject.enrolledStudents.length;

    return res.status(200).json({
      success: true,
      subject: subject.name,
      totalEnrolled,
      enrolledStudents: subject.enrolledStudents,
    });
  } catch (error) {
    console.error("🔥 Error fetching enrolled students:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching enrolled students",
      error: error.message,
    });
  }
};

const getAllSubjectsWithEnrollmentCount = async (req, res) => {
  try {
    const subjects = await SubjectModel.find().populate("enrolledStudents", "studentName");

    const result = subjects.map((subject) => ({
      subjectId: subject._id,
      subjectName: subject.name,
      totalEnrolled: subject.enrolledStudents.length,
    }));

    return res.status(200).json({
      success: true,
      totalSubjects: subjects.length,
      subjects: result,
    });
  } catch (error) {
    console.error("🔥 Error fetching subjects:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching subjects with enrollment count",
      error: error.message,
    });
  }
};


module.exports = { createAdmin, registerStudent, registerTeacher,getAllStudents,getAllTeachers,enrollStudentToSubject,getEnrolledStudentsBySubject,getAllSubjectsWithEnrollmentCount };
