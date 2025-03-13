const Leave = require("../models/Leave");

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
        const leave = await Leave.findByIdAndUpdate(
            leaveId,
            { status },
            { new: true } // Return the updated document
        );

        if (!leave) {
            throw new Error("Leave not found");
        }

        return leave;
    } catch (error) {
        throw new Error(error.message);
    }
};

module.exports = {
    createLeave,
    updateLeaveStatus,
};