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
        const task = await Task.findById(taskId)
            .populate({
                path: "team",
                select: "name role id",
                populate: {
                    path: "role",
                    select: "name id",
                },
            })
            ;
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

const getTasksByProject = async (projectId, userId, role) => {
    try {
        let query;

        if (projectId) {
            query = { projectId };
        } else if (role === "Founder") {
            query = {}; // fetch all tasks
        } else {
            query = { team: userId };
        }

        const tasks = await Task.find(query)
            .populate({
                path: "team",
                select: "name role id",
                populate: {
                    path: "role",
                    select: "name id",
                },
            });

        return tasks;
    } catch (error) {
        throw new Error(error.message);
    }
};


const removeAttachmentFromTask = async (taskId, attachmentId) => {
    const task = await Task.findById(taskId);
    if (!task) {
        throw new Error('Task not found');
    }

    const attachmentIndex = task.attachments.findIndex(att => att._id.toString() === attachmentId);
    if (attachmentIndex === -1) {
        throw new Error('Attachment not found');
    }

    const removedAttachment = task.attachments.splice(attachmentIndex, 1)[0];

    await task.save();

    return removedAttachment;
};


module.exports = {
    createTask,
    updateTask,
    deleteTask,
    getTaskById,
    getAllTasks,
    getTasksByProject,
    removeAttachmentFromTask
};
