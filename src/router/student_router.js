const express = require("express");
const { authMiddleware, isStudent } = require("../middlewares/auth");
//const { getStudentProfile } = require("../controllers/student_controller");
const {registerStudent} = require("../controllers/student_controller");
const router = express.Router();

router.get("/profile", authMiddleware, isStudent, registerStudent);

module.exports = router;
