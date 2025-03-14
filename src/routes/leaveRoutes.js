const express = require("express");
const { createLeaveController, updateLeaveStatusController, getAllLeavesController } = require("../controllers/leaveController");

const router = express.Router();

router.post("/leave-request", createLeaveController);
router.patch("/status/:leaveId", updateLeaveStatusController);
router.get("/get-all-leaves", getAllLeavesController)


module.exports = router;