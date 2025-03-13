const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");
const authenticateUser = require("../middlewares/authentication");

router.post("/check-in", authenticateUser , attendanceController.checkIn);
router.post("/check-out", authenticateUser , attendanceController.checkOut);
router.get('/employeeAttendance/:userId', authenticateUser, attendanceController.getEmployeeAttendance);
router.put('/updateStatus/:userId', authenticateUser, attendanceController.updateStatus);
router.get('/get-all-attendance', authenticateUser, attendanceController.getAllEmployeesAttendance);

module.exports = router;