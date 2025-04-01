const mongoose = require('mongoose');
const User = require('../models/User');
const CustomError = require('../errors')

const fetchUsersByRole = async (userId, role) => {
    try {
        let users;

        if (role === "Founder") {
            users = await User.find()
                .select('-password')
                .populate("role", "name _id") // Get role name and ID
                .populate("reportBy", "name _id")
                .sort({ createdAt: -1 });
            
            return users;
        } else {
            // Validate userId before converting
            if (!mongoose.isValidObjectId(userId)) {
                throw new CustomError.BadRequestError("Invalid User ID format");
            }

            const objectIdUserId = new mongoose.Types.ObjectId(userId);
            console.log("objectIdUserId:", objectIdUserId);

            // Fetch the logged-in user and ensure `reportBy` is populated
            const loggedInUser = await User.findById(objectIdUserId).select("reportBy");

            if (!loggedInUser) {
                throw new CustomError.BadRequestError("User not found");
            }
            console.log("loggedInUser:", loggedInUser);

            // Extract the IDs from the reportBy field
            const reportingUserIds = loggedInUser.reportBy || [];
            console.log("reportingUserIds", reportingUserIds);

            if (reportingUserIds.length === 0) {
                throw new Error("No Reporting Users Found");
            }

            // Fetch users who are being reported by the logged-in user
            users = await User.find({ _id: { $in: reportingUserIds } })
                .select('-password')
                .populate("role", "name _id")
                .populate("reportBy", "name _id")
                .sort({ createdAt: -1 });

            console.log(users);

            if (!users.length) {
                throw new Error("No Users Found");
            }

            return users;

        }
    } catch (error) {
        console.error("Error in fetchUsersByRole:", error.message);

        // Return an empty array instead of throwing, to prevent app crashes
        return { error: true, message: error.message };
    }
};

module.exports = { fetchUsersByRole };
