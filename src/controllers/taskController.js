const { StatusCodes } = require("http-status-codes");
const taskService = require("../services/taskService");


const createTask = async (req, res) => {
    try {
        const taskData = req.body;
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

// const createTask = async (req, res) => {
// const {userId, title, description, dateAssigned, dateDue, status, assignedTo, assignedBy, priority}= req.body;

// if (!userId || !title || !description || !dateAssigned || !dateDue || !status || !assignedTo || !assignedBy || !priority){
//     return res.status(200).json({message:"All fields are required"});
// }
// try{
//     const task = await createTask({
//         userId,
//         title,
//         description,
//         dateAssigned,
//         dateDue,
//         status,
//         assignedTo,
//         assignedBy,
//         priority
//     });
//     res.status(201).json({message:"Task created successfully", task}); 
// } catch(error){
//     res.status(StatusCodes.OK).json({status: "fail", message: error.message});
// }

// };

const updateTask = async (req, res) => {
    try {
        const taskId = req.params.id;
        const updateData = req.body; 

        const updatedTask = await taskService.updateTask(taskId, updateData);
        res.status(200).json({
            success: true,
            message: "Task updated successfully",
            data: updatedTask,
        });
    } catch (error) {
        res.status(StatusCodes.OK).json({status: "fail", message: error.message});
    }
};

const getTaskById = async (req, res) => {
    try {
        const taskId = req.params.id; // Get task ID from URL params
        const task = await taskService.getTaskById(taskId);
        res.status(200).json({
            success: true,
            message: "Task retrieved successfully",
            data: task,
        });
    } catch (error) {
        res.status(StatusCodes.OK).json({status: "fail", message: error.message});
    }
};

// Controller to get all tasks
const getAllTasks = async (req, res) => {
    try {
        const tasks = await taskService.getAllTasks();
        res.status(200).json({
            success: true,
            message: "Tasks retrieved successfully",
            data: tasks,
        });
    } catch (error) {
        res.status(StatusCodes.OK).json({status: "fail", message: error.message});
    }
};

module.exports = {
    createTask,
    updateTask,
    getTaskById,
    getAllTasks,
};