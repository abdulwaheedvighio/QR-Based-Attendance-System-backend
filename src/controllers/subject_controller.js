const Subject = require("../models/subject_model");

// ============================
// 📘 Add New Subject
// ============================
const addSubject = async (req, res) => {
  try {
    const { name, code, department, semester, description } = req.body;

    if (!name || !code || !department || !semester) {
      return res.status(400).json({
        success: false,
        message: "Name, Code, Department, and Semester are required",
      });
    }

    // 🔍 Check duplicate code
    const existingSubject = await Subject.findOne({ code });
    if (existingSubject) {
      return res.status(409).json({
        success: false,
        message: "Subject with this code already exists",
      });
    }

    // ✅ Create new subject
    const subject = await Subject.create({
      name,
      code,
      department,
      semester,
      description,
      createdBy: req.user?.id || null, //  Ensure JWT middleware sets req.user
    });

    // 🧩 Populate relations
    const populatedSubject = await Subject.findById(subject._id)
      .populate("department", "name code")
      .populate("semester", "name number")
      .populate("createdBy", "adminName email");

    res.status(201).json({
      success: true,
      message: "✅ Subject created successfully",
      subject: populatedSubject,
    });
  } catch (error) {
    console.error("Error adding subject:", error);
    res.status(500).json({
      success: false,
      message: "Server error while adding subject",
      error: error.message,
    });
  }
};

// ============================
// 📋 Get All Subjects
// ============================
const getAllSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find()
      .populate("department", "name code")
      .populate("semester", "name number")
      .populate("assignedTeacher", "teacherName email")
      .populate("createdBy", "adminName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: subjects.length,
      subjects,
    });
  } catch (error) {
    console.error("Error fetching subjects:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching subjects",
    });
  }
};

// ============================
// 👨‍🏫 Assign Teacher to Subject
// ============================
const assignTeacherToSubject = async (req, res) => {
  try {
    const { subjectId, teacherId } = req.body;

    if (!subjectId || !teacherId) {
      return res.status(400).json({
        success: false,
        message: "Subject ID and Teacher ID are required",
      });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    subject.assignedTeacher = teacherId;
    await subject.save();

    const updatedSubject = await Subject.findById(subjectId)
      .populate("department", "name")
      .populate("semester", "name number")
      .populate("assignedTeacher", "teacherName email");

    res.status(200).json({
      success: true,
      message: "👨‍🏫 Teacher assigned successfully",
      subject: updatedSubject,
    });
  } catch (error) {
    console.error("Error assigning teacher:", error);
    res.status(500).json({
      success: false,
      message: "Server error while assigning teacher",
    });
  }
};

module.exports = {
  addSubject,
  getAllSubjects,
  assignTeacherToSubject,
};
