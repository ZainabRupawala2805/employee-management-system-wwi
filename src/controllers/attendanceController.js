const attendanceService = require('../services/attendanceService');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');


// check-in or marking attendance
const checkIn = async(req, res) => {
    try {
        const { userId } = req.body;
        if ( !userId ) {
            throw new CustomError.BadRequestError("User not found.");
        }
        const attendance = await attendanceService.markAttendance(userId);
        res.status(StatusCodes.CREATED).json({status: "success", message: 'Checked In successfully!', attendance});
    } catch (err) {
        res.status(StatusCodes.OK).json({ status: 'fail', message: err.message});
    }
};

// Mark check-out
const checkOut = async ( req, res ) => {
    try {
        const { userId } = req.body;
        if ( !userId ) {
            throw new CustomError.BadRequestError("User not found.");
        }
        const attendance = await attendanceService.markCheckout(userId);

        res.status(StatusCodes.OK).json({status: 'success', message : 'Checked-out successfully!', attendance});
    } catch (error) {
        res.status(StatusCodes.OK).json({ status: 'fail', message : error.message});
    }
};

// Get employee's attendance records
const getEmployeeAttendance = async (req, res) => {
    try {
        const { userId } = req.params;

        console.log("User ID:", userId);

        if (!userId) {
            throw new CustomError.BadRequestError("User not found.");
        }

        const attendance = await attendanceService.getAttendance(userId);
        if (attendance.length == 0) {
            throw new CustomError.BadRequestError("No attendance recorded.");
        }
        res.status(StatusCodes.OK).json({ status: 'success', message: "Data fetched successfully", attendance });
    } catch (error) {
        console.log("error:", error);        
        res.status(StatusCodes.OK).json({ status: 'fail', message: error.message });
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
        res.status(StatusCodes.OK).json({ status: 'success', message: "Data fetched successfully", attendance });

    } catch (error) {
        console.log("error:", error);        
        res.status(StatusCodes.OK).json({ status: 'fail', message: error.message });
    }
}

// Update attendance status (P/A/L)
const updateAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        if (!id || !data ) {
            throw new CustomError.BadRequestError("All fields are mandatory");
        }

        const attendance = await attendanceService.updateAttendance(id, data);
        
        res.status(StatusCodes.OK).json({ 
            status: 'success', 
            message: 'Attendance updated successfully', 
            attendance 
        });
    } catch (error) {
        res.status(StatusCodes.OK).json({ status: 'fail', message: error.message });
    }
}

const approveOrRejectAttendance = async (req, res) => {
    try {
        const { attendanceId, action } = req.body; // action will be "approve" or "reject"
        const managerId = req.user.id.toString(); // Assuming the logged-in manager's ID is extracted from token middleware

        const updatedAttendance = await attendanceService.approveOrRejectAttendance(attendanceId, managerId, action);

        return res.status(StatusCodes.OK).json({
            status: "success",
            message: `Attendance ${action === "Approve" ? "Approved" : "Rejected"} Successfully.`,
            data: updatedAttendance,
        });
    } catch (error) {
        return res.status(StatusCodes.OK).json({
            status: "fail",
            message: error.message,
        });
    }
};



module.exports = {
    checkIn,
    checkOut,
    getEmployeeAttendance,
    getAllEmployeesAttendance,
    updateAttendance,
    approveOrRejectAttendance
}