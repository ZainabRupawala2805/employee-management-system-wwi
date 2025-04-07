const Leave = require("../models/Leave");
const User = require("../models/User");
const CustomError = require('../errors');
const { StatusCodes } = require('http-status-codes');
const mongoose = require("mongoose");

// const createLeave = async (leaveData) => {
//     try {
//         const { userId, startDate, endDate, reason, leaveType } = leaveData;

//         // Fetch the user to check available leaves
//         const user = await User.findById(userId);

//         if (!user) {
//             throw new Error("User not found");
//         }

        
//         const timeDiff = new Date(endDate) - new Date(startDate);
//         const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;

//         // Check if the user has enough leaves based on leaveType
//         if (leaveType === "Sick") {
//             if (user.sickLeave < daysDiff) {
//                 throw new Error("Not enough sick leaves available");
//             }
//         } else if (leaveType === "Paid") {
//             if (user.paidLeave < daysDiff) {
//                 throw new Error("Not enough paid leaves available");
//             }
//         } else {
//             throw new Error("Invalid leave type");
//         }

//         // Create the leave
//         const leave = new Leave(leaveData);
//         await leave.save();

//         return leave;
//     } catch (error) {
//         throw new Error(error.message);
//     }
// };

const generateLeaveDetails = (startDate, endDate) => {
    let details = {};
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        const formattedDate = currentDate.toISOString().split("T")[0]; // YYYY-MM-DD format
        details[formattedDate] = "Full Day"; // Default to Full Day
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return details;
};




const updateLeaveStatus = async (leaveId, status) => {
    try {
        // Find leave and populate user, excluding password
        const leave = await Leave.findById(leaveId)
            .populate({
                path: "userId",
                select: "-password" // Explicitly exclude password
            });

        if (!leave) {
            throw new Error("Leave not found");
        }

        // Fetch the user to update leave balances (still exclude password)
        const user = await User.findById(leave.userId._id)
            .select("-password");

        if (!user) {
            throw new Error("User not found");
        }

        // Ensure numeric fields are valid numbers
        user.availableLeaves = Number(user.availableLeaves) || 0;
        user.paidLeave = Number(user.paidLeave) || 0;
        user.sickLeave = Number(user.sickLeave) || 0;
        user.totalLeaves = Number(user.totalLeaves) || 0;

        // Calculate the total leave days
        let totalDays = 0;

        Object.values(leave.leaveDetails).forEach(dayType => {
            if (dayType === "Full Day") {
                totalDays += 1;
            } else if (dayType === "First Half" || dayType === "Second Half") {
                totalDays += 0.5;
            }
        });

        // Check if the leave is being approved
        if (status === "Approved") {
            switch (leave.leaveType) {
                case "Paid":
                    if (user.paidLeave < totalDays) {
                        throw new Error("Not enough paid leaves available");
                    }
                    if (user.availableLeaves < totalDays) {
                        throw new Error("Not enough available leaves");
                    }
                    user.paidLeave -= totalDays;
                    user.availableLeaves -= totalDays;
                    break;

                case "Sick":
                    if (user.sickLeave < totalDays) {
                        throw new Error("Not enough sick leaves available");
                    }
                    if (user.availableLeaves < totalDays) {
                        throw new Error("Not enough available leaves");
                    }
                    user.sickLeave -= totalDays;
                    user.availableLeaves -= totalDays;
                    break;

                case "Unpaid":
                    // No deductions for unpaid leaves
                    break;

                default:
                    throw new Error("Invalid leave type");
            }

            user.totalLeaves += totalDays;
            await user.save();
        }

        // Update the leave status
        leave.status = status;
        await leave.save();

        // Convert to plain object and remove password if it exists
        const result = leave.toObject();
        if (result.userId && result.userId.password) {
            delete result.userId.password;
        }

        return result;
    } catch (error) {
        throw new Error(error.message);
    }
};


// const getAllLeaves = async () => {
//     try {
//         const leaves = await Leave.find()
//             .populate({
//                 path: "userId",
//                 select: "name role", 
//                 populate: {
//                     path: "role", 
//                     select: "name", 
//                 },
//             })
//             .exec();

