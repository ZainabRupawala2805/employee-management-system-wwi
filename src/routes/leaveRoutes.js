const express = require("express");
const { createLeaveController, updateLeaveStatusController } = require("../controllers/leaveController");

const router = express.Router();

router.post("/create", createLeaveController);
router.patch("/status/:leaveId", updateLeaveStatusController);


module.exports = router;