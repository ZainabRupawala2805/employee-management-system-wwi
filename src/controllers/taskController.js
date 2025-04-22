const { StatusCodes } = require("http-status-codes");
const taskService = require("../services/taskService");
const Task = require("../models/Task");

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
            tasks: task,
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
        const taskId = req.params.taskId;
        const updateData = req.body;
        const userId = req.user.id;

        // Fetch existing task
        const existingTask = await Task.findById(taskId);
        if (!existingTask) {
            return res.status(404).json({ status: "fail", message: "Task not found" });
        }

        // Handle new attachments
        if (req.files && req.files.length > 0) {
            const newAttachments = req.files.map(file => ({
                fileUrl: file.path,
                originalName: file.originalname
            }));
            // Merge old and new attachments
            updateData.attachments = [...existingTask.attachments, ...newAttachments];
        } else {
            // No new attachments, keep existing ones
            updateData.attachments = existingTask.attachments;
        }

        if (userId) {
            updateData.editedBy = userId;
        }

        const updatedTask = await taskService.updateTask(taskId, updateData);
        res.status(200).json({
            status: "success",
            message: "Task updated successfully",
            tasks: updatedTask,
        });
    } catch (error) {
        res.status(500).json({ status: "fail", message: error.message });
    }
};


const deleteTask = async (req, res) => {
    try {
        const taskId = req.params.taskId;
        const deletedTask = await taskService.deleteTask(taskId);
        res.status(200).json({
            status: "success",
            message: "Task deleted successfully",
            tasks: deletedTask,
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
            status: "success",
            message: "Task retrieved successfully",
            tasks: task,
        });
    } catch (error) {
        res.status(StatusCodes.OK).json({ status: "fail", message: error.message });
    }
};

const getAllTasks = async (req, res) => {
    try {
        const tasks = await taskService.getAllTasks();
        res.status(200).json({
            status: "success",
            message: "Tasks retrieved successfully",
            tasks: tasks,
        });
    } catch (error) {
        res.status(StatusCodes.OK).json({ status: "fail", message: error.message });
    }
};

const getTasksByProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user.id;

        const tasks = await taskService.getTasksByProject(projectId, userId);
        res.status(200).json({
            status: "success",
            message: projectId ? "Tasks for the project retrieved" : "All tasks retrieved",
            tasks: tasks,
        });
    } catch (error) {
        res.status(StatusCodes.OK).json({
            status: "fail",
            message: error.message,
        });
    }
};

const deleteAttachment = async (req, res) => {
    const { taskId, attachmentId } = req.params;

    try {
        const removed = await taskService.removeAttachmentFromTask(taskId, attachmentId);
        res.status(200).json({
            status: "success",
            message: 'Attachment removed successfully',
            removed,
        });
    } catch (error) {
        res.status(200).json({
            status: "fail",
            message: error.message || 'Failed to delete attachment',
        });
    }
};



module.exports = {
    createTask,
    updateTask,
    deleteTask,
    getTaskById,
    getAllTasks,
    getTasksByProject,
    deleteAttachment
};
