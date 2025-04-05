const express = require("express");
const { createLeaveController, updateLeaveStatusController, getAllLeavesController, getLeaveByIdController, getLeavesByUserIdController, getAllFilteredLeavesController, updateLeaveController } = require("../controllers/leaveController");
const authenticateUser = require("../middlewares/authentication");
const authenticate = require("../middlewares/authentication");

const router = express.Router();

router.post("/leave-request", createLeaveController);
router.patch("/status/:leaveId",authenticateUser, updateLeaveStatusController);
router.get("/get-all-leaves",authenticateUser, getAllLeavesController);
router.get('/get-by-id/:leaveId', getLeaveByIdController);
router.get('/get-by-userid/:userId', getLeavesByUserIdController);
router.get('/get-filtered', authenticateUser, getAllFilteredLeavesController)
router.patch('/update/:leaveId', updateLeaveController);

module.exports = router;