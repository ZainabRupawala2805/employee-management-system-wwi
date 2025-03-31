const { createLeave, updateLeaveStatus, getAllLeaves } = require("../services/leaveService");
const CustomError = require('../errors');
const { StatusCodes } = require('http-status-codes');

const createLeaveController = async (req, res) => {
    const { userId, startDate, endDate, reason, leaveType} = req.body;

    if (!userId || !startDate || !endDate || !reason || !leaveType) {
        return res.status(200).json({ message: "All fields are required" });
    }

    try {
        const leave = await createLeave({
            userId,
            startDate,
            endDate,
            reason,
            leaveType,
        });
        res.status(201).json({ message: "Leave created successfully", leave });
    } catch (error) {
         res.status(StatusCodes.OK).json({ status: 'fail', message: error.message });
    }
};

const updateLeaveStatusController = async (req, res) => {
    const { leaveId } = req.params;
    const { status } = req.body;

    if (!["Approved", "Rejected"].includes(status)) {
        return res.status(200).json({ message: "Invalid status. Must be 'Approved' or 'Rejected'" });
    }

    try {
        const updatedLeave = await updateLeaveStatus(leaveId, status);
        res.status(200).json({ message: "Leave status updated successfully", leave: updatedLeave });
    } catch (error) {
         res.status(StatusCodes.OK).json({ status: 'fail', message: error.message });
    }
};


const getAllLeavesController = async (req, res) => {
    try {
        const leaves = await getAllLeaves();

        const formattedLeaves = leaves.map((leave) => ({
            _id: leave._id,
            startDate: leave.startDate,
            endDate: leave.endDate,
            reason: leave.reason,
            status: leave.status,
            leaveType: leave.leaveType,
            user: {
                name: leave.userId.name,
                role: leave.userId.role.name,
            },
        }));

        res.status(200).json({ message: "Leaves fetched successfully", leaves: formattedLeaves });
    } catch (error) {
        res.status(StatusCodes.OK).json({ status: 'fail', message: error.message });
    }
};

module.exports = {
    createLeaveController,
    updateLeaveStatusController,
    getAllLeavesController, 
};