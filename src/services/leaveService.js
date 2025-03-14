const Leave = require("../models/Leave");
const User = require("../models/User");

const createLeave = async (leaveData) => {
    try {
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


        if (status === "Approved") {
            const user = await User.findById(leave.userId._id);

            if (!user) {
                throw new Error("User not found");
            }


            const timeDiff = leave.endDate - leave.startDate;
            const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;


            if (user.availableLeaves < daysDiff) {
                throw new Error("You are not eligible to take more leaves");
            }

            user.availableLeaves -= daysDiff;
            user.totalLeaves -= daysDiff;

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