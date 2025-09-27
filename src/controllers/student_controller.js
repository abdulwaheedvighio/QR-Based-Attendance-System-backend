const studentModel = require("../models/student_model");
const { hashPassword } = require("../utils/hashedPassword");

// 🔹 Register Student
const registerStudent = async (req, res) => {
  try {
    const {
      studentName,
      email,
      password,
      rollNumber,
      department,
      semester,
      phoneNumber,
      address,
    } = req.body || {};

    // 1️⃣ Required fields check
    if (!studentName || !email || !password || !rollNumber || !department || !semester) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    // 2️⃣ Check if student already exists
    const existingStudent = await studentModel.findOne({
      $or: [{ email }, { rollNumber }],
    });

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: "Student already exists with this email or roll number",
      });
    }

    // 3️⃣ Hash password
    const hashedPass = await hashPassword(password);

    // 4️⃣ Cloudinary Image URL
    let profileImageUrl = null;
    if (req.file) {
      profileImageUrl = req.file.path;
    }

    // 5️⃣ Create new student
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
      message: "✅ Student registered successfully",
      student: {
        id: newStudent._id,
        studentName: newStudent.studentName,
        email: newStudent.email,
        rollNumber: newStudent.rollNumber,
        department: newStudent.department,
        semester: newStudent.semester,
        phoneNumber: newStudent.phoneNumber,
        address: newStudent.address,
        profileImage: newStudent.profileImage,
      },
    });
  } catch (error) {
    console.error("❌ Error in registerStudent:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error registering student",
      error: error.message,
    });
  }
};

module.exports = { registerStudent };
