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
  
        // Generate leaveDetails object
        let leaveDetails = generateLeaveDetails(start, end);
  
        // Handle half-day leaves if specified
        if (halfDayDates && typeof halfDayDates === 'object') {
            Object.entries(halfDayDates).forEach(([date, session]) => {
                if (leaveDetails[date]) {
                    leaveDetails[date] = session === "First Half" || session === "Second Half" ? session : "Full Day";
                }
            });
        }
  
        const leave = await Leave.create({
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
  
        return res.status(201).json({ status: "success", data: leave });
  
    } catch (error) {
        return res.status(500).json({ status: "error", message: error.message });
    }
  };

  const updateLeaveStatusController = async (req, res) => {
    const { leaveId } = req.params;
    const { status } = req.body;

    if (!["Approved", "Rejected"].includes(status)) {
        return res.status(400).json({ 
            status: "fail", 
            message: "Invalid status. Must be 'Approved' or 'Rejected'" 
        });
    }

    try {
        const updatedLeave = await updateLeaveStatus(leaveId, status);
        
        // Populate additional user data if needed
        const populatedLeave = await Leave.findById(updatedLeave._id)
            .populate({
                path: 'userId',
                select: '-password',
                populate: {
                    path: 'role',
                    select: 'name permissions'
                }
            });

        res.status(200).json({ 
            status: "success",
            data: {
                leave: populatedLeave,
                user: populatedLeave.userId
            }
        });
    } catch (error) {
        res.status(400).json({ 
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
            return res.status(400).json({
                status: 'fail',
                message: 'Leave ID is required'
            });
        }

        const trimmedId = leaveId.trim();
        
        if (trimmedId.length !== 24 || !/^[0-9a-fA-F]+$/.test(trimmedId)) {
            return res.status(400).json({
                status: 'fail',
                message: 'Leave ID must be 24 hexadecimal characters'
            });
        }

        const leave = await getLeaveById(trimmedId);

        return res.status(200).json({
            status: 'success',
            data: leave
        });

    } catch (error) {
        const statusCode = error.message.includes('not found') ? 404 : 500;
        return res.status(statusCode).json({
            status: 'error',
            message: error.message
        });
    }
};

const getLeavesByUserIdController = async (req, res) => {
  const { userId } = req.params;

  try {
      // Validate the userId format
      if (!mongoose.Types.ObjectId.isValid(userId)) {
          return res.status(StatusCodes.BAD_REQUEST).json({
              status: "fail",
              message: "Invalid user ID format - must be a 24-character hex string",
          });
      }

      // Fetch leaves and user details
      const { leaves, user } = await getLeavesByUserId(userId);

      if (!user) {
          return res.status(StatusCodes.NOT_FOUND).json({
              status: "fail",
              message: "User not found",
          });
      }

      if (leaves.length === 0) {
          return res.status(StatusCodes.OK).json({
              status: "success",
              message: "No leaves found for this user",
              user: {
                  name: user.name,
                  email: user.email,
                  sickLeave: user.sickLeave,
                  paidLeave: user.paidLeave,
                  availableLeaves: user.availableLeaves,
              },
              data: [],
          });
      }

      return res.status(StatusCodes.OK).json({
          status: "success",
          count: leaves.length,
          user: {
              name: user.name,
              email: user.email,
              sickLeave: user.sickLeave,
              paidLeave: user.paidLeave,
              availableLeaves: user.availableLeaves,
          },
          data: leaves,
      });
  } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          status: "error",
          message: error.message,
      });
  }
};


const getAllFilteredLeavesController = async (req, res) => {
  try {
      const { role, id } = req.user; // Extract user role and ID from token

      let leaves;

      if (role === "Founder") {
          leaves = await Leave.find().populate("userId", "name email role");
      } else {
          const user = await User.findById(id).select("reportBy");

          if (!user) {
              return res.status(404).json({ status: "fail", message: "User not found" });
          }

          let userIdsToFetch = user.reportBy.length > 0 ? user.reportBy : [id];
          leaves = await Leave.find({ userId: { $in: userIdsToFetch } }).populate("userId", "name email role");
      }

      return res.status(200).json({ status: "success", count: leaves.length, data: leaves });

  } catch (error) {
      return res.status(500).json({ status: "error", message: error.message });
  }
};


const updateLeaveController = async (req, res) => {
    const { leaveId } = req.params;
    const updateData = req.body;
    const file = req.file;

    try {
        const updatedLeave = await Leave.findByIdAndUpdate(
            leaveId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).populate({
            path: 'userId',
            select: '-password',
            populate: {
                path: 'role',
                select: 'name permissions'
            }
        });

        if (!updatedLeave) {
            return res.status(404).json({
                status: 'fail',
                message: 'Leave not found'
            });
        }

        return res.status(200).json({
            status: 'success',
            data: {
                leave: updatedLeave,
                user: updatedLeave.userId
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
    getAllLeavesController, 
    getLeaveByIdController,
    getLeavesByUserIdController,
    getAllFilteredLeavesController,
    updateLeaveController
};