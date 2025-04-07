const { updateLeaveStatus, getLeavesByUserId, getLeaveById, getFilteredLeaves, generateLeaveDetails } = require("../services/leaveService");
const CustomError = require('../errors');
const { StatusCodes } = require('http-status-codes');
const Leave = require('../models/Leave')
const mongoose = require("mongoose");
const User = require('../models/User')


const createLeaveController = async (req, res) => {
    try {
        const { startDate, endDate, reason, leaveType, userId, halfDayDates } = req.body;

        if (!startDate || !userId || !reason || !leaveType) {
            return res.status(400).json({ status: "fail", message: "All fields are required" });
        }

        // Convert to Date objects
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start > end) {
            return res.status(StatusCodes.OK).json({ status: "fail", message: "Start date cannot be after end date" });
        }

        // Generate leaveDetails object
        let leaveDetails = generateLeaveDetails(start, end);

        // If any half-day leaves are specified, update the leaveDetails object
        if (halfDayDates && typeof halfDayDates === 'object') {
            Object.entries(halfDayDates).forEach(([date, session]) => {
                if (leaveDetails[date]) {
                    leaveDetails[date] = session === "First Half" || session === "Second Half" ? session : "Full Day";
                }
            });
        }

        const leave = await Leave.create({
            userId,
            startDate: start,
            endDate: end,
            reason,
            status: "Pending",
            leaveType,
            leaveDetails
        });

        return res.status(StatusCodes.OK).json({ status: "success", message: "Leave created successfully!" , leaves: leave });

    } catch (error) {
        return res.status(StatusCodes.OK).json({ status: "fail", message: error.message });
    }
};

const updateLeaveStatusController = async (req, res) => {
    const { leaveId } = req.params;
    const { status } = req.body;

    if (!["Approved", "Rejected"].includes(status)) {
        return res.status(StatusCodes.OK).json({ status: "fail" , message: "Invalid status. Must be 'Approved' or 'Rejected'" });
    }

    try {
        const updatedLeave = await updateLeaveStatus(leaveId, status);
        res.status(StatusCodes.OK).json({ status: "success", message: "Leave status updated successfully", leaves: updatedLeave });
    } catch (error) {
        res.status(StatusCodes.OK).json({ status: 'fail', message: error.message });
    }
};

// const getAllLeavesController = async (req, res) => {
//   try {
//       const leaves = await getAllLeaves();

//       const formattedLeaves = leaves.map((leave) => ({
//           _id: leave._id,
//           startDate: leave.startDate,
//           endDate: leave.endDate,
//           reason: leave.reason,
//           status: leave.status,
//           leaveType: leave.leaveType,
//           user: {
//                 id: leave.userId._id,
//                 name: leave.userId.name,
//                 role: leave.userId.role.name,
//           },
//       }));

//       res.status(200).json({ status: "success" , message: "Leaves fetched successfully", leaves: formattedLeaves });
//   } catch (error) {
//       res.status(StatusCodes.OK).json({ status: 'fail', message: error.message });
//   }
// };


const getLeaveByIdController = async (req, res) => {
    const { leaveId } = req.params;

    try {
        // Additional validation
        if (!leaveId || !leaveId.trim()) {
            return res.status(StatusCodes.OK).json({
                status: 'fail',
                message: 'Leave ID is required'
            });
        }

        const trimmedId = leaveId.trim();

        if (trimmedId.length !== 24 || !/^[0-9a-fA-F]+$/.test(trimmedId)) {
            return res.status(StatusCodes.OK).json({
                status: 'fail',
                message: 'Leave ID must be 24 hexadecimal characters'
            });
        }

        const leave = await getLeaveById(trimmedId);

        return res.status(StatusCodes.OK).json({
            status: 'success',
            leaves: leave
        });

    } catch (error) {
        // const statusCode = error.message.includes('not found') ? 404 : 500;
        return res.status(StatusCodes.OK).json({
            status: 'fail',
            message: error.message
        });
    }
};

const getLeavesByUserIdController = async (req, res) => { // logged in user, single user ID
    const { userId } = req.params;

    try {
        // Validate the userId format
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(StatusCodes.OK).json({
                status: "fail",
                message: "Invalid user ID format - must be a 24-character hex string",
            });
        }

        // Fetch leaves and user details
        const { leaves, user } = await getLeavesByUserId(userId);

        if (!user) {
            return res.status(StatusCodes.OK).json({
                status: "fail",
                message: "User not found",
            });
        }

        if (leaves.length === 0) {
            return res.status(StatusCodes.OK).json({
                status: "success",
                message: "No leaves found for this user",
                leaves: {
                    user: {
                        name: user.name,
                        sickLeave: user.sickLeave,
                        paidLeave: user.paidLeave,
                        unpaidLeave: user.unpaidLeave,
                        availableLeaves: user.availableLeaves,
                    },
                    data: []
                }
            });
        }

        return res.status(StatusCodes.OK).json({
            status: "success",
            count: leaves.length,
            leaves: {
                user: {
                    name: user.name,
                    sickLeave: user.sickLeave,
                    paidLeave: user.paidLeave,
                    unpaidLeave: user.unpaidLeave,
                    availableLeaves: user.availableLeaves,
                },
                data: leaves
            }
        });
    } catch (error) {
        return res.status(StatusCodes.OK).json({
            status: "fail",
            message: error.message,
        });
    }
};


const getAllFilteredLeavesController = async (req, res) => {
    try {
        const { role, id } = req.user; // Extract user role and ID from token

        let leaves;

        if (role === "Founder") {
            leaves = await Leave.find().populate("userId", "name email role");
        } else {
            const user = await User.findById(id).select("reportBy");
            console.log(user);

            if (!user) {
                return res.status(StatusCodes.OK).json({ status: "fail", message: "User not found" });
            }

            let userIdsToFetch = user.reportBy.length > 0 ? user.reportBy : [id];
            leaves = await Leave.find({ userId: { $in: userIdsToFetch } }).populate("userId", "name email role");
        }

        return res.status(StatusCodes.OK).json({ status: "success", count: leaves.length, leaves: leaves, message: "Leaves fetched successfully" });

    } catch (error) {
        return res.status(StatusCodes.OK).json({ status: "fail", message: error.message });
    }
};


module.exports = {
    createLeaveController,
    updateLeaveStatusController,
    getLeaveByIdController,
    getLeavesByUserIdController,
    getAllFilteredLeavesController
};