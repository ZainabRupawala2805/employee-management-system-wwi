const express = require("express");
const taskController = require("../controllers/taskController");
const authenticateUser = require("../middlewares/authentication");
const router = express.Router();

// Route to create a task
router.post("/create-task",authenticateUser, taskController.createTask);
router.patch("/update-task/:id",authenticateUser, taskController.updateTask);
router.get("/get-all", authenticateUser,taskController.getAllTasks);
router.get("/get-by-id/:id", authenticateUser,taskController.getTaskById);

module.exports = router;