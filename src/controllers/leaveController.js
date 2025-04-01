const { createLeave, updateLeaveStatus, getAllLeaves, getLeavesByUserId, getLeaveById } = require("../services/leaveService");
const CustomError = require('../errors');
const { StatusCodes } = require('http-status-codes');
const Leave = require('../models/Leave')
const mongoose = require("mongoose");

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

const getLeaveByIdController = async (req, res) => {
    const { leaveId } = req.params;

    try {
        // Additional validation
        if (!leaveId || !leaveId.trim()) {
            return res.status(400).json({
                status: 'fail',
                message: 'Leave ID is required'
            });
        }

        const trimmedId = leaveId.trim();
        
        if (trimmedId.length !== 24 || !/^[0-9a-fA-F]+$/.test(trimmedId)) {
            return res.status(400).json({
                status: 'fail',
                message: 'Leave ID must be 24 hexadecimal characters'
            });
        }

        const leave = await getLeaveById(trimmedId);

        return res.status(200).json({
            status: 'success',
            data: leave
        });

    } catch (error) {
        const statusCode = error.message.includes('not found') ? 404 : 500;
        return res.status(statusCode).json({
            status: 'error',
            message: error.message
        });
    }
};

const getLeavesByUserIdController = async (req, res) => {
    const { userId } = req.params;

    try {
        // Validate ID format before proceeding
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                status: 'fail',
                message: 'Invalid user ID format - must be 24-character hex string'
            });
        }

        const leaves = await getLeavesByUserId(userId);

        if (leaves.length === 0) {
            return res.status(StatusCodes.OK).json({
                status: 'success',
                message: 'No leaves found for this user',
                data: []
            });
        }

        return res.status(StatusCodes.OK).json({
            status: 'success',
            count: leaves.length,
            data: leaves
        });
    } catch (error) {
        const statusCode = error.message.includes('not found') 
            ? StatusCodes.NOT_FOUND 
            : StatusCodes.INTERNAL_SERVER_ERROR;

        return res.status(statusCode).json({
            status: 'error',
            message: error.message
        });
    }
};

module.exports = {
    createLeaveController,
    updateLeaveStatusController,
    getAllLeavesController, 
    getLeaveByIdController,
    getLeavesByUserIdController
};