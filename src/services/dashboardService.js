const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Task = require("../models/Task");
const moment = require("moment");


const combineData = async (userId) => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    // Attendance
    const attendance = await Attendance.find({
        userId: userId,
        date: {
            $gte: startOfMonth,
            $lte: yesterday
        }
    });

    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    const attendanceDetails = attendance.map((record) => {
        const { date, clocksIn, clocksOut, totalHours, status } = record;
        const lateComing = new Date(date);
        lateComing.setHours(11, 0, 0, 0);

        if (status === "Present") presentCount++;
        if (status === "Absent") absentCount++;

        if (clocksIn && new Date(clocksIn) > lateComing) lateCount++;

        return {
            date,
            clocksIn,
            clocksOut,
            totalHours,
            status
        };
    });

    // Tasks
    const tasks = await Task.find(
        {
            $or: [
                { manager: userId },
                { team: userId }
            ]
        }
    ).select("title _id priority dueDate");

    // Leaves
    const leaves = await User.findById(userId).select("sickLeave unpaidLeave paidLeave availableLeaves");

    return {
        attendance: {
            records: attendanceDetails,
            counts: {
                presentCount, absentCount, lateCount
            }
        },
        tasks,
        leaves
    };
}

const generateMonthlyCal = async (userId) => {
    const WORK_HOURS_THRESHOLD = 8 * 60; // 8 hours considered as full day but in minutes..
    const LATE_THRESHOLD_HOUR = 11; // 11 AM considered late

    const currentMonthStart = moment().startOf('month').toDate();
    const currentMonthEnd = moment().endOf('month').toDate();

    const attendances = await Attendance.find({
        userId,
        date: { $gte: currentMonthStart, $lte: currentMonthEnd },
    }).lean();

    const attendanceMap = {};
    const earlyOutMap = {};

    // First mark all Sundays (weekend)
    let currentDay = moment(currentMonthStart);
    while (currentDay.isSameOrBefore(currentMonthEnd)) {
        if (currentDay.day() === 0) {
            attendanceMap[currentDay.format('YYYY-MM-DD')] = ['weekend'];
        }
        currentDay.add(1, 'day');
    }

    attendances.forEach((record) => {
        const dateStr = moment(record.date).format('YYYY-MM-DD');
        attendanceMap[dateStr] = attendanceMap[dateStr] || [];

        const { status, clocksIn, clocksOut, location, totalHours } = record;
        // present / absent / leave

        if (status) {
            attendanceMap[dateStr].push(status.toLowerCase());
        }

        // remote
        if (location && location.latitude && location.longitude) {
            attendanceMap[dateStr].push("remote");
        }

        // missing (clockIn exists but no clockOut) 
        if (clocksIn && !clocksOut) {
            attendanceMap[dateStr].push('missing');
        }

        // late (clocksIn after threshold hour)
        if (clocksIn) {
            const clockInHour = moment(clocksIn).hour();
            if (clockInHour >= LATE_THRESHOLD_HOUR) {
                attendanceMap[dateStr].push('late');
            }
        }

        // early (worked hours less than threshold) 
        if (totalHours !== 0 && totalHours !== undefined && totalHours < WORK_HOURS_THRESHOLD) {
            attendanceMap[dateStr].push("early");

            // Now also calculate early out minutes
            const totalWorkedMinutes = totalHours * 60;
            const remainingMinutes = Math.round(WORK_HOURS_THRESHOLD - totalWorkedMinutes);
            // console.log("remainingMinutes: ", remainingMinutes);            

            if (remainingMinutes > 0) {
                earlyOutMap[dateStr] = remainingMinutes;
            }
        }
    })

    return {
        attendanceData: attendanceMap,
        earlyOutData: earlyOutMap
    };
}



module.exports = {
    combineData,
    generateMonthlyCal
}