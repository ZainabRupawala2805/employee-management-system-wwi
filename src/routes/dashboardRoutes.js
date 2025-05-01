const express = require("express");
const router = express.Router();
const authenticateUser = require("../middlewares/authentication");
const dashboardController = require("../controllers/dashboardController");

router.get('/get-all-data/:userId', authenticateUser, dashboardController.combineData);
router.get('/monthly-calendar-data/:userId', authenticateUser, dashboardController.monthlyCalendar);
router.post('/user-table', dashboardController.generateUserPdf); // POST /api/pdf/user-table


module.exports = router