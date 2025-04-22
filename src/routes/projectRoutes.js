const express = require("express");
const router = express.Router();

const { createProject, getAllProjects, getAllUsers, updateProject, deleteProject } = require("../controllers/projectController");
const authenticateUser = require("../middlewares/authentication");

router.post("/create-project", authenticateUser, createProject);
router.get("/all-projects", authenticateUser, getAllProjects);
router.get("/all-users", authenticateUser, getAllUsers);
router.patch('/update-project/:id', authenticateUser, updateProject);
router.delete('/delete-project/:projectId', authenticateUser , deleteProject);



module.exports = router;