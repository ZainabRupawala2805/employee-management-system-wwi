const mongoose = require('mongoose');
const User = require('../models/User');
const Attendance = require('../models/Attendance')
const CustomError = require('../errors')

const fetchAttendanceByRole = async (userId, role) => {
    try {
        let attendanceRecords;

        if (role === "Founder") {
            // Founder: Fetch all attendance records except Founder
            attendanceRecords = await Attendance.find()
                .populate({
                    path: "userId",
                    select: "name role",
                    populate: {
                        path: "role",
                        select: "name", // Assuming role schema has a 'name' field
                    },
                })
                .sort({ date: -1 });

            // Filter out records where the user's role is "Founder"
            attendanceRecords = attendanceRecords.filter(record => {
                // console.log("Checking user role:", record.userId?.role?.name); // Debugging Line
                return record.userId?.role?.name !== "Founder";
            });

        } else {
            // Fetch the logged-in user's data to get the reportBy field
            const loggedInUser = await User.findById(userId).populate("reportBy");
            if (!loggedInUser) {
                throw new CustomError.NotFoundError("User not found!");
            }

            const reportByIds = loggedInUser.reportBy.map(user => user._id);

            // Fetch attendance records for users in the reportBy array
            attendanceRecords = await Attendance.find({ userId: { $in: reportByIds } })
                .populate("userId", "name")
                .sort({ date: -1 });
        }
        if (!attendanceRecords || attendanceRecords.length === 0) {
            throw new CustomError.NotFoundError("No attendance records found!")
        }
        const data = attendanceRecords.map(record => ({
            id: record.id,
            userId: record.userId ? { id: record.userId._id, name: record.userId.name } : null, // ✅ Include both id & name
            date: record.date,
            clocksIn: record.clocksIn,
            clocksOut: record.clocksOut,
            totalHours: record.totalHours,
            status: record.status ? record.status : "Absent",
        }));

        return data;
    } catch (error) {
        console.error("Error in fetchAttendanceByRole:", error.message);

        // Return an empty array instead of throwing, to prevent app crashes
        return { error: true, message: error.message };
    }
};

module.exports = { fetchAttendanceByRole };
