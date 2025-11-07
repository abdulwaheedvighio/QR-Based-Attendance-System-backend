const express = require("express");
const { addSubject , getAllSubjects ,assignTeacherToSubject,getAssignedSubjects} = require("../controllers/subject_controller");
const { authMiddleware, isAdmin,isTeacher } = require("../middlewares/auth");

const router = express.Router();

router.post('/add-subject',authMiddleware,isAdmin ,addSubject);
router.get('/get-allSubjects',authMiddleware,getAllSubjects);
router.put("/assign-teacher", authMiddleware, isAdmin, assignTeacherToSubject);
router.get("/get-assigned-subjects", authMiddleware, isTeacher, getAssignedSubjects);


module.exports = router;