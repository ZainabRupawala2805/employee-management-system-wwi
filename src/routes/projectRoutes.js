const express = require("express");
const router = express.Router();

const { createProject, getAllProjects, getAllUsers, updateProject } = require("../controllers/projectController");
const authenticateUser = require("../middlewares/authentication");

router.post("/create-project", createProject);
router.get("/all-projects", getAllProjects);
router.get("/all-users", getAllUsers);
router.patch('/update-project/:id', updateProject);


module.exports = router;