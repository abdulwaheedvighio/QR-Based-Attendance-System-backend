const teacherModel = require("../models/teacher_model");
const { hashPassword } = require("../utils/hashedPassword");

// 🔹 Register Teacher
const registerTeacher = async (req, res) => {
  try {
    const {
      teacherName,
      email,
      password,
      facultyMember,
      phoneNumber,
      address,
      qualification,
      experience,
      subjects,
    } = req.body;

    // 1️⃣ Required field check
    if (!teacherName || !email || !password || !facultyMember || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    // 2️⃣ Check if teacher already exists
    const existingUser = await teacherModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Teacher already exists with this email",
      });
    }

    // 3️⃣ Hash password
    const hashedPass = await hashPassword(password);

    // 4️⃣ Profile image (Cloudinary)
    let profileImageUrl = null;
    if (req.file) {
      profileImageUrl = req.file.path;
    }

    // 5️⃣ Create a new teacher
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
      message: "✅ Teacher registered successfully",
      teacher: {
        id: newTeacher._id,
        teacherName: newTeacher.teacherName,
        email: newTeacher.email,
        facultyMember: newTeacher.facultyMember,
        phoneNumber: newTeacher.phoneNumber,
        address: newTeacher.address,
        profileImage: newTeacher.profileImage,
        qualification: newTeacher.qualification,
        experience: newTeacher.experience,
        subjects: newTeacher.subjects,
      },
    });
  } catch (error) {
    console.error("❌ Error in registerTeacher:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error registering teacher",
      error: error.message,
    });
  }
};

module.exports = { registerTeacher };
