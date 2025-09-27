const AdminModel = require("../models/admin_model");
const studentModel = require("../models/student_model");
const teacherModel = require("../models/teacher_model");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../utils/jwt"); // ✅ import your existing function

// 🔹 Login (Admin / Student / Teacher)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res
        .status(400)
        .json({ success: false, message: "Email and password required" });

    let user = null;
    let role = null;

    // 🔹 Check Admin
    user = await AdminModel.findOne({ email });
    if (user) role = "admin";

    // 🔹 Check Teacher
    if (!user) {
      user = await teacherModel.findOne({ email });
      if (user) role = "teacher";
    }

    // 🔹 Check Student
    if (!user) {
      user = await studentModel.findOne({ email });
      if (user) role = "student";
    }

    // 🔹 User not found
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    // 🔹 Password check
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });

    // 🔹 Generate JWT
    const token = generateToken(user, role);

    // 🔹 Role-wise response
    let userData = {
      id: user._id,
      email: user.email,
      role,
      profileImage: user.profileImage || null,
    };

    if (role === "admin") {
      userData.name = user.adminName;
    } else if (role === "teacher") {
      userData.name = user.teacherName;
      userData.facultyMember = user.facultyMember;
      userData.phoneNumber = user.phoneNumber;
      userData.address = user.address;
      userData.qualification = user.qualification;
      userData.experience = user.experience;
      userData.subjects = user.subjects;
    } else if (role === "student") {
      userData.name = user.studentName;
      userData.department = user.department;
      userData.rollNumber = user.rollNumber;
      userData.semester = user.semester;
      userData.profileImage = user.profileImage;
      userData.phoneNumber = user.phoneNumber;
      userData.address = user.address;
      userData.role = user.role;
    }

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: userData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Login error",
      error: error.message,
    });
  }
};

module.exports = { login };
