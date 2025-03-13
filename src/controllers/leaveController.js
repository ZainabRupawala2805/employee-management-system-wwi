const { createLeave, updateLeaveStatus } = require("../services/leaveService");

const createLeaveController = async (req, res) => {
    const { userId, startDate, endDate, reason, leaveType } = req.body;

    if (!userId || !startDate || !endDate || !reason || !leaveType) {
        return res.status(400).json({ message: "All fields are required" });
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
        res.status(200).json({ message: error.message });
    }
};

const updateLeaveStatusController = async (req, res) => {
    const { leaveId } = req.params;
    const { status } = req.body;

    if (!["Approved", "Rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be 'Approved' or 'Rejected'" });
    }

    try {
        const updatedLeave = await updateLeaveStatus(leaveId, status);
        res.status(200).json({ message: "Leave status updated successfully", leave: updatedLeave });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

module.exports = {
    createLeaveController,
    updateLeaveStatusController,
};