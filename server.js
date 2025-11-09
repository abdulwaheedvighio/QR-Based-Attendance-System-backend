const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./src/config/database");
const http = require('http');
const { Server } = require('socket.io'); // Correct import for Socket.IO

// ✅ Import Routers
const studentRoutes = require("./src/router/student_router");
const authController = require('./src/router/auth_router');
const adminRoutes = require("./src/router/admin_routes");
const chatRoutes = require("./src/router/chat_routes");
const qrAttendanceRouter = require("./src/router/qr_attendance_router");
const departmentRouter = require('./src/router/department_router');
const subjectRouter = require("./src/router/subject_router");
const semesterRouter = require('./src/router/semester_router');

dotenv.config();
const app = express();

// ✅ Middleware for parsing JSON & form-data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Routes
app.use("/api/students", studentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", authController);
app.use("/api", qrAttendanceRouter);
app.use("/api/admin", departmentRouter);
app.use("/api/admin/subjects", subjectRouter);
app.use("/api/admin", semesterRouter);
app.use('/api/chat',chatRoutes);

// ✅ Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // change this to your frontend URL in production
    methods: ["GET", "POST"]
  }
});

// ✅ Socket.IO connection
io.on("connection", (socket) => {
  console.log("🔌 New client connected:", socket.id);

  // Join a specific room (e.g., for 1:1 chat)
  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  // Listen for messages and broadcast to room
  socket.on("sendMessage", ({ roomId, message, senderId }) => {
    io.to(roomId).emit("receiveMessage", { message, senderId, time: new Date() });
  });

  // Disconnect event
  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// ✅ Start server with Socket.IO
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  server.listen(PORT, "0.0.0.0", () =>
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`)
  );
});
