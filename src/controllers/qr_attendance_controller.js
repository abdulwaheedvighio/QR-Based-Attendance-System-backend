const QRCodeModel = require("../models/qr_code_attendance_model");
const AttendanceModel = require("../models/attendance_model");
const StudentModel = require("../models/student_model");
const SubjectModel = require("../models/subject_model");
const { v4: uuidv4 } = require("uuid");
const QRCode = require("qrcode");
const { calculateDistance } = require("../utils/distance");

// ======================================================
// ✅ Helper: Mark absentees for a given QR (Auto finalize)
// ======================================================
const markAbsenteesForQRCode = async (qrDoc, teacherId) => {
  try {
    console.log(`🕒 Finalizing attendance for QR: ${qrDoc._id}`);

    // ✅ Fetch subject with enrolled students
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
const generateQRCode = async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res
        .status(403)
        .json({ success: false, message: "Only teachers can generate QR codes" });
    }

    const { title, subjectId, geo } = req.body;
    const durationMinutes = 1; // ⏱ 1 minute active window

    if (!title || !geo?.latitude || !geo?.longitude || !geo?.radiusMeters)
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });

    const subject = await SubjectModel.findOne({
      _id: subjectId,
      assignedTeacher: req.user.id,
    })
      .populate("semester department")
      .populate("enrolledStudents");

    if (!subject)
      return res
        .status(403)
        .json({ success: false, message: "This subject is not assigned to you" });

    // ✅ Create QR info
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
    });

    // ✅ Generate QR Image (Base64)
    const qrImage = await QRCode.toDataURL(token);

    // ✅ Schedule Auto Attendance Finalization
    setTimeout(async () => {
      await markAbsenteesForQRCode(qrDoc, req.user.id);
    }, durationMinutes * 60 * 1000);

    return res.status(201).json({
      success: true,
      message:
        "QR generated successfully. Attendance will finalize automatically after 1 minute.",
      qr: {
        id: qrDoc._id,
        token,
        title,
        subject: { id: subject._id, name: subject.name },
        semester: subject.semester?.name,
        department: subject.department?.name,
        expiresAt,
        geo,
        qrImage,
      },
    });
  } catch (error) {
    console.error("❌ QR Generate Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

// ======================================================
// ✅ Scan QR Code (Student)
// ======================================================
const scanQRCode = async (req, res) => {
  try {
    if (req.user.role !== "student")
      return res
        .status(403)
        .json({ success: false, message: "Only students can scan QR codes" });

    const { token, latitude, longitude, selfieImageUrl, deviceId } = req.body;
    if (!token || !latitude || !longitude)
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });

    const qrDoc = await QRCodeModel.findOne({ token })
      .populate("teacher", "teacherName")
      .populate("subject", "name enrolledStudents");

    if (!qrDoc)
      return res
        .status(404)
        .json({ success: false, message: "QR code not found" });

    if (!qrDoc.isValid())
      return res
        .status(400)
        .json({ success: false, message: "QR code expired or inactive" });

    // ✅ Location validation
    const distance = calculateDistance({ latitude, longitude }, qrDoc.geo);
    if (distance > qrDoc.geo.radiusMeters)
      return res
        .status(403)
        .json({ success: false, message: "Out of allowed range" });

    // ✅ Check enrollment
    const isEnrolled = qrDoc.subject.enrolledStudents.some(
      (id) => id.toString() === req.user.id.toString()
    );
    if (!isEnrolled)
      return res
        .status(403)
        .json({ success: false, message: "You are not enrolled in this subject" });

    const today = new Date().toISOString().split("T")[0];
    const existing = await AttendanceModel.findOne({
      student: req.user.id,
      qrCode: qrDoc._id,
      date: today,
    });

    if (existing)
      return res
        .status(400)
        .json({ success: false, message: "Attendance already marked" });

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
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
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
      return res
        .status(404)
        .json({ success: false, message: "No attendance found" });

    res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    console.error("❌ Fetch Attendance Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

// ======================================================
// ✅ Attendance Summary API (Teacher)
// ======================================================
const getAttendanceSummary = async (req, res) => {
  try {
    const { qrId } = req.params;
    const qr = await QRCodeModel.findById(qrId).populate("subject", "name");
    if (!qr)
      return res.status(404).json({ success: false, message: "QR not found" });

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
    res
      .status(500)
      .json({ success: false, message: "Server error", error });
  }
};

// ======================================================
// ✅ Deactivate QR Code (Teacher)
// ======================================================
const deactivateQRCode = async (req, res) => {
  try {
    if (req.user.role !== "teacher")
      return res
        .status(403)
        .json({ success: false, message: "Only teachers can deactivate QR" });

    const { qrId } = req.params;
    const qrDoc = await QRCodeModel.findById(qrId);

    if (!qrDoc)
      return res
        .status(404)
        .json({ success: false, message: "QR not found" });

    if (!qrDoc.teacher.equals(req.user.id))
      return res
        .status(403)
        .json({ success: false, message: "Not your QR code" });

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
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

module.exports = {
  generateQRCode,
  scanQRCode,
  getAttendance,
  getAttendanceSummary,
  deactivateQRCode,
};
