const Task = require("../models/Task");

// Service to create a task
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

// Service to get a task by ID
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

// Service to get all tasks
const getAllTasks = async () => {
    try {
        const tasks = await Task.find();
        return tasks;
    } catch (error) {
        throw new Error(error.message);
    }
};

module.exports = {
    createTask,
    updateTask,
    getTaskById,
    getAllTasks,
};