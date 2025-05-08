const User = require('../models/User');
const Role = require('../models/Roles');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const CustomError = require('../errors');
const mongoose = require('mongoose');
const { fetchUsersByRole } = require("../utils/userUtils.js");
// const path = require('path');


const generatePassword = (name) => {
    if (!name || name.length < 3) {
        throw new Error('Name must be atleast three characters long.');
    }
    const firstThreeLetters = name.substring(0, 3);
    const password = `${firstThreeLetters}@12345`;
    return password;
}

const registerUser = async ({ name, email, contact, dateOfJoining, role, reportBy, sickLeave, paidLeave }) => {
    const existingUser = await User.findOne({ email });
    // console.log(name);
    if (existingUser) {
        throw new CustomError.BadRequestError(`User ${existingUser.name} is already registered`);
    }

    const password = generatePassword(name);
    console.log(password);

    const salt = await bcrypt.genSalt(10);
    const hashPswd = await bcrypt.hash(password, salt);

    // Find role
    let roleData = await Role.findOne({ name: role });

    // No need to convert reportBy, as it's already an array of IDs from UI
    let reportByIds = Array.isArray(reportBy) ? reportBy : [];

    const newUser = await User.create({
        name,
        email,
        contact,
        password: hashPswd,
        dateOfJoining,
        role: roleData ? roleData._id : null,  // Store role as roleId
        reportBy: reportByIds,
        sickLeave,
        paidLeave
    })
    console.log(newUser);

    // Validate the user data before saving
    // await newUser.validate();  // Ensure that validation runs
    // await newUser.save();  // Save to the database

    // return await User.find({ role: { $ne: "Admin" } }).select("-password");
    return await User.find()
        .select('-password')
        .populate("role", "name _id")
        .populate("reportBy", "name _id")
        .sort({ createdAt: -1 });
};

const loginUser = async (email, password) => {
    const userWithPswd = await User.findOne({ email });
    // console.log("user in service: ", userWithPswd)
    if (!userWithPswd) {
        throw new CustomError.NotFoundError(
            "Oops! The Entered Credentials Seems To Be Doesn't Exist In Our Database"
        );
    }

    if (userWithPswd.status !== "Active") {
        throw new CustomError.BadRequestError("You are no longer a user of Web Whiz Infosys!")
    }

    // console.log("Stored user password: ", user.password);
    // console.log("Entered password: ", password);
    // console.log("JWT_SECRET:", process.env.JWT_SECRET); // Check if it's properly set

    const isPswdMatch = await bcrypt.compare(password, userWithPswd.password);
    // console.log("Password Match Result:", isPswdMatch);

    if (!isPswdMatch) {
        throw new CustomError.UnauthenticatedError("User Password Incorrect");
    }

    // console.log("process.env.JWT_SECRET: ", process.env.JWT_SECRET);

    if (!process.env.JWT_SECRET) {
        throw new CustomError.NotFoundError("JWT_SECRET is not defined in environment variables");
    }
    // Now fetch user again with required fields but without the password
    const user = await User.findById(userWithPswd._id)
        .select('-password')  // Exclude password
        .populate("role", "name _id")  // Populate role with name and _id
        .populate("reportBy", "name _id");  // Populate reportBy with name and _id

    // Extract role name directly from populated data
    const roleName = user.role ? user.role.name : "Unknown";

    // Create JWT token including role name
    const token = await jwt.sign(
        { id: user.id, email: user.email, role: roleName },  // Added role name
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
    console.log('token in service: ', token);

    return {
        token,
        user
    }
}

const getAllUsers = async (userId, role) => {
    return await fetchUsersByRole(userId, role);
};


const getUserById = async (userId) => {
    const user = await User.findById(userId).select('-password');
    console.log(userId);

    if (!user) {
        throw new CustomError.NotFoundError(`No user with id: ${userId}`);
    }

    return user;
};

const updateUserService = async (userId, updateFields) => {
    const { name, email, contact, dateOfJoining, sickLeave, paidLeave, reportBy, role } = updateFields;

    try {
        // Ensure userId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new CustomError.BadRequestError("Invalid User ID format");
        }

        // Find role by name
        let roleData = await Role.findOne({ name: role });
        if (!roleData) {
            throw new CustomError.BadRequestError(`Role - ${role} not found`);
        }

        let newreportByIds = [];

        // Validate that reportBy contains only valid ObjectIds
        if (reportBy && Array.isArray(reportBy) && reportBy.length > 0) {
            if (!reportBy.every(id => mongoose.Types.ObjectId.isValid(id))) {
                throw new CustomError.BadRequestError("Invalid User ID in reportBy field");
            }
            newreportByIds = reportBy; // Assign validated array of IDs
        }

        // Update the user with new values
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                name,
                email,
                contact,
                dateOfJoining,
                sickLeave, 
                paidLeave, 
                reportBy: newreportByIds, // Directly store the array of IDs
                role: roleData._id
            },
            { new: true, runValidators: true }
        )

        if (!updatedUser) {
            throw new CustomError.NotFoundError("User not found or could not be updated");
        }

        const user = await User.find()
            .select('-password')  // Exclude password
            .populate("role", "name _id")  // Populate role with name and _id
            .populate("reportBy", "name _id")
            .sort({ createdAt: -1 });  // Populate reportBy with name and _id

        return user;
    } catch (error) {
        console.error("Error in updating user:", error);
        throw new CustomError.BadRequestError("Error updating user profile");
    }
};


const updatePassword = async (userId, oldPassword, newPassword) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new CustomError.NotFoundError(`No user with id: ${userId}`);
    }

    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
        throw new Error("User Old Password Doesn't Match");
    }

    const isNewPasswordSame = await bcrypt.compare(newPassword, user.password);
    if (isNewPasswordSame) {
        throw new Error("User New Password Should Not Be Same As Old One");
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return await User.find({ role: { $ne: "Admin" } }).select("-password");
};

const deleteUserService = async (userId) => {
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
        throw new CustomError.BadRequestError("User not found!")
    }
    const user = await User.find()
        .select('-password')  // Exclude password
        .populate("role", "name _id")  // Populate role with name and _id
        .populate("reportBy", "name _id")
        .sort({ createdAt: -1 });  // Populate reportBy with name and _id

    return user;
};


const updateUserStatus = async (userId, status, id, role) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new CustomError.BadRequestError("User not found");
    }
    user.status = status;
    await user.save();

    //return await User.find({ role: { $ne: "Admin" } }).select("-password");
    return fetchUsersByRole(id, role);
}


module.exports = {
    registerUser,
    loginUser,
    getAllUsers,
    getUserById,
    updateUserService,
    updatePassword,
    deleteUserService,
    updateUserStatus
}