//         return leaves;
//     } catch (error) {
//         throw new Error(error.message);
//     }
// };


const getLeaveById = async (leaveId) => {
    try {
        // Trim and validate the ID
        const trimmedId = String(leaveId).trim();
        
        if (!mongoose.Types.ObjectId.isValid(trimmedId)) {
            throw new Error('Invalid leave ID format');
        }

        const leaveObjectId = new mongoose.Types.ObjectId(trimmedId);
        
        const leave = await Leave.findById(leaveObjectId)
            .populate({
                path: 'userId',
                select: 'name email role',
                populate: {
                    path: 'role',
                    select: 'name'
                }
            });

        if (!leave) {
            throw new Error('Leave not found');
        }

        return leave;
    } catch (error) {
        console.error(`Error fetching leave ${leaveId}:`, error);
        throw error;
    }
};
const getLeavesByUserId = async (userId) => {
    try {
        // Validate the user ID format
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new Error("Invalid user ID format");
        }

        const userObjectId = new mongoose.Types.ObjectId(userId);

        // Fetch the user details
        const user = await User.findById(userObjectId).select("name email sickLeave paidLeave availableLeaves");
        if (!user) {
            throw new Error("User not found");
        }

        // Fetch leaves associated with the user
        const leaves = await Leave.find({ userId: userObjectId })
            .populate({
                path: "userId",
                select: "name email role",
                populate: {
                    path: "role",
                    select: "name",
                },
            })
            .sort({ startDate: -1 });

        return { leaves, user };
    } catch (error) {
        throw error;
    }
};



const getFilteredLeaves = async (userId, userRole, reportBy) => {
    try {
        let query = {};

        if (userRole === "Founder") {
            // Founder gets all leave records
            query = {};
        } else if (reportBy.length > 0) {
            // If the user has a reportBy list, fetch leaves of those users
            query = { userId: { $in: reportBy } };
        } else {
            // If no reportBy users, fetch only the current user's leaves
            query = { userId };
        }

        const leaves = await Leave.find(query)
            .populate({
                path: "userId",
                select: "name role",
                populate: { path: "role", select: "name" },
            })
            .sort({ startDate: -1 });

        return leaves;
    } catch (error) {
        throw new Error(error.message);
    }
};

const updateLeave = async (leaveId, updateData, file) => {
    try {
        // Validate leave ID
        if (!mongoose.Types.ObjectId.isValid(leaveId)) {
            throw new Error('Invalid leave ID format');
        }

        // Check if leave exists
        const existingLeave = await Leave.findById(leaveId);
        if (!existingLeave) {
            throw new Error('Leave not found');
        }

        // Handle file attachment if provided
        if (file) {
            // Here you would typically:
            // 1. Delete the old file if it exists
            // 2. Upload the new file
            updateData.attachment = `/uploads/${file.filename}`;
            updateData.attachmentOriginalName = file.originalname;
        }

        // Prevent status updates through this endpoint
        if (updateData.status && updateData.status !== existingLeave.status) {
            throw new Error('Use the updateLeaveStatus endpoint to change leave status');
        }

        // Calculate days if dates are being updated
        if (updateData.startDate || updateData.endDate) {
            const startDate = updateData.startDate || existingLeave.startDate;
            const endDate = updateData.endDate || existingLeave.endDate;
            
            if (new Date(startDate) > new Date(endDate)) {
                throw new Error('Start date cannot be after end date');
            }

            // Regenerate leaveDetails if dates change
            if (updateData.startDate || updateData.endDate) {
                updateData.leaveDetails = generateLeaveDetails(
                    new Date(startDate),
                    new Date(endDate)
                );
            }
        }

        // Update the leave
        const updatedLeave = await Leave.findByIdAndUpdate(
            leaveId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).populate('userId', 'name email role availableLeaves sickLeave paidLeave unpaidLeave');

        return updatedLeave;
    } catch (error) {
        throw error;
    }
};


module.exports = {
    updateLeaveStatus,
    getLeaveById,
    getLeavesByUserId,
    getFilteredLeaves,
    generateLeaveDetails,
    updateLeave
};