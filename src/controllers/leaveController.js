const { updateLeaveStatus, getAllLeaves, getLeavesByUserId, getLeaveById, getFilteredLeaves, generateLeaveDetails, updateLeave } = require("../services/leaveService");
const CustomError = require('../errors');
const { StatusCodes } = require('http-status-codes');
const Leave = require('../models/Leave')
const mongoose = require("mongoose");
const User = require('../models/User')


const createLeaveController = async (req, res) => {
    try {
        const { startDate, endDate, reason, leaveType, userId, halfDayDates } = req.body;
        const file = req.file; // Get uploaded file

        if (!startDate || !reason || !leaveType) {
            return res.status(400).json({ status: "fail", message: "All fields are required" });
        }

        // Convert to Date objects
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start > end) {
            return res.status(400).json({ status: "fail", message: "Start date cannot be after end date" });
        }

        console.log("halfDayDates: " , halfDayDates);

        // Generate leaveDetails object
        let leaveDetails = generateLeaveDetails(start, end);

        console.log("leaveDetails: " , leaveDetails);
        
        // Handle half-day leaves if specified
        if (halfDayDates && typeof halfDayDates === 'object') {
            Object.entries(halfDayDates).forEach(([date, session]) => {
                if (leaveDetails[date]) {
                    leaveDetails[date] = session === "First Half" || session === "Second Half" ? session : "Full Day";
                }
            });
        }

        console.log("leaveDetails: " , leaveDetails);

        await Leave.create({
            userId,
            startDate: start,
            endDate: end,
            reason,
            status: "Pending",
            leaveType,
            leaveDetails,
            attachment: file ? `/uploads/${file.filename}` : null,
            attachmentOriginalName: file ? file.originalname : null
        });

        // const allLeaves = await Leave.findById(userId).populate({
        //     path: 'userId',
        //     select: "name, sickLeave, unpaidLeave, paidLeave, availableLeaves"
        // });

        const userObjectId = new mongoose.Types.ObjectId(userId);

        // Fetch the user details
        const user = await User.findById(userObjectId).select("name sickLeave paidLeave unpaidLeave availableLeaves");
        if (!user) {
            throw new Error("User not found");
        }

        // Fetch leaves associated with the user
        const leaves = await Leave.find({ userId: userObjectId })
            .populate("userId", "name")
            .sort({ startDate: -1 });

        return res.status(StatusCodes.OK).json({
            status: "success", message: "Leave created successfully!",
            leaves: {
                user: {
                    name: user.name,
                    sickLeave: user.sickLeave,
                    paidLeave: user.paidLeave,
                    unpaidLeave: user.unpaidLeave,
                    availableLeaves: user.availableLeaves,
                },
                data: leaves
            }
        });

    } catch (error) {
        return res.status(StatusCodes.OK).json({ status: "fail", message: error.message });
    }
};


// const updateLeaveStatusController = async (req, res) => {
//     const { leaveId } = req.params;
//     const { status } = req.body;

//     if (!["Approved", "Rejected"].includes(status)) {
//         return res.status(StatusCodes.OK).json({
//             status: "fail",
//             message: "Invalid status. Must be 'Approved' or 'Rejected'"
//         });
//     }

//     try {
//         const updatedLeave = await updateLeaveStatus(leaveId, status);

//         // Populate additional user data if needed
//         const populatedLeave = await Leave.findById(updatedLeave._id)
//             .populate({
//                 path: 'userId',
//                 select: '-password',
//                 populate: {
//                     path: 'role',
//                     select: 'name permissions'
//                 }
//             });

//         res.status(StatusCodes.OK).json({
//             status: "success",
//             data: {
//                 leave: populatedLeave,
//                 user: populatedLeave.userId
//             }
//         });
//     } catch (error) {
//         res.status(StatusCodes.OK).json({
//             status: 'fail',
//             message: error.message
//         });
//     }
// };

const updateLeaveStatusController = async (req, res) => {
    const { leaveId } = req.params;
    const { status } = req.body;

    if (!["Approved", "Rejected"].includes(status)) {
        return res.status(StatusCodes.OK).json({
            status: "fail",
            message: "Invalid status. Must be 'Approved' or 'Rejected'"
        });
    }

    try {
        const updatedLeave = await updateLeaveStatus(leaveId, status);

        // Get current user's ID and role
        const currentUserId = req.user.id;
        const currentUserRole = req.user.role; // Assuming this is a string like "Founder"

        let leaves = [];

        if (currentUserRole === "Founder") {
            // Founder gets all leave records
            leaves = await Leave.find({})
                .populate({
                    path: 'userId',
                    select: 'name',
                    populate: {
                        path: 'role',
                        select: 'name'
                    }
                })
                .sort({ startDate: -1 });
        } else {
            // Fetch reportBy from User schema
            const currentUser = await User.findById(currentUserId).select("reportBy");

            if (Array.isArray(currentUser.reportBy) && currentUser.reportBy.length > 0) {
                leaves = await Leave.find({ userId: { $in: currentUser.reportBy } })
                    .populate({
                        path: 'userId',
                        select: 'name',
                        populate: {
                            path: 'role',
                            select: 'name'
                        }
                    })
                    .sort({ startDate: -1 });
            } else {
                leaves = []; // No access
            }
        }

        res.status(StatusCodes.OK).json({
            status: "success",
            message: "Leave status updated and leaves fetched based on role",
            leaves: leaves
        });
    } catch (error) {
        res.status(StatusCodes.OK).json({
            status: 'fail',
            message: error.message
        });
    }
};


