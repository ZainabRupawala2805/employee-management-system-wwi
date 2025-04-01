const express = require("express");
const { createLeaveController, updateLeaveStatusController, getAllLeavesController } = require("../controllers/leaveController");
const authenticateUser = require("../middlewares/authentication");

const router = express.Router();

router.post("/leave-request",authenticateUser, createLeaveController);
router.patch("/status/:leaveId",authenticateUser, updateLeaveStatusController);
router.get("/get-all-leaves", authenticateUser, getAllLeavesController)


module.exports = router;