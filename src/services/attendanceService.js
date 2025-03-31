const Attendance = require('../models/Attendance');
const User = require('../models/User');
const CustomError = require('../errors');
const mongoose = require('mongoose');
const cron = require('node-cron');
const moment = require("moment");
const { fetchAttendanceByRole } = require('../utils/getAttendanceUtils');


const markAttendance = async (userId) => {
    const date = new Date().toISOString().split('T')[0];
    let attendance = await Attendance.findOne({ userId, date });
    if (attendance) {
        throw new CustomError.BadRequestError("Attendance is already registered for today!");
    }

    attendance = new Attendance({
        userId,
        date,
        clocksIn: new Date(),
        status: 'Present'
    });
    console.log(attendance.clocksIn);
    await attendance.save();

    // call fetchAttendanceByRole from utils to get the response.
    // return await fetchAttendanceByRole(userId, role);
    const response = await Attendance.find({ userId })
        .populate("userId", "name")
        .sort({ date: -1 });

    return response;
};

// Mark check-out and calculate total working hours
const markCheckout = async (userId) => {
    const date = new Date().toISOString().split('T')[0];
    let attendance = await Attendance.findOne({ userId, date });
    if (!attendance) {
        throw new CustomError.BadRequestError("No attendance record found for today.");
    }

    if (attendance.clocksOut) {
        throw new CustomError.BadRequestError("Check out already marked!");
    }

    attendance.clocksOut = new Date();
    console.log(attendance.clocksOut);

    attendance.totalHours = ((attendance.clocksOut - attendance.clocksIn) / (1000 * 60 * 60)).toFixed(3);
    console.log(attendance.totalHours);

    await attendance.save();

    // return await fetchAttendanceByRole(userId, role);
    const response = await Attendance.find({ userId })
        .populate("userId", "name")
        .sort({ date: -1 });

    return response;
};

// Get attendance records for an employee
const getAttendance = async (userId) => {
    const attendanceRecords = await Attendance.find({ userId })
        .populate("userId", "name")
        .sort({ date: -1 });
    return attendanceRecords;
};

// Get Attendance of all the Employee 
const getAllAttendance = async (userId, role) => {
    return await fetchAttendanceByRole(userId, role);
};

const updateAttendance = async (id, data) => {
    // Find the attendance record
    const attendance = await Attendance.findById(id);

    if (!attendance) {
        throw new CustomError.NotFoundError("Attendance record not found!");
    }

    // Update fields from request body
    if (data.clocksIn) attendance.clocksIn = new Date(data.clocksIn);
    if (data.clocksOut) attendance.clocksOut = new Date(data.clocksOut);

    // Calculate totalHours if both clockIn & clockOut exist
    if (attendance.clocksIn && attendance.clocksOut) {
        attendance.totalHours = Math.abs((attendance.clocksOut - attendance.clocksIn) / (1000 * 60 * 60)); // Convert ms to hours
        attendance.totalHours = parseFloat(attendance.totalHours.toFixed(2)); // Keep 2 decimal places
    }

     // Change status to "In Approval" when user edits attendance
     attendance.status = "In Approval";

    // Save the updated document
    const updatedRecord = await attendance.save();

    // Fetch and return all attendance records for the user
    const attendanceRecords = await Attendance.find({ userId: updatedRecord.userId })
        .populate("userId", "name")
        .sort({ date: -1 });

    return attendanceRecords;
};



// Automatically mark absentees and leaves at midnight
const markAbsent = async () => {
    try {
        const today = moment().format('YYYY-MM-DD');

        // fetch all user's ID
        const users = await User.find() // Fetch all users (only IDs)
        for (const user of users) {
            // Check if attendance already exists for today
            const existingRecord = await Attendance.findOne({
                userId: user.id,
                date: today,
            });

            if (!existingRecord) {
                // Mark user as absent if no record found..
                await Attendance.create({
                    userId: user.id,
                    date: today,
                    status: "Absent",
                });
                console.log(`Marked ${user.name} as absent for ${today}`);
            }
        }
    } catch (error) {
        console.error("Error in scheduler: ", error);
    }
}

// Schedule the function to run at 11 PM every day
cron.schedule("0 23 * * *", async () => {
    console.log("Running attendance scheduler.");
    await markAbsent();
}, {
    scheduled: true,
    timezone: "Asia/Kolkata",
});


const approveOrRejectAttendance = async (attendanceId, managerId, action) => {
    // Find the attendance record
    const attendance = await Attendance.findById(attendanceId);
    console.log(attendance);
    
    if (!attendance) {
        throw new CustomError.NotFoundError("Attendance record not found!");
    }

    // Find the user associated with the attendance record
    const user = await User.findById(attendance.userId);
    if (!user) {
        throw new CustomError.NotFoundError("User not found!");
    }

    if (!mongoose.Types.ObjectId.isValid(managerId)) {
        throw new CustomError.BadRequestError("Invalid Manager ID");
    }
    // Find the manager
    const manager = await User.findById(managerId).populate("role"); // Fetch role details

    if (!manager || !manager.role) {
        throw new CustomError.BadRequestError("Invalid manager.");
    }

    // Check if the manager is a "Founder" (can approve anyone)
    const isFounder = manager.role.name === "Founder"; // Assuming role has a "name" field

    // Check if the manager has permission to approve (if not a Founder)
    const isManagerOfUser = manager.reportBy && manager.reportBy.includes(user.id.toString());

    if (!isFounder && !isManagerOfUser) {
        throw new CustomError.BadRequestError("You are not authorized to approve/reject this request.");
    }

    // Update status based on action
    attendance.status = action === "Approve" ? "Present" : "Absent";

    // Save the updated record
    const updatedRecord = await attendance.save();

    return await fetchAttendanceByRole(managerId, manager.role.name);
};



module.exports = {
    markAttendance,
    markCheckout,
    getAttendance,
    updateAttendance,
    getAllAttendance,
    approveOrRejectAttendance
}