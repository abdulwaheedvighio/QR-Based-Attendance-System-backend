const express = require("express");
const { addSubject , getAllSubjects ,assignTeacherToSubject} = require("../controllers/subject_controller");
const { authMiddleware, isAdmin } = require("../middlewares/auth");

const router = express.Router();

router.post('/add-subject',authMiddleware,isAdmin ,addSubject);
router.get('/get-allSubjects',authMiddleware,getAllSubjects);
router.patch("/assign-teacher", authMiddleware, isAdmin, assignTeacherToSubject);


module.exports = router;