const Leave = require("../models/Leave");
const User = require("../models/User");
const CustomError = require('../errors');
const { StatusCodes } = require('http-status-codes');
const mongoose = require("mongoose");

const createLeave = async (leaveData) => {
    try {
        const { userId, startDate, endDate, reason, leaveType } = leaveData;

        // Fetch the user to check available leaves
        const user = await User.findById(userId);

        if (!user) {
            throw new Error("User not found");
        }

        
        const timeDiff = new Date(endDate) - new Date(startDate);
        const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;

        // Check if the user has enough leaves based on leaveType
        if (leaveType === "Sick") {
            if (user.sickLeave < daysDiff) {
                throw new Error("Not enough sick leaves available");
            }
        } else if (leaveType === "Paid") {
            if (user.paidLeave < daysDiff) {
                throw new Error("Not enough paid leaves available");
            }
        } else {
            throw new Error("Invalid leave type");
        }

        // Create the leave
        const leave = new Leave(leaveData);
        await leave.save();

        return leave;
    } catch (error) {
        throw new Error(error.message);
    }
};



const updateLeaveStatus = async (leaveId, status) => {
    try {
        const leave = await Leave.findById(leaveId).populate("userId");

        if (!leave) {
            throw new Error("Leave not found");
        }

        // Fetch the user to update leave balances
        const user = await User.findById(leave.userId._id);

        if (!user) {
            throw new Error("User not found");
        }

        // Calculate the number of days between startDate and endDate
        const timeDiff = leave.endDate - leave.startDate;
        const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;

        // Check if the leave is being approved
        if (status === "Approved") {


            if (user.availableLeaves < daysDiff) {
                throw new Error("Not enough leaves available");
            }
            
            user.availableLeaves -= daysDiff;

            if (leave.leaveType === "Sick") {
                if (user.sickLeave < daysDiff) {
                    throw new Error("Not enough sick leaves available");
                }
                user.sickLeave -= daysDiff;
            } else if (leave.leaveType === "Paid") {
                if (user.paidLeave < daysDiff) {
                    throw new Error("Not enough paid leaves available");
                }
                user.paidLeave -= daysDiff;
            } else {
                throw new Error("Invalid leave type");
            }

            // Save the updated user
            await user.save();
        }

        // Update the leave status
        leave.status = status;
        await leave.save();

        return leave;
    } catch (error) {
        throw new Error(error.message);
    }
};

const getAllLeaves = async () => {
    try {
        const leaves = await Leave.find()
            .populate({
                path: "userId",
                select: "name role", 
                populate: {
                    path: "role", 
                    select: "name", 
                },
            })
            .exec();

        return leaves;
    } catch (error) {
        throw new Error(error.message);
    }
};


const getLeaveById = async (leaveId) => {
    try {
        // Trim and validate the ID
        const trimmedId = String(leaveId).trim();
        
        if (!mongoose.Types.ObjectId.isValid(trimmedId)) {
            throw new Error('Invalid leave ID format');
        }

        const leaveObjectId = new mongoose.Types.ObjectId(trimmedId);
        
        const leave = await Leave.findById(leaveObjectId)
            .populate({
                path: 'userId',
                select: 'name email role',
                populate: {
                    path: 'role',
                    select: 'name'
                }
            });

        if (!leave) {
            throw new Error('Leave not found');
        }

        return leave;
    } catch (error) {
        console.error(`Error fetching leave ${leaveId}:`, error);
        throw error;
    }
};
const getLeavesByUserId = async (userId) => {
    try {
        // Validate the user ID format
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new Error("Invalid user ID format");
        }

        const userObjectId = new mongoose.Types.ObjectId(userId);

        // Fetch the user details
        const user = await User.findById(userObjectId).select("name email sickLeave paidLeave availableLeaves");
        if (!user) {
            throw new Error("User not found");
        }

        // Fetch leaves associated with the user
        const leaves = await Leave.find({ userId: userObjectId })
            .populate({
                path: "userId",
                select: "name email role",
                populate: {
                    path: "role",
                    select: "name",
                },
            })
            .sort({ startDate: -1 });

        return { leaves, user };
    } catch (error) {
        throw error;
    }
};



const getFilteredLeaves = async (userId, userRole, reportBy) => {
    try {
        let query = {};

        if (userRole === "Founder") {
            // Founder gets all leave records
            query = {};
        } else if (reportBy.length > 0) {
            // If the user has a reportBy list, fetch leaves of those users
            query = { userId: { $in: reportBy } };
        } else {
            // If no reportBy users, fetch only the current user's leaves
            query = { userId };
        }

        const leaves = await Leave.find(query)
            .populate({
                path: "userId",
                select: "name role",
                populate: { path: "role", select: "name" },
            })
            .sort({ startDate: -1 });

        return leaves;
    } catch (error) {
        throw new Error(error.message);
    }
};
module.exports = {
    createLeave,
    updateLeaveStatus,
    getAllLeaves,
    getLeaveById,
    getLeavesByUserId,
    getFilteredLeaves
};