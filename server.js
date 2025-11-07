const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./src/config/database");

// ✅ Import Routers
const studentRoutes = require("./src/router/student_router");
const authController = require('./src/router/auth_router');
const adminRoutes = require("./src/router/admin_routes");

//Teacher QR Code generate Router
const qrAttendanceRouter = require("./src/router/qr_attendance_router");

const departmentRouter = require('./src/router/department_router');
const subjectRouter = require("./src/router/subject_router");

const semesterRouter = require("./src/router/semester_router");
dotenv.config();
const app = express();

// ✅ Middleware for parsing JSON & form-data
app.use(express.json()); // Handle JSON body
app.use(express.urlencoded({ extended: true })); // Handle form-urlencoded

// ✅ Routes
app.use("/api/students", studentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api",authController);
app.use("/api",qrAttendanceRouter);

app.use("/api/admin",departmentRouter);
app.use("/api/admin/subjects",subjectRouter);


app.use("/api/admin",semesterRouter);

//app.use("/api/auth", authRoutes); // login/logout ke liye


// ✅ Start Server
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
   app.listen(PORT, "0.0.0.0", () =>
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`)
  );
});
