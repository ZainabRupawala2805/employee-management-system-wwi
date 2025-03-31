const Leave = require("../models/Leave");
const User = require("../models/User");

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


module.exports = {
    createLeave,
    updateLeaveStatus,
    getAllLeaves
};