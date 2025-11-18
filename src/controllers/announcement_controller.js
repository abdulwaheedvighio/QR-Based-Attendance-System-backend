const AnnouncementModel = require('../models/announcement_model');
const TeacherModel = require('../models/teacher_model');

// ===================================================================
// ✅ Create Announcement
// ===================================================================
const createAnnouncement = async (req, res) => {
  try {
    const { title, message, targetType, targetTeacherIds } = req.body;
    const createdBy = req.user?._id;

    console.log("📥 Incoming Body:", req.body);

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "Title and message are required",
      });
    }

    let teacherIds = [];

    // Convert strings to array
    let parsedTeacherIds = [];
    if (typeof targetTeacherIds === "string") {
      parsedTeacherIds = [targetTeacherIds];
    } else if (Array.isArray(targetTeacherIds)) {
      parsedTeacherIds = targetTeacherIds;
    }

    console.log("👉 Parsed Teacher IDs:", parsedTeacherIds);

    // Target All Teachers
    if (targetType === "All") {
      const allTeachers = await TeacherModel.find({}, "_id");
      teacherIds = allTeachers.map(t => t._id);
    }

    // Target Specific Teachers
    if (targetType === "Teacher") {
      if (!parsedTeacherIds || parsedTeacherIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Please select at least one teacher",
        });
      }
      teacherIds = parsedTeacherIds;
    }

    console.log("🔍 Final teacherIds stored:", teacherIds);

    const newAnnouncement = await AnnouncementModel.create({
      title,
      message,
      targetType,
      targetTeacherIds: teacherIds,
      createdBy
    });

    return res.status(201).json({
      success: true,
      message: "Announcement created successfully",
      data: newAnnouncement,
    });

  } catch (error) {
    console.error("❌ Error creating announcement:", error);
    res.status(500).json({
      success: false,
      message: `Internal Server Error: ${error.message}`,
    });
  }
};


// ===================================================================
// ✅ Get Teacher Announcements (Perfect)
// ===================================================================
const getTeacherAnnouncements = async (req, res) => {
  try {
    const teacherId = req.user._id;

    console.log("👨‍🏫 Teacher ID:", teacherId);

    const announcements = await AnnouncementModel.find({
      $or: [
        { targetType: "All" },
        {
          targetType: "Teacher",
          targetTeacherIds: { $in: [teacherId] }  // <-- FIXED!!
        }
      ]
    })
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: announcements.length,
      data: announcements,
    });

  } catch (error) {
    console.error("❌ Error fetching teacher announcements:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching announcements",
      error: error.message,
    });
  }
};


// ===================================================================
// ✅ Get Student Announcements (Only student & ALL)
// ===================================================================
const getStudentAnnouncements = async (req, res) => {
  try {
    const announcements = await AnnouncementModel.find({
      $or: [
        { targetType: "All" },
        { targetType: "Student" },
      ]
    })
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: announcements.length,
      data: announcements,
    });

  } catch (error) {
    console.error("❌ Error fetching student announcements:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching announcements",
      error: error.message,
    });
  }
};


module.exports = {
  createAnnouncement,
  getTeacherAnnouncements,
  getStudentAnnouncements
};
