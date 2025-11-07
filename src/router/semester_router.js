const express = require('express');
const {addSemester, getAllSemesters,deleteSemester} = require("../controllers/semester_controller");
const {authMiddleware,isAdmin } = require('../middlewares/auth');

const router = express.Router();


router.post('/add-semester',authMiddleware,isAdmin,addSemester);
router.get('/get-all-semester',authMiddleware,getAllSemesters);
router.delete('/delete-semester/:semesterId', authMiddleware, deleteSemester);


module.exports = router;