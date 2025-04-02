const express = require("express");
const { createLeaveController, updateLeaveStatusController, getAllLeavesController, getLeaveByIdController, getLeavesByUserIdController, getAllFilteredLeavesController } = require("../controllers/leaveController");
const authenticateUser = require("../middlewares/authentication");
const authenticate = require("../middlewares/authentication");

const router = express.Router();

router.post("/leave-request",authenticateUser, createLeaveController);
router.patch("/status/:leaveId",authenticateUser, updateLeaveStatusController);
router.get("/get-all-leaves",authenticateUser, getAllLeavesController);
router.get('/get-by-id/:leaveId', getLeaveByIdController);
router.get('/get-by-userid/:userId', getLeavesByUserIdController);
router.get('/get-filtered', authenticateUser, getAllFilteredLeavesController)


module.exports = router;