const AttendanceModel = require("../models/attendance_model");
const StudentModel = require("../models/student_model");
const SubjectModel = require("../models/subject_model");
const QRCodeModel = require("../models/qr_code_attendance_model"); // ✅ Missing import added
const { v4: uuidv4 } = require("uuid");
const QRCode = require("qrcode");
const { calculateDistance } = require("../utils/distance");

// ======================================================
// ✅ Helper: Mark absentees for a given QR (Auto finalize)
// ======================================================
const markAbsenteesForQRCode = async (qrDoc, teacherId) => {
  try {
    console.log(`🕒 Finalizing attendance for QR: ${qrDoc._id}`);

    // Fetch subject with enrolled students
    const subject = await SubjectModel.findById(qrDoc.subject)
      .populate("enrolledStudents", "studentName rollNumber")
      .lean();

    if (!subject) {
      console.log("⚠️ Subject not found for QR.");
      return;
    }

    const enrolledStudents = subject.enrolledStudents || [];
    console.log(`👨‍🎓 Total enrolled in ${subject.name}: ${enrolledStudents.length}`);

    for (const student of enrolledStudents) {
      const alreadyMarked = await AttendanceModel.findOne({
        student: student._id,
        qrCode: qrDoc._id,
      });

      if (!alreadyMarked) {
        await AttendanceModel.create({
          student: student._id,
          teacher: teacherId,
          qrCode: qrDoc._id,
          subject: qrDoc.subject,
          subjectName: subject.name,
          status: "Absent",
          remarks: "Did not scan QR within allowed time",
          date: new Date().toISOString().split("T")[0],
          time: new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        });

        console.log(`❌ Absent marked: ${student.studentName}`);
      }
    }

    qrDoc.isActive = false;
    await qrDoc.save();

    console.log(`✅ Attendance finalized for QR: ${qrDoc._id}`);
  } catch (err) {
    console.error("❌ Error marking absentees:", err);
  }
};

// ======================================================
// ✅ Generate QR Code (Teacher Side)
// ======================================================
// const generateQRCode = async (req, res) => {
//   try {
//     if (req.user.role !== "teacher") {
//       return res.status(403).json({
//         success: false,
//         message: "Only teachers can generate QR codes",
//       });
//     }

//     const { title, subjectId } = req.body;
//     const durationMinutes = 1;

//     if (!title || !subjectId)
//       return res.status(400).json({
//         success: false,
//         message: "Missing required fields",
//       });

//     // Ensure subject belongs to teacher
//     const subject = await SubjectModel.findOne({
//       _id: subjectId,
//       assignedTeacher: req.user.id,
//     })
//       .populate("semester department")
//       .populate("enrolledStudents");

//     if (!subject)
//       return res.status(403).json({
//         success: false,
//         message: "This subject is not assigned to you",
//       });

//     // Fixed university coordinates
//     const geo = {
//       latitude: 26.223084,
//       longitude: 68.330521,
//       radiusMeters: 40,
//     };

//     const token = uuidv4();
//     const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

//     // Save QR in DB
//     const qrDoc = await QRCodeModel.create({
//       token,
//       teacher: req.user.id,
//       createdBy: req.user.id,
//       title,
//       subject: subject._id,
//       expiresAt,
//       geo,
//       maxUses: 0,
//       isActive: true,
//     });

//     const qrImage = await QRCode.toDataURL(token);

//     // Auto finalize attendance
//     setTimeout(async () => {
//       await markAbsenteesForQRCode(qrDoc, req.user.id);
//     }, durationMinutes * 60 * 1000);

//     return res.status(201).json({
//       success: true,
//       message:
//         "QR generated successfully (fixed location: 26.2221943, 68.3312279, radius 10m)",
//       qr: {
//         id: qrDoc._id,
//         token,
//         title,
//         subject: { id: subject._id, name: subject.name },
//         semester: subject.semester?.name,
//         department: subject.department?.name,
//         expiresAt,
//         geo,
//         qrImage,
//       },
//     });
//   } catch (error) {
//     console.error("❌ QR Generate Error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server Error",
//       error: error.message,
//     });
//   }
// };

const generateQRCode = async (req, res) => {
  try {
    // ✅ Only teachers can generate QR codes
    if (req.user.role !== "teacher") {
      return res.status(403).json({ success: false, message: "Only teachers can generate QR codes" });
    }

    const { title, subjectId, durationMinutes = 1, teacherLatitude, teacherLongitude, radiusMeters } = req.body;

    // ✅ Validate required fields
    if (!title || !subjectId) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // ✅ Verify subject is assigned to the teacher
    const subject = await SubjectModel.findOne({
      _id: subjectId,
      assignedTeacher: req.user.id,
    }).populate("semester department enrolledStudents");

    if (!subject) {
      return res.status(403).json({ success: false, message: "Subject not assigned to you" });
    }

    // ✅ Geo-location setup
    const geo = {
      latitude: teacherLatitude,
      longitude: teacherLongitude,
      radiusMeters: radiusMeters || 40,
    };

    // ✅ Save enrolled students at the time of QR creation
    const enrolledStudentIds = subject.enrolledStudents.map(s => s._id);

    // ✅ Generate unique token and expiry
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

    const qrDoc = await QRCodeModel.create({
      token,
      teacher: req.user.id,
      createdBy: req.user.id,
      title,
      subject: subject._id,
      expiresAt,
      geo,
      maxUses: 0,
      isActive: true,
      enrolledStudentsAtCreation: enrolledStudentIds,
    });

    // ✅ Generate QR image
    const qrImage = await QRCode.toDataURL(token);

    // ✅ Auto finalize absent students after QR expires
    setTimeout(async () => {
      const freshQR = await QRCodeModel.findById(qrDoc._id);
      if (freshQR && freshQR.isActive) {
        await markAbsenteesForQRCode(freshQR, req.user.id);
      }
    }, durationMinutes * 60 * 1000);

    return res.status(201).json({
      success: true,
      message: "QR generated",
      qr: {
        id: qrDoc._id,
        token,
        title,
        subject: { id: subject._id, name: subject.name },
        expiresAt,
        geo,
        qrImage,
      },
    });

  } catch (error) {
    console.error("❌ QR Generate Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};


// ======================================================
// ✅ Scan QR Code (Student)
// ======================================================
const scanQRCode = async (req, res) => {
  try {
    if (req.user.role !== "student")
      return res.status(403).json({
        success: false,
        message: "Only students can scan QR codes",
      });

    const { token, latitude, longitude, selfieImageUrl, deviceId } = req.body;

    if (!token || !latitude || !longitude)
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });

    const qrDoc = await QRCodeModel.findOne({ token })
      .populate("teacher", "teacherName")
      .populate("subject", "name enrolledStudents");

    if (!qrDoc)
      return res.status(404).json({
        success: false,
        message: "QR code not found",
      });

    if (!qrDoc.isValid())
      return res.status(400).json({
        success: false,
        message: "QR code expired or inactive",
      });

    // Validate location
    const distance = calculateDistance({ latitude, longitude }, qrDoc.geo);

    if (distance > qrDoc.geo.radiusMeters)
      return res.status(403).json({
        success: false,
        message: "Out of allowed range",
      });

    // Check enrollment
    const isEnrolled = qrDoc.subject.enrolledStudents.some(
      (id) => id.toString() === req.user.id.toString()
    );

    if (!isEnrolled)
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this subject",
      });

    const today = new Date().toISOString().split("T")[0];

    // Check existing attendance
    const existing = await AttendanceModel.findOne({
      student: req.user.id,
      qrCode: qrDoc._id,
      date: today,
    });

    if (existing)
      return res.status(400).json({
        success: false,
        message: "Attendance already marked",
      });

    const subjectName = qrDoc.subject?.name || qrDoc.title || "Unknown Subject";

    const attendance = await AttendanceModel.create({
      student: req.user.id,
      teacher: qrDoc.teacher?._id,
      qrCode: qrDoc._id,
      subject: qrDoc.subject?._id,
      subjectName,
      status: "Present",
      remarks: "On time",
      latitude,
      longitude,
      selfieImageUrl: selfieImageUrl || null,
      deviceId: deviceId || "unknown-device",
      qrCodeToken: token,
      date: today,
      time: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });

    await qrDoc.registerScan(req.user.id, { latitude, longitude });

    res.status(200).json({
      success: true,
      message: "✅ Attendance marked successfully",
      data: attendance,
    });
  } catch (error) {
    console.error("❌ QR Scan Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// ======================================================
// ✅ Fetch Attendance (Student/Teacher)
// ======================================================
const getAttendance = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === "student") query.student = req.user.id;

    if (req.user.role === "teacher") {
      query.teacher = req.user.id;
      if (req.query.date) query.date = req.query.date;
      if (req.query.subject) query.subject = req.query.subject;
      if (req.query.studentId) query.student = req.query.studentId;
    }

    const records = await AttendanceModel.find(query)
      .populate("student", "studentName rollNumber department")
      .populate("teacher", "teacherName email")
      .populate("qrCode", "title")
      .sort({ createdAt: -1 });

    if (!records.length)
      return res.status(404).json({
        success: false,
        message: "No attendance found",
      });

    res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    console.error("❌ Fetch Attendance Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// ======================================================
// ✅ Attendance Summary API (Teacher)
// ======================================================
const getAttendanceSummary = async (req, res) => {
  try {
    const { qrId } = req.params;

    const qr = await QRCodeModel.findById(qrId).populate(
      "subject",
      "name"
    );

    if (!qr)
      return res.status(404).json({
        success: false,
        message: "QR not found",
      });

    const list = await AttendanceModel.find({ qrCode: qrId })
      .populate("student", "studentName rollNumber department")
      .select("status remarks date time");

    const totalPresent = list.filter((a) => a.status === "Present").length;
    const totalAbsent = list.filter((a) => a.status === "Absent").length;

    res.status(200).json({
      success: true,
      qrTitle: qr.title,
      subject: qr.subject?.name,
      total: list.length,
      totalPresent,
      totalAbsent,
      attendanceList: list,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error,
    });
  }
};

// ======================================================
// ✅ Deactivate QR Code (Teacher)
// ======================================================
const deactivateQRCode = async (req, res) => {
  try {
    if (req.user.role !== "teacher")
      return res.status(403).json({
        success: false,
        message: "Only teachers can deactivate QR",
      });

    const { qrId } = req.params;
    const qrDoc = await QRCodeModel.findById(qrId);

    if (!qrDoc)
      return res.status(404).json({
        success: false,
        message: "QR not found",
      });

    if (!qrDoc.teacher.equals(req.user.id))
      return res.status(403).json({
        success: false,
        message: "Not your QR code",
      });

    await markAbsenteesForQRCode(qrDoc, req.user.id);

    res.status(200).json({
      success: true,
      message: "QR deactivated successfully & attendance finalized",
      qr: {
        id: qrDoc._id,
        title: qrDoc.title,
        isActive: qrDoc.isActive,
      },
    });
  } catch (error) {
    console.error("❌ Deactivate QR Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// ======================================================
// ✅ Admin Attendance Report (All Students)
// ======================================================
const getAdminAttendanceReport = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can access this report",
      });
    }

    const report = await AttendanceModel.aggregate([
      {
        $group: {
          _id: "$student",
          totalClasses: { $sum: 1 },
          attended: {
            $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] },
          },
          absent: {
            $sum: { $cond: [{ $eq: ["$status", "Absent"] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: "students",
          localField: "_id",
          foreignField: "_id",
          as: "studentData",
        },
      },
      { $unwind: "$studentData" },
      {
        $lookup: {
          from: "semesters",
          localField: "studentData.semester",
          foreignField: "_id",
          as: "semesterData",
        },
      },
      { $unwind: { path: "$semesterData", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "departments",
          localField: "studentData.department",
          foreignField: "_id",
          as: "departmentData",
        },
      },
      { $unwind: { path: "$departmentData", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          studentId: "$_id",
          studentName: "$studentData.studentName",
          rollNumber: "$studentData.rollNumber",
          department: "$departmentData",
          semester: "$semesterData",
          totalClasses: 1,
          attended: 1,
          absent: 1,
          percentage: {
            $cond: [
              { $eq: ["$totalClasses", 0] },
              0,
              {
                $multiply: [
                  { $divide: ["$attended", "$totalClasses"] },
                  100,
                ],
              },
            ],
          },
        },
      },
      { $sort: { studentName: 1 } },
    ]);

    res.status(200).json({
      success: true,
      count: report.length,
      data: report,
    });
  } catch (error) {
    console.error("❌ Admin Attendance Report Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

module.exports = {
  generateQRCode,
  scanQRCode,
  getAttendance,
  getAttendanceSummary,
  deactivateQRCode,
  getAdminAttendanceReport,
};



// const QRCodeModel = require("../models/qr_code_attendance_model");
// const AttendanceModel = require("../models/attendance_model");
// const StudentModel = require("../models/student_model");
// const SubjectModel = require("../models/subject_model");
// const { v4: uuidv4 } = require("uuid");
// const QRCode = require("qrcode");
// const { calculateDistance } = require("../utils/distance");

// // ======================================================
// // ✅ Helper: Mark absentees for a given QR (Auto finalize)
// // ======================================================
// // ============================
// // ✅ Mark Absentees Helper
// // ============================
// const markAbsenteesForQRCode = async (qrDoc, teacherId) => {
//   try {
//     console.log(`🕒 Finalizing attendance for QR: ${qrDoc._id}`);

//     // Load subject for correct name
//     const subject = await SubjectModel.findById(qrDoc.subject)
//       .populate("enrolledStudents", "_id studentName");
    
//     if (!subject) {
//       console.log("⚠️ Subject not found for QR.");
//       return;
//     }

//     // ALWAYS use enrolledStudentsAtCreation saved at QR generate time
//     let studentsToCheck = qrDoc.enrolledStudentsAtCreation || [];

//     if (studentsToCheck.length === 0) {
//       console.log("⚠️ enrolledStudentsAtCreation missing! Using subject fallback.");
//       studentsToCheck = subject.enrolledStudents.map(s => s._id);
//     }

//     console.log(`👨‍🎓 Total enrolled students: ${studentsToCheck.length}`);

//     for (const studentId of studentsToCheck) {
//       const exists = await AttendanceModel.findOne({
//         student: studentId,
//         qrCode: qrDoc._id,
//       });

//       if (!exists) {
//         const student = await StudentModel.findById(studentId);

//         await AttendanceModel.create({
//           student: studentId,
//           teacher: teacherId,
//           qrCode: qrDoc._id,
//           subject: subject._id,
//           subjectName: subject.name,
//           status: "Absent",
//           remarks: "Did not scan QR within allowed time",
//           date: new Date().toISOString().split("T")[0],
//           time: new Date().toLocaleTimeString("en-US", {
//             hour: "2-digit",
//             minute: "2-digit",
//           }),
//         });

//         console.log(`❌ Auto Absent: ${student?.studentName}`);
//       }
//     }

//     qrDoc.isActive = false;
//     await qrDoc.save();

//     console.log(`✅ Attendance finalized for QR: ${qrDoc._id}`);

//   } catch (err) {
//     console.error("❌ Error marking absentees:", err);
//   }
// };



// // ============================
// // ✅ Generate QR Code (Teacher)
// // ============================
// const generateQRCode = async (req, res) => {
//   try {
//     if (req.user.role !== "teacher") {
//       return res.status(403).json({ success: false, message: "Only teachers can generate QR codes" });
//     }

//     const { title, subjectId, durationMinutes = 1, teacherLatitude, teacherLongitude, radiusMeters } = req.body;

//     if (!title || !subjectId) {
//       return res.status(400).json({ success: false, message: "Missing required fields" });
//     }

//     const subject = await SubjectModel.findOne({
//       _id: subjectId,
//       assignedTeacher: req.user.id,
//     }).populate("semester department enrolledStudents");

//     if (!subject) {
//       return res.status(403).json({ success: false, message: "Subject not assigned to you" });
//     }

//     const geo = {
//       latitude: teacherLatitude,
//       longitude: teacherLongitude,
//       radiusMeters: radiusMeters || 40,
//     };

//     // Save enrolled list at the moment QR created
//     const enrolledStudentIds = subject.enrolledStudents.map(s => s._id);

//     const token = uuidv4();
//     const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

//     const qrDoc = await QRCodeModel.create({
//       token,
//       teacher: req.user.id,
//       createdBy: req.user.id,
//       title,
//       subject: subject._id,
//       expiresAt,
//       geo,
//       maxUses: 0,
//       isActive: true,
//       enrolledStudentsAtCreation: enrolledStudentIds,
//     });

//     const qrImage = await QRCode.toDataURL(token);

//     // Auto finalize absent students
//     setTimeout(async () => {
//       const freshQR = await QRCodeModel.findById(qrDoc._id);
//       if (freshQR && freshQR.isActive) {
//         await markAbsenteesForQRCode(freshQR, req.user.id);
//       }
//     }, durationMinutes * 60 * 1000);

//     return res.status(201).json({
//       success: true,
//       message: "QR generated",
//       qr: {
//         id: qrDoc._id,
//         token,
//         title,
//         subject: { id: subject._id, name: subject.name },
//         expiresAt,
//         geo,
//         qrImage,
//       },
//     });

//   } catch (error) {
//     console.error("❌ QR Generate Error:", error);
//     return res.status(500).json({ success: false, message: "Server Error" });
//   }
// };



// // -------------------------
// // Scan QR Code (Student)
// // -------------------------
// const scanQRCode = async (req, res) => {
//   try {
//     if (req.user.role !== "student") {
//       return res.status(403).json({ success: false, message: "Only students can scan QR codes" });
//     }

//     const { token, latitude, longitude, selfieImageUrl, deviceId } = req.body;
//     if (!token || typeof latitude !== "number" || typeof longitude !== "number") {
//       return res.status(400).json({ success: false, message: "Missing required fields (token, latitude, longitude)" });
//     }

//     const qrDoc = await QRCodeModel.findOne({ token })
//       .populate("teacher", "teacherName")
//       .populate("subject", "name enrolledStudents");

//     if (!qrDoc) return res.status(404).json({ success: false, message: "QR code not found" });

//     // Expiry Check
//     if (!qrDoc.isActive || new Date() > new Date(qrDoc.expiresAt)) {
//       return res.status(400).json({ success: false, message: "QR code expired or inactive" });
//     }

//     // GPS Distance check with buffer
//     const distance = calculateDistance(
//       { latitude, longitude },
//       qrDoc.geo
//     ) - 5; // 5 meter buffer (adjustable)

//     if (distance > (qrDoc.geo?.radiusMeters ?? 40)) {
//       return res.status(403).json({
//         success: false,
//         message: `Out of allowed range (distance: ${Math.round(distance)} m)`
//       });
//     }

//     // Enrollment check
//     const isEnrolled = qrDoc.subject.enrolledStudents.some(
//       id => id.toString() === req.user.id.toString()
//     );
//     if (!isEnrolled) {
//       return res.status(403).json({ success: false, message: "You are not enrolled in this subject" });
//     }

//     const today = new Date().toISOString().split("T")[0];

//     const existing = await AttendanceModel.findOne({
//       student: req.user.id,
//       qrCode: qrDoc._id,
//       date: today
//     });

//     if (existing) {
//       return res.status(400).json({ success: false, message: "Attendance already marked" });
//     }

//     // ⭐ FIXED subjectName Here
//     const subjectName = qrDoc.subject?.name || "Unknown Subject";

//     const attendance = await AttendanceModel.create({
//       student: req.user.id,
//       teacher: qrDoc.teacher?._id,
//       qrCode: qrDoc._id,
//       subject: qrDoc.subject?._id,
//       subjectName: subjectName, // FINAL FIX
//       status: "Present",
//       remarks: "On time",
//       latitude,
//       longitude,
//       selfieImageUrl: selfieImageUrl || null,
//       deviceId: deviceId || "unknown-device",
//       qrCodeToken: token,
//       date: today,
//       time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
//     });

//     // Track scan
//     if (typeof qrDoc.registerScan === "function") {
//       await qrDoc.registerScan(req.user.id, { latitude, longitude });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "✅ Attendance marked successfully",
//       data: attendance,
//     });

//   } catch (error) {
//     console.error("❌ QR Scan Error:", error);
//     return res.status(500).json({ success: false, message: "Server Error", error: error.message });
//   }
// };

// // ======================================================
// // ✅ Fetch Attendance (Student/Teacher)
// // ======================================================
// const getAttendance = async (req, res) => {
//   try {
//     let query = {};

//     if (req.user.role === "student") query.student = req.user.id;
//     if (req.user.role === "teacher") {
//       query.teacher = req.user.id;
//       if (req.query.date) query.date = req.query.date;
//       if (req.query.subject) query.subject = req.query.subject;
//       if (req.query.studentId) query.student = req.query.studentId;
//     }

//     const records = await AttendanceModel.find(query)
//       .populate("student", "studentName rollNumber department")
//       .populate("teacher", "teacherName email")
//       .populate("qrCode", "title")
//       .sort({ createdAt: -1 });

//     if (!records.length)
//       return res
//         .status(404)
//         .json({ success: false, message: "No attendance found" });

//     res.status(200).json({
//       success: true,
//       count: records.length,
//       data: records,
//     });
//   } catch (error) {
//     console.error("❌ Fetch Attendance Error:", error);
//     res
//       .status(500)
//       .json({ success: false, message: "Server Error", error: error.message });
//   }
// };

// // ======================================================
// // ✅ Attendance Summary API (Teacher)
// // ======================================================
// const getAttendanceSummary = async (req, res) => {
//   try {
//     const { qrId } = req.params;
//     const qr = await QRCodeModel.findById(qrId).populate("subject", "name");
//     if (!qr)
//       return res.status(404).json({ success: false, message: "QR not found" });

//     const list = await AttendanceModel.find({ qrCode: qrId })
//       .populate("student", "studentName rollNumber department")
//       .select("status remarks date time");

//     const totalPresent = list.filter((a) => a.status === "Present").length;
//     const totalAbsent = list.filter((a) => a.status === "Absent").length;

//     res.status(200).json({
//       success: true,
//       qrTitle: qr.title,
//       subject: qr.subject?.name,
//       total: list.length,
//       totalPresent,
//       totalAbsent,
//       attendanceList: list,
//     });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ success: false, message: "Server error", error });
//   }
// };

// // ======================================================
// // ✅ Deactivate QR Code (Teacher)
// // ======================================================
// const deactivateQRCode = async (req, res) => {
//   try {
//     if (req.user.role !== "teacher")
//       return res
//         .status(403)
//         .json({ success: false, message: "Only teachers can deactivate QR" });

//     const { qrId } = req.params;
//     const qrDoc = await QRCodeModel.findById(qrId);

//     if (!qrDoc)
//       return res
//         .status(404)
//         .json({ success: false, message: "QR not found" });

//     if (!qrDoc.teacher.equals(req.user.id))
//       return res
//         .status(403)
//         .json({ success: false, message: "Not your QR code" });

//     await markAbsenteesForQRCode(qrDoc, req.user.id);

//     res.status(200).json({
//       success: true,
//       message: "QR deactivated successfully & attendance finalized",
//       qr: {
//         id: qrDoc._id,
//         title: qrDoc.title,
//         isActive: qrDoc.isActive,
//       },
//     });
//   } catch (error) {
//     console.error("❌ Deactivate QR Error:", error);
//     res
//       .status(500)
//       .json({ success: false, message: "Server Error", error: error.message });
//   }
// };

// // ======================================================
// // ✅ Admin Attendance Report (All Students)
// // ======================================================
// const getAdminAttendanceReport = async (req, res) => {
//   try {
//     if (req.user.role !== "admin") {
//       return res
//         .status(403)
//         .json({ success: false, message: "Only admins can access this report" });
//     }

//     const report = await AttendanceModel.aggregate([
//       {
//         $group: {
//           _id: "$student",
//           totalClasses: { $sum: 1 },
//           attended: { $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] } },
//           absent: { $sum: { $cond: [{ $eq: ["$status", "Absent"] }, 1, 0] } },
//         },
//       },
//       // 🔹 Populate student data
//       {
//         $lookup: {
//           from: "students",
//           localField: "_id",
//           foreignField: "_id",
//           as: "studentData",
//         },
//       },
//       { $unwind: "$studentData" },

//       // 🔹 Populate semester data
//       {
//         $lookup: {
//           from: "semesters",
//           localField: "studentData.semester",
//           foreignField: "_id",
//           as: "semesterData",
//         },
//       },
//       { $unwind: { path: "$semesterData", preserveNullAndEmptyArrays: true } },

//       // 🔹 Populate department data
//       {
//         $lookup: {
//           from: "departments",
//           localField: "studentData.department",
//           foreignField: "_id",
//           as: "departmentData",
//         },
//       },
//       { $unwind: { path: "$departmentData", preserveNullAndEmptyArrays: true } },

//       {
//         $project: {
//           studentId: "$_id",
//           studentName: "$studentData.studentName",
//           rollNumber: "$studentData.rollNumber",
//           department: "$departmentData", // Full department object
//           semester: "$semesterData",
//           totalClasses: 1,
//           attended: 1,
//           absent: 1,
//           percentage: {
//             $cond: [
//               { $eq: ["$totalClasses", 0] },
//               0,
//               { $multiply: [{ $divide: ["$attended", "$totalClasses"] }, 100] },
//             ],
//           },
//         },
//       },
//       { $sort: { studentName: 1 } },
//     ]);

//     res.status(200).json({
//       success: true,
//       count: report.length,
//       data: report,
//     });
//   } catch (error) {
//     console.error("❌ Admin Attendance Report Error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server Error",
//       error: error.message,
//     });
//   }
// };





// module.exports = {
//   generateQRCode,
//   scanQRCode,
//   getAttendance,
//   getAttendanceSummary,
//   deactivateQRCode,
//   getAdminAttendanceReport
// };
