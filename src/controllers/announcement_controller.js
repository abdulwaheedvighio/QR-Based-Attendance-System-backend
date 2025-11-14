const AnnouncementModel = require('../models/announcement_model');
const TeacherModel = require('../models/teacher_model'); // Import teacher model

// ✅ Create Announcement (For All or Specific Teachers)
const createAnnouncement = async (req, res) => {
  try {
    const { title, message, targetType, targetTeacherIds, createdBy } = req.body;

    // Validation
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "Title and message are required.",
      });
    }

    let teacherIds = [];

    // If targetType = "All", fetch all teacher IDs automatically
    if (targetType === "All") {
      const allTeachers = await TeacherModel.find({}, "_id");
      teacherIds = allTeachers.map(t => t._id);
    }

    // If targetType = "Teacher", use selected teacher IDs
    if (targetType === "Teacher" && targetTeacherIds && targetTeacherIds.length > 0) {
      teacherIds = targetTeacherIds;
    }

    // Create announcement
    const newAnnouncement = await AnnouncementModel.create({
      title,
      message,
      targetType: targetType || "All",
      targetTeacherIds: teacherIds,
      createdBy,
    });

    return res.status(201).json({
      success: true,
      message: "✅ Announcement created successfully",
      data: newAnnouncement,
    });
  } catch (error) {
    console.error("Error creating announcement:", error);
    res.status(500).json({
      success: false,
      message: `Internal Server Error: ${error.message}`,
    });
  }
};

// ✅ Get All Announcements (sorted + populated)
const getAllAnnouncements = async (req, res) => {
  try {
    const announcements = await AnnouncementModel.find()
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: announcements.length,
      data: announcements,
    });
  } catch (error) { 
    console.error("Error fetching announcements:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching announcements",
      error: error.message,
    });
  }
};

module.exports = { createAnnouncement, getAllAnnouncements };
