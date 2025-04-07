const express = require("express");
const { createLeaveController, updateLeaveStatusController, getAllLeavesController, getLeaveByIdController, getLeavesByUserIdController, getAllFilteredLeavesController, updateLeaveController } = require("../controllers/leaveController");
const authenticateUser = require("../middlewares/authentication");
const authenticate = require("../middlewares/authentication");
const upload = require('../middleware/upload');

const router = express.Router();

router.post("/leave-request", upload.single('attachment'), authenticateUser, createLeaveController);
router.patch("/status/:leaveId",authenticateUser, updateLeaveStatusController);
router.get("/get-all-leaves",authenticateUser, getAllLeavesController);
router.get('/get-by-id/:leaveId',authenticateUser, getLeaveByIdController);
router.get('/get-by-userid/:userId', authenticateUser,getLeavesByUserIdController);
router.get('/get-filtered', authenticateUser, getAllFilteredLeavesController)
router.patch('/update/:leaveId', upload.single('attachment'), authenticateUser,updateLeaveController);

module.exports = router;