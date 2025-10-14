const Semester = require("../models/semester_model");
const Department = require("../models/department_model");

// ============================
// 🎓 Add New Semester
// ============================
const addSemester = async (req, res) => {
  try {
    const { name, number, department } = req.body;

    if (!name || !number || !department) {
      return res.status(400).json({
        success: false,
        message: "Name, Number, and Department are required",
      });
    }

    const departmentExists = await Department.findById(department);
    if (!departmentExists) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    const existingSemester = await Semester.findOne({ department, number });
    if (existingSemester) {
      return res.status(409).json({
        success: false,
        message: "This semester already exists for the selected department",
      });
    }

    // 🧠 Here we store the creator (Admin)
    const semester = await Semester.create({
      name,
      number,
      department,
      createdBy: req.user?.id || null,
    });

    const populatedSemester = await Semester.findById(semester._id)
      .populate("department", "name code")
      .populate("createdBy", "adminName email");

    res.status(201).json({
      success: true,
      message: "✅ Semester created successfully",
      semester: populatedSemester,
    });
  } catch (error) {
    console.error("Error adding semester:", error);
    res.status(500).json({
      success: false,
      message: "Server error while adding semester",
      error: error.message,
    });
  }
};

// ============================
// 📋 Get All Semesters
// ============================
const getAllSemesters = async (req, res) => {
  try {
    const semesters = await Semester.find()
      .populate("department", "name code")
      .populate("createdBy", "adminName email")
      .sort({ number: 1 });

    res.status(200).json({
      success: true,
      semesters,
    });
  } catch (error) {
    console.error("Error fetching semesters:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching semesters",
    });
  }
};

// ============================
// 🏫 Get Semesters by Department
// ============================
const getSemestersByDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;

    if (!departmentId) {
      return res.status(400).json({
        success: false,
        message: "Department ID is required",
      });
    }

    const semesters = await Semester.find({ department: departmentId })
      .populate("department", "name code")
      .sort({ number: 1 });

    res.status(200).json({
      success: true,
      semesters,
    });
  } catch (error) {
    console.error("Error fetching semesters by department:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching semesters",
    });
  }
};

// ============================
// ✏️ Update Semester
// ============================
const updateSemester = async (req, res) => {
  try {
    const { semesterId } = req.params;
    const { name, number } = req.body;

    const semester = await Semester.findById(semesterId);
    if (!semester) {
      return res.status(404).json({
        success: false,
        message: "Semester not found",
      });
    }

    if (name) semester.name = name;
    if (number) semester.number = number;

    await semester.save();

    res.status(200).json({
      success: true,
      message: "Semester updated successfully",
      semester,
    });
  } catch (error) {
    console.error("Error updating semester:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating semester",
    });
  }
};

// ============================
// 🗑️ Delete Semester
// ============================
const deleteSemester = async (req, res) => {
  try {
    const { semesterId } = req.params;

    const semester = await Semester.findById(semesterId);
    if (!semester) {
      return res.status(404).json({
        success: false,
        message: "Semester not found",
      });
    }

    await semester.deleteOne();

    res.status(200).json({
      success: true,
      message: "Semester deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting semester:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting semester",
    });
  }
};

module.exports = {
  addSemester,
  getAllSemesters,
  getSemestersByDepartment,
  updateSemester,
  deleteSemester,
};
