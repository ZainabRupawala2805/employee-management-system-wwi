const Attendance = require('../models/Attendance');
const User = require('../models/User');
const CustomError = require('../errors');
const mongoose = require('mongoose');
const cron = require('node-cron');
const moment = require("moment");


const markAttendance = async (userId, role) => {
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

    let attendanceRecords;

    if (role === "Admin") {
        // Admin: Fetch all attendance records
        attendanceRecords = await Attendance.find()
            .populate("userId", "name")
            .sort({ createdAt: -1 });
    } else if (role === "Employee") {
        // Employee: Fetch only their attendance records
        attendanceRecords = await Attendance.find({ userId })
            .populate("userId", "name")
            .sort({ createdAt: -1 });
    } else {
        throw new CustomError.UnauthenticatedError("Unauthorized Role!");
    }

    const data = attendanceRecords.map(record => ({
        id: record.id,
        name: record.userId ? record.userId.name : "N/A",
        date: record.date,
        clocksIn: record.clocksIn,
        clocksOut: record.clocksOut,
        totalHours: record.totalHours,
        status: record.status,
    }));

    return data;
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
    let attendanceRecords;

    if (role === "Admin") {
        // Admin: Fetch all attendance records
        attendanceRecords = await Attendance.find()
            .populate("userId", "name")
            .sort({ createdAt: -1 });
    } else if (role === "Employee") {
        // Employee: Fetch only their attendance records
        attendanceRecords = await Attendance.find({ userId })
            .populate("userId", "name")
            .sort({ createdAt: -1 });
    } else {
        throw new CustomError.UnauthenticatedError("Unauthorized Role!");
    }

    const data = attendanceRecords.map(record => ({
        id: record.id,
        name: record.userId ? record.userId.name : "N/A",
        date: record.date,
        clocksIn: record.clocksIn,
        clocksOut: record.clocksOut,
        totalHours: record.totalHours,
        status: record.status ? record.status : "Absent",
    }));

    return data;
};

// Get attendance records for an employee
const getAttendance = async (userId, date) => {
    let attendanceRecords;

    if (date) {
        // If date is provided, find attendance for that specific date
        attendanceRecords = await Attendance.find({ userId, date });
    } else {
        // If no date is provided, fetch all attendance records in descending order
        attendanceRecords = await Attendance.find({ userId }).sort({ date: -1 });
    }

    return attendanceRecords;
};

// Get Attendance of all the Employee 
const getAllAttendance = async (userId, role) => {
    let attendanceRecords;

    if (role === "Admin") {
        // Admin: Fetch all attendance records
        attendanceRecords = await Attendance.find()
            .populate("userId", "name")
            .sort({ createdAt: -1 });
    } else if (role === "Employee") {
        // Employee: Fetch only their attendance records
        attendanceRecords = await Attendance.find({ userId })
            .populate("userId", "name")
            .sort({ createdAt: -1 });
    } else {
        throw new CustomError.UnauthenticatedError("Unauthorized Role!");
    }
    if (!attendanceRecords || attendanceRecords.length === 0) {
        throw new CustomError.NotFoundError("No attendance records found!")
    }
    const data = attendanceRecords.map(record => ({
        id: record.id,
        name: record.userId ? record.userId.name : "N/A",
        date: record.date,
        clocksIn: record.clocksIn,
        clocksOut: record.clocksOut,
        totalHours: record.totalHours,
        status: record.status,
    }));

    return data;
};

// Update attendance status manually
const updateAttendanceStatus = async (userId, date, status) => {
    // Find attendance record by userId and date
    const attendance = await Attendance.findOne({ userId, date });

    if (!attendance) {
        throw new CustomError.NotFoundError("Attendance record not found!");
    }

    // Update the status
    attendance.status = status;
    return await attendance.save();
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



module.exports = {
    markAttendance,
    markCheckout,
    getAttendance,
    updateAttendanceStatus,
    getAllAttendance
}