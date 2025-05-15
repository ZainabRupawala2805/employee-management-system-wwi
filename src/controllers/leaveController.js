const { createLeave, updateLeaveStatus, getAllLeaves, getLeavesByUserId, getLeaveById, getFilteredLeaves, generateLeaveDetails, updateLeave } = require("../services/leaveService");
const CustomError = require('../errors');
const { StatusCodes } = require('http-status-codes');
const Leave = require('../models/Leave')
const mongoose = require("mongoose");
const User = require('../models/User')


const createLeaveController = async (req, res) => {
    try {
        const { user, leaves } = await createLeave(req.body, req.file);

        return res.status(StatusCodes.OK).json({
            status: "success", message: "Leave created successfully!",
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
        return res.status(StatusCodes.OK).json({ status: "fail", message: error.message });
    }
};


const updateLeaveStatusController = async (req, res) => {
    const { leaveId } = req.params;
    const { status } = req.body;

    if (!["Approved", "Rejected"].includes(status)) {
        return res.status(StatusCodes.OK).json({
            status: "fail",
            message: "Invalid status. Must be 'Approved' or 'Rejected'"
        });
    }

    try {
        const updatedLeave = await updateLeaveStatus(leaveId, status);

        // Get current user's ID and role
        const currentUserId = req.user.id;
        const currentUserRole = req.user.role; // Assuming this is a string like "Founder"

        let leaves = [];

        if (currentUserRole === "Founder") {
            // Founder gets all leave records
            leaves = await Leave.find({})
                .populate({
                    path: 'userId',
                    select: 'name',
                    populate: {
                        path: 'role',
                        select: 'name'
                    }
                })
                .sort({ startDate: -1 });
        } else {
            // Fetch reportBy from User schema
            const currentUser = await User.findById(currentUserId).select("reportBy");

            if (Array.isArray(currentUser.reportBy) && currentUser.reportBy.length > 0) {
                leaves = await Leave.find({ userId: { $in: currentUser.reportBy } })
                    .populate({
                        path: 'userId',
                        select: 'name',
                        populate: {
                            path: 'role',
                            select: 'name'
                        }
                    })
                    .sort({ startDate: -1 });
            } else {
                leaves = []; // No access
            }
        }

        res.status(StatusCodes.OK).json({
            status: "success",
            message: "Leave status updated and leaves fetched based on role",
            leaves: leaves
        });
    } catch (error) {
        res.status(StatusCodes.OK).json({
            status: 'fail',
            message: error.message
        });
    }
};


const getAllLeavesController = async (req, res) => {
    try {
        const leaves = await Leave.find()
            .populate({
                path: "userId",
                select: "-password",
                populate: {
                    path: "role",
                    select: "name permissions"
                }
            })
            .sort({ createdAt: -1 });

        res.status(200).json({
            status: "success",
            count: leaves.length,
            data: leaves.map(leave => ({
                leave,
                user: leave.userId
            }))
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};


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
        const { role, id } = req.user;

        let leaves = [];

        if (role === "Founder") {
            leaves = await Leave.find().populate("userId", "name role");
        } else {
            const user = await User.findById(id).select("reportBy");

            if (!user) {
                return res.status(StatusCodes.OK).json({
                    status: "fail",
                    message: "User not found"
                });
            }

            if (Array.isArray(user.reportBy) && user.reportBy.length > 0) {
                leaves = await Leave.find({ userId: { $in: user.reportBy } }).populate("userId", "name role");
            } else {
                // No users reporting to this user — return empty data
                return res.status(StatusCodes.OK).json({
                    status: "success",
                    count: 0,
                    leaves: [],
                    message: "No users reporting to you, so no leaves to fetch."
                });
            }
        }

        return res.status(StatusCodes.OK).json({
            status: "success",
            count: leaves.length,
            leaves: leaves,
            message: "Leaves fetched successfully"
        });

    } catch (error) {
        return res.status(StatusCodes.OK).json({
            status: "fail",
            message: error.message
        });
    }
};


const updateLeaveController = async (req, res) => {
    const { leaveId } = req.params;
    const file = req.file;
    const updateData = { ...req.body };
    const { userId } = req.body;
    console.log(updateData);    

    try {
        const { user, leaves } = await updateLeave(userId, leaveId, updateData, file);
        return res.status(StatusCodes.OK).json({
            status: "success", message: "Leave updated successfully!",
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
        return res.status(StatusCodes.OK).json({ status: "fail", message: error.message });
    }
};




module.exports = {
    createLeaveController,
    updateLeaveStatusController,
    getLeaveByIdController,
    getLeavesByUserIdController,
    getAllFilteredLeavesController,
    updateLeaveController
};