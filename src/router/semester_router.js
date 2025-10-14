const express = require('express');
const {addSemester, getAllSemesters} = require("../controllers/semester_controller");
const {authMiddleware,isAdmin } = require('../middlewares/auth');

const router = express.Router();


router.post('/add-semester',authMiddleware,isAdmin,addSemester);
router.get('/get-all-semester',authMiddleware,getAllSemesters);


module.exports = router;