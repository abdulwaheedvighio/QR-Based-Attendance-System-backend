const Department = require('../models/department_model');

// ============================
// 📘 Add New Department
// ============================
const addDepartment = async (req, res) => {
  try {
    const { name, code, description } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: "Name and Code are required",
      });
    }

    const existingDepartment = await Department.findOne({ code });
    if (existingDepartment) {
      return res.status(409).json({
        success: false,
        message: "Department already exists",
      });
    }

    // ✅ JWT se admin id le rahe hain
    const createdBy = req.user?.id; 

    const department = await Department.create({
      name,
      code,
      description,
      createdBy,
    });

    // ✅ Populate admin info
    const populatedDepartment = await Department.findById(department._id).populate(
      "createdBy",
      "adminName email"
    );

    res.status(201).json({
      success: true,
      message: "Department created successfully",
      department: populatedDepartment,
    });
  } catch (error) {
    console.error("Error adding department:", error);
    res.status(500).json({
      success: false,
      message: "Server error while adding department",
    });
  }
};


// ============================
// 📋 Get All Departments
// ============================
const getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find()
      .populate("createdBy", "adminName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: departments.length,
      departments,
    });
  } catch (error) {
    console.error("Error fetching departments:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching departments",
    });
  }
};

module.exports = { addDepartment, getAllDepartments };
