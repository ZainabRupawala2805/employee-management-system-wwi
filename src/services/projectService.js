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

        if (role === "Founder") {
            // Founder can access all projects
            projects = await Project.find()
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
        } else {
            // Others get only projects where they are manager or in the team
            projects = await Project.find({
                $or: [
                    { manager: userId },
                    { team: userId }
                ]
            })
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
        }

        return projects;

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