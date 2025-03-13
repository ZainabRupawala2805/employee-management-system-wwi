const attendanceService = require('../services/attendanceService');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');


// check-in or marking attendance
const checkIn = async(req, res) => {
    try {
        const { userId, role } = req.body;
        if ( !userId || !role ) {
            throw new CustomError.BadRequestError("User not found.");
        }
        const attendance = await attendanceService.markAttendance(userId, role);
        res.status(StatusCodes.CREATED).json({status: "success", message: 'Checked In successfully!', attendance});
    } catch (err) {
        res.status(StatusCodes.OK).json({ status: 'fail', message: err.message});
    }
};

// Mark check-out
const checkOut = async ( req, res ) => {
    try {
        const { userId, role } = req.body;
        if ( !userId || !role ) {
            throw new CustomError.BadRequestError("User not found.");
        }
        const attendance = await attendanceService.markCheckout(userId, role);

        res.status(StatusCodes.OK).json({status: 'success', message : 'Checked-out successfully!', attendance});
    } catch (error) {
        res.status(StatusCodes.OK).json({ status: 'fail', message : error.message});
    }
};

// Get employee's attendance records
const getEmployeeAttendance = async (req, res) => {
    try {
        const { userId } = req.params;
        const date = req.query.date;

        console.log("User ID:", userId);
        console.log("Date:", date);

        if (!userId) {
            throw new CustomError.BadRequestError("User not found.");
        }

        const attendance = await attendanceService.getAttendance(userId, date);
        res.status(StatusCodes.OK).json({ status: 'success', attendance });
    } catch (error) {
        console.log("error:", error);        
        res.status(StatusCodes.OK).json({ status: 'fail', error: error.message });
    }
};

// All Employees Attendance Sorted in descending order of total hours
const getAllEmployeesAttendance = async (req, res) => {
    try {
        const { userId, role } = req.query;
        if ( !userId || !role ) {
            throw new CustomError.BadRequestError("User not found.");
        }
        const attendance = await attendanceService.getAllAttendance(userId, role);
        res.status(StatusCodes.OK).json({ status: 'success', attendance });

    } catch (error) {
        console.log("error:", error);        
        res.status(StatusCodes.OK).json({ status: 'fail', error: error.message });
    }
}

// Update attendance status (P/A/L)
const updateStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status } = req.body;
        const { date } = req.query; // Get date from query parameters
        console.log("User ID:", userId);
        console.log("Status:", status);
        console.log("Date:", date);

        if (!userId || !date || !status) {
            throw new CustomError.BadRequestError("All fields are mandatory");
        }

        const attendance = await attendanceService.updateAttendanceStatus(userId, date, status);
        
        res.status(StatusCodes.OK).json({ 
            status: 'success', 
            message: 'Attendance status updated', 
            attendance 
        });
    } catch (error) {
        res.status(StatusCodes.OK).json({ status: 'fail', error: error.message });
    }
}


module.exports = {
    checkIn,
    checkOut,
    getEmployeeAttendance,
    getAllEmployeesAttendance,
    updateStatus
}