const Project = require('../models/Project');
const User = require('../models/User');
const Task = require("../models/Task");


// Service to create a task
const createProject = async (projectData) => {
    try {
        const project = new Project(projectData);
        await project.save();
        // Fetch and populate after saving
        const populatedProject = await Project.findById(project._id)
            .populate({
                path: "manager",
                select: "name role",
                populate: {
                    path: "role",
                    select: "name",
                },
            })
            .populate({
                path: "team",
                select: "name role",
                populate: {
                    path: "role",
                    select: "name",
                },
            })
            ;

        return populatedProject;
    } catch (error) {
        throw new Error(error.message);
    }
};

// Service to get all tasks
const getAllProjects = async (userId, role) => {
    try {
        let projects;

        const projectQuery = role === "Founder"
            ? {}
            : {
                $or: [
                    { manager: userId },
                    { team: userId }
                ]
            };

        projects = await Project.find(projectQuery)
            .populate({
                path: "manager",
                select: "name role",
                populate: {
                    path: "role",
                    select: "name",
                },
            })
            .populate({
                path: "team",
                select: "name role",
                populate: {
                    path: "role",
                    select: "name",
                },
            });

        // Fetch task counts
        const projectWithTaskCounts = await Promise.all(projects.map(async (project) => {
            const totalTasks = await Task.countDocuments({ projectId: project._id });
            const section504Tasks = await Task.countDocuments({ projectId: project._id, sectionId: "504" });

            // Calculate progress
            const progress = totalTasks === 0 ? 0 : Math.round((section504Tasks / totalTasks) * 100);

            return {
                ...project.toObject(),
                totalTasks,
                section504Tasks,
                progress, // add progress field here
            };
        }));
        
        return projectWithTaskCounts;

    } catch (error) {
        throw new Error(error.message);
    }
};

const getAllUsers = async () => {
    const Users = await User.find()
        .populate("role", "name")
        .populate("reportBy", "name")
        ;

    return Users;
};

const updateProject = async (projectId, updateData) => {
    try {
        const project = await Project.findByIdAndUpdate(projectId, updateData, {
            new: true,
            runValidators: true,
        });
        if (!project) {
            throw new Error("Project not found");
        }
        return project;
    } catch (error) {
        throw new Error(error.message);
    }
};

const deleteProject = async (projectId) => {
    try {
        // First, delete all tasks associated with the project
        await Task.deleteMany({ projectId });

        // Then, delete the project itself
        await Project.findByIdAndDelete(projectId);
    } catch (error) {
        throw new Error(error.message);
    }
};




module.exports = {
    createProject,
    getAllProjects,
    getAllUsers,
    updateProject,
    deleteProject
}