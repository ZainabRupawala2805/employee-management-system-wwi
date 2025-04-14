const mongoose = require('mongoose');
const User = require('../models/User');
const CustomError = require('../errors');

const fetchUsersByRole = async (userId, role) => {
    try {
        let users;

        if (role === "Founder") {
            // Validate userId before filtering out self
            if (!mongoose.isValidObjectId(userId)) {
                throw new CustomError.BadRequestError("Invalid User ID format");
            }

            users = await User.find({ _id: { $ne: userId } }) // Exclude the requesting Founder
                .select('-password')
                .populate("role", "name _id")
                .populate("reportBy", "name _id")
                .sort({ createdAt: -1 });

            return users;
        } else {
            if (!mongoose.isValidObjectId(userId)) {
                throw new CustomError.BadRequestError("Invalid User ID format");
            }

            const objectIdUserId = new mongoose.Types.ObjectId(userId);
            // console.log("objectIdUserId:", objectIdUserId);

            const loggedInUser = await User.findById(objectIdUserId).select("reportBy");

            if (!loggedInUser) {
                throw new CustomError.BadRequestError("User not found");
            }

            // console.log("loggedInUser:", loggedInUser);

            const reportingUserIds = loggedInUser.reportBy || [];
            // console.log("reportingUserIds", reportingUserIds);

            if (reportingUserIds.length === 0) {
                throw new Error("No Reporting Users Found");
            }

            users = await User.find({ _id: { $in: reportingUserIds } })
                .select('-password')
                .populate("role", "name _id")
                .populate("reportBy", "name _id")
                .sort({ createdAt: -1 });

            // console.log(users);

            if (!users.length) {
                throw new Error("No Users Found");
            }

            return users;
        }
    } catch (error) {
        console.error("Error in fetchUsersByRole:", error.message);

        return { error: true, message: error.message };
    }
};

module.exports = { fetchUsersByRole };
