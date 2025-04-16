const { StatusCodes } = require("http-status-codes");
const taskService = require("../services/taskService");

const createTask = async (req, res) => {
    try {
        const taskData = req.body;

        // Handle uploaded files
        if (req.files && req.files.length > 0) {
            taskData.attachments = req.files.map(file => ({
                fileUrl: file.path,
                originalName: file.originalname
            }));
        }

        const task = await taskService.createTask(taskData);
        res.status(201).json({
            status: "success",
            message: "Task created successfully",
            data: task,
        });
    } catch (error) {
        res.status(200).json({
            status: "fail",
            message: error.message,
        });
    }
};

const updateTask = async (req, res) => {
    try {
        const taskId = req.params.id;
        const updateData = req.body;

        // Handle new attachments
        if (req.files && req.files.length > 0) {
            updateData.attachments = req.files.map(file => ({
                fileUrl: file.path,
                originalName: file.originalname
            }));
        }

        const updatedTask = await taskService.updateTask(taskId, updateData);
        res.status(200).json({
            success: true,
            message: "Task updated successfully",
            data: updatedTask,
        });
    } catch (error) {
        res.status(StatusCodes.OK).json({ status: "fail", message: error.message });
    }
};

const deleteTask = async (req, res) => {
    try {
        const taskId = req.params.id;
        const deletedTask = await taskService.deleteTask(taskId);
        res.status(200).json({
            success: true,
            message: "Task deleted successfully",
            data: deletedTask,
        });
    } catch (error) {
        res.status(StatusCodes.OK).json({ status: "fail", message: error.message });
    }
};

const getTaskById = async (req, res) => {
    try {
        const taskId = req.params.id;
        const task = await taskService.getTaskById(taskId);
        res.status(200).json({
            success: true,
            message: "Task retrieved successfully",
            data: task,
        });
    } catch (error) {
        res.status(StatusCodes.OK).json({ status: "fail", message: error.message });
    }
};

const getAllTasks = async (req, res) => {
    try {
        const tasks = await taskService.getAllTasks();
        res.status(200).json({
            success: true,
            message: "Tasks retrieved successfully",
            data: tasks,
        });
    } catch (error) {
        res.status(StatusCodes.OK).json({ status: "fail", message: error.message });
    }
};

module.exports = {
    createTask,
    updateTask,
    deleteTask,
    getTaskById,
    getAllTasks,
};
