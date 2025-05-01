const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");
const authenticateUser = require("../middlewares/authentication");

router.post("/check-in", authenticateUser , attendanceController.checkIn);
router.post("/check-out", authenticateUser , attendanceController.checkOut);
router.get('/employeeAttendance/:userId', authenticateUser, attendanceController.getEmployeeAttendance);
router.put('/update-attendance/:id', authenticateUser, attendanceController.updateAttendance);
router.get('/get-all-attendance', authenticateUser, attendanceController.getAllEmployeesAttendance);
router.get('/single-user-attendance/:userId', authenticateUser, attendanceController.getEmployeeAttendance);
router.post('/approval', authenticateUser, attendanceController.approveOrRejectAttendance);
router.delete('/delete-attendance/:id', authenticateUser, attendanceController.deleteAttendance);


module.exports = router;