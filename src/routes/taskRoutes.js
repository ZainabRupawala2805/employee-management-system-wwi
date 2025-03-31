const express = require("express");
const taskController = require("../controllers/taskController");

const router = express.Router();

// Route to create a task
router.post("/create-task", taskController.createTask);
router.patch("/update-task/:id", taskController.updateTask);
router.get("/get-all", taskController.getAllTasks);
router.get("/get-by-id/:id", taskController.getTaskById);

module.exports = router;