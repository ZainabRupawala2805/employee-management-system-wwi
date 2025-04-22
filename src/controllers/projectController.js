const { StatusCodes } = require("http-status-codes");
const projectService = require("../services/projectService");

const createProject = async (req, res) => {
    try {
        const projectData = req.body;
        const project = await projectService.createProject(projectData);
        res.status(StatusCodes.CREATED).json({
            status: "success",
            message: "Task created successfully",
            projects: project,
        });
    } catch (error) {
        res.status(StatusCodes.OK).json({
            status: "fail",
            message: error.message,
        });
    }
};

// Controller to get all tasks
const getAllProjects = async (req, res) => {
    try {
        const {id, role} = req.user;
        const projects = await projectService.getAllProjects(id, role);
        res.status(200).json({
            status: "success",
            message: "Projects retrieved successfully",
            projects: projects,
        });
    } catch (error) {
        res.status(StatusCodes.OK).json({status: "fail", message: error.message});
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await projectService.getAllUsers();
        res.status(StatusCodes.OK).json({
            status: "success",
            message: "Projects retrieved successfully",
            users: users,
        });
    } catch (error) {
        res.status(StatusCodes.OK).json({status: "fail", message: error.message});
    }
};

const updateProject = async (req, res) => {
    try {
        const projectId = req.params.id;
        const updateData = req.body; 

        const updatedProject = await projectService.updateProject(projectId, updateData);
        res.status(StatusCodes.OK).json({
            status: "success",
            message: "Project updated successfully",
            projects: updatedProject,
        });
    } catch (error) {
        res.status(StatusCodes.OK).json({status: "fail", message: error.message});
    }
};

const deleteProject = async (req, res) => {
    try {
        const { projectId } = req.params;

        await projectService.deleteProject(projectId);

        return res.status(200).json({
            status: "success",
            message: "Project and associated tasks deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            status: "fail",
            message: error.message,
        });
    }
};




module.exports = {
    createProject,
    getAllProjects,
    getAllUsers,
    updateProject,
    deleteProject
}

