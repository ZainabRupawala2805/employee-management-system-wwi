const Task = require("../models/Task");

const createTask = async (taskData) => {
    try {
        const task = new Task(taskData);
        await task.save();
        return task;
    } catch (error) {
        throw new Error(error.message);
    }
};

const updateTask = async (taskId, updateData) => {
    try {
        const task = await Task.findByIdAndUpdate(taskId, updateData, {
            new: true,
            runValidators: true,
        });
        if (!task) {
            throw new Error("Task not found");
        }
        return task;
    } catch (error) {
        throw new Error(error.message);
    }
};

const getTaskById = async (taskId) => {
    try {
        const task = await Task.findById(taskId);
        if (!task) {
            throw new Error("Task not found");
        }
        return task;
    } catch (error) {
        throw new Error(error.message);
    }
};

const getAllTasks = async () => {
    try {
        const tasks = await Task.find();
        return tasks;
    } catch (error) {
        throw new Error(error.message);
    }
};

const deleteTask = async (taskId) => {
    try {
        const deleted = await Task.findByIdAndDelete(taskId);
        if (!deleted) {
            throw new Error("Task not found or already deleted");
        }
        return deleted;
    } catch (error) {
        throw new Error(error.message);
    }
};
const getTasksByProject = async (projectId) => {
    try {
        const query = projectId ? { projectId } : {};
        const tasks = await Task.find(query);
        return tasks;
    } catch (error) {
        throw new Error(error.message);
    }
};

module.exports = {
    createTask,
    updateTask,
    deleteTask,
    getTaskById,
    getAllTasks,
    getTasksByProject
};