const getAllLeavesController = async (req, res) => {
    try {
        const leaves = await Leave.find()
            .populate({
                path: "userId",
                select: "-password",
                populate: {
                    path: "role",
                    select: "name permissions"
                }
            })
            .sort({ createdAt: -1 });

        res.status(200).json({
            status: "success",
            count: leaves.length,
            data: leaves.map(leave => ({
                leave,
                user: leave.userId
            }))
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};


const getLeaveByIdController = async (req, res) => {
    const { leaveId } = req.params;

    try {
        // Additional validation
        if (!leaveId || !leaveId.trim()) {
            return res.status(StatusCodes.OK).json({
                status: 'fail',
                message: 'Leave ID is required'
            });
        }

        const trimmedId = leaveId.trim();

        if (trimmedId.length !== 24 || !/^[0-9a-fA-F]+$/.test(trimmedId)) {
            return res.status(StatusCodes.OK).json({
                status: 'fail',
                message: 'Leave ID must be 24 hexadecimal characters'
            });
        }

        const leave = await getLeaveById(trimmedId);

        return res.status(StatusCodes.OK).json({
            status: 'success',
            leaves: leave
        });

    } catch (error) {
        // const statusCode = error.message.includes('not found') ? 404 : 500;
        return res.status(StatusCodes.OK).json({
            status: 'fail',
            message: error.message
        });
    }
};

const getLeavesByUserIdController = async (req, res) => { // logged in user, single user ID
    const { userId } = req.params;

    try {
        // Validate the userId format
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(StatusCodes.OK).json({
                status: "fail",
                message: "Invalid user ID format - must be a 24-character hex string",
            });
        }

        // Fetch leaves and user details
        const { leaves, user } = await getLeavesByUserId(userId);

        if (!user) {
            return res.status(StatusCodes.OK).json({
                status: "fail",
                message: "User not found",
            });
        }

        if (leaves.length === 0) {
            return res.status(StatusCodes.OK).json({
                status: "success",
                message: "No leaves found for this user",
                leaves: {
                    user: {
                        name: user.name,
                        sickLeave: user.sickLeave,
                        paidLeave: user.paidLeave,
                        unpaidLeave: user.unpaidLeave,
                        availableLeaves: user.availableLeaves,
                    },
                    data: []
                }
            });
        }

        return res.status(StatusCodes.OK).json({
            status: "success",
            count: leaves.length,
            leaves: {
                user: {
                    name: user.name,
                    sickLeave: user.sickLeave,
                    paidLeave: user.paidLeave,
                    unpaidLeave: user.unpaidLeave,
                    availableLeaves: user.availableLeaves,
                },
                data: leaves
            }
        });
    } catch (error) {
        return res.status(StatusCodes.OK).json({
            status: "fail",
            message: error.message,
        });
    }
};


const getAllFilteredLeavesController = async (req, res) => {
    try {
        const { role, id } = req.user;

        let leaves = [];

        if (role === "Founder") {
            leaves = await Leave.find().populate("userId", "name role");
        } else {
            const user = await User.findById(id).select("reportBy");

            if (!user) {
                return res.status(StatusCodes.OK).json({
                    status: "fail",
                    message: "User not found"
                });
            }

            if (Array.isArray(user.reportBy) && user.reportBy.length > 0) {
                leaves = await Leave.find({ userId: { $in: user.reportBy } }).populate("userId", "name role");
            } else {
                // No users reporting to this user — return empty data
                return res.status(StatusCodes.OK).json({
                    status: "success",
                    count: 0,
                    leaves: [],
                    message: "No users reporting to you, so no leaves to fetch."
                });
            }
        }

        return res.status(StatusCodes.OK).json({
            status: "success",
            count: leaves.length,
            leaves: leaves,
            message: "Leaves fetched successfully"
        });

    } catch (error) {
        return res.status(StatusCodes.OK).json({
            status: "fail",
            message: error.message
        });
    }
};



const updateLeaveController = async (req, res) => {
    const { leaveId } = req.params;
    const file = req.file;
    let updateData = { ...req.body };
    const { userId } = req.body;

    try {
        // Handle date conversion and leaveDetails regeneration
        if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
        if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);

        if (updateData.startDate && updateData.endDate) {
            if (updateData.startDate > updateData.endDate) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Start date cannot be after end date'
                });
            }

            // Regenerate leaveDetails
            let leaveDetails = generateLeaveDetails(updateData.startDate, updateData.endDate, updateData.halfDayDates );

            // Apply half-day logic if provided
            if (updateData.halfDayDates && typeof updateData.halfDayDates === 'object') {
                Object.entries(updateData.halfDayDates).forEach(([date, session]) => {
                    if (leaveDetails[date]) {
                        leaveDetails[date] = session === "First Half" || session === "Second Half" ? session : "Full Day";
                    }
                });
            }

            updateData.leaveDetails = leaveDetails;
        }

        // Handle file update
        if (file) {
            updateData.attachment = `/uploads/${file.filename}`;
            updateData.attachmentOriginalName = file.originalname;
        }

        const updatedLeave = await Leave.findByIdAndUpdate(
            leaveId,
            { $set: updateData },
            { new: true, runValidators: true }
        )

        if (!updatedLeave) {
            return res.status(404).json({
                status: 'fail',
                message: 'Leave not found'
            });
        }

        const userObjectId = new mongoose.Types.ObjectId(userId);

        // Fetch the user details
        const user = await User.findById(userObjectId).select("name sickLeave paidLeave unpaidLeave availableLeaves");
        if (!user) {
            throw new Error("User not found");
        }

        // Fetch leaves associated with the user
        const leaves = await Leave.find({ userId: userObjectId })
            .populate("userId", "name")
            .sort({ startDate: -1 });

        return res.status(StatusCodes.OK).json({
            status: "success", message: "Leave created successfully!",
            leaves: {
                user: {
                    name: user.name,
                    sickLeave: user.sickLeave,
                    paidLeave: user.paidLeave,
                    unpaidLeave: user.unpaidLeave,
                    availableLeaves: user.availableLeaves,
                },
                data: leaves
            }
        });

    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};



module.exports = {
    createLeaveController,
    updateLeaveStatusController,
    getLeaveByIdController,
    getLeavesByUserIdController,
    getAllFilteredLeavesController,
    updateLeaveController
};