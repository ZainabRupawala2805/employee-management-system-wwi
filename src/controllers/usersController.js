const { registerUser, loginUser, getAllUsers, getUserById, updateUserService, updatePassword, deleteUserService, updateUserStatus } = require('../services/usersService');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');


const register = async (req, res) => {
    try {
        const { name, email, contact, dateOfJoining, role, reportBy, sickLeave, paidLeave } = req.body;

        if (!name || !email || !contact || !dateOfJoining || !role || !sickLeave || !paidLeave) {
            throw new CustomError.BadRequestError("All Fields Are Mandatory");
        }

        // Ensure reportBy is an array
        if (reportBy && !Array.isArray(reportBy)) {
            throw new CustomError.BadRequestError("reportBy must be an array of names");
        }

        const user = await registerUser({ name, email, contact, dateOfJoining, role, reportBy, sickLeave, paidLeave });
        console.log("user from control file: ", user);

        res.status(StatusCodes.CREATED).json({
            status: "success",
            message: "User Registered Successfully",
            user
        });

    } catch (error) {
        console.error('Error during registration:', error.message);
        res.status(StatusCodes.OK).json({ status: 'fail', message: error.message });
    }
};


const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            throw new CustomError.BadRequestError("Mobile no. or Password should not be empty");
        }

        const { token, user } = await loginUser(email, password);
        console.log("User", user);
        console.log("Token", token);

        if (!user || !token) {
            return res.status(StatusCodes.OK).json({ status: 'fail', message: 'No user found or token found!' });
        } else {
            res.status(StatusCodes.OK).json({
                status: 'success',
                message: 'User Logged In successfully',
                user,
                token
            });
        }

    } catch (err) {
        console.error('Error during login', err.message);
        res.status(StatusCodes.OK).json({
            status: "fail",
            message: err.message,
        });
    }
};

const getAllUsersList = async (req, res) => {
    try {
        if (!req.user) {
            throw new CustomError.BadRequestError("User authentication failed. No user data found.");
        }
        console.log(req.user);

        const { id, role } = req.user;
        console.log("Logged-in User:", { id, role });

        const users = await getAllUsers(id, role);
        res.status(StatusCodes.OK).json({ status: "success", user: users, message: "All Users Fetched Successfully" });
    } catch (error) {
        res.status(StatusCodes.OK).json({ status: "fail", message: error.message });
    }
};

const fetchSingleUser = async (req, res) => {
    try {
        if (!req.params.id) {
            throw new CustomError.BadRequestError("User ID is required");
        }
        const user = await getUserById(req.params.id);
        res.status(StatusCodes.OK).json({ status: "success", message: "User Data Fetched Successfully", user });
    } catch (error) {
        res.status(StatusCodes.OK).json({ status: "fail", message: error.message });
    }
}

const updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        // Ensure userId exists
        if (!userId) {
            return res.status(StatusCodes.OK).json({
                status: "fail",
                message: "User ID is required",
            });
        }

        // Extract fields to update
        const { name, email, contact, dateOfJoining, sickLeave, paidLeave, reportBy, role } = req.body;

        if (!name || !contact || !email || !dateOfJoining || !role) {
            return res.status(StatusCodes.OK).json({
                status: "fail",
                message: "All fields are mandatory",
            });
        }

        if (reportBy && !Array.isArray(reportBy)) {
            throw new CustomError.BadRequestError("reportBy must be an array of names.")
        }

        // Call the service function to update user
        const updatedUser = await updateUserService(userId, { name, email, contact, dateOfJoining, sickLeave, paidLeave, reportBy, role });

        if (!updatedUser) {
            return res.status(StatusCodes.OK).json({
                status: "fail",
                message: "User not found or update failed",
            });
        }

        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "User profile updated successfully",
            user: updatedUser,
        });

    } catch (error) {
        res.status(StatusCodes.OK).json({
            status: "fail",
            message: error.message,
        });
    }
};

const updateUserPassword = async (req, res) => {
    try {
        if (req.params.userId !== req.user.id) {
            return res.status(StatusCodes.OK).json({
                status: "fail",
                message: `No user with id: ${req.user.id}`
            });
        }
        const { oldPassword, newPassword } = req.body;
        const { userId } = req.params;

        if (!userId) {
            throw new CustomError.BadRequestError("User ID not Found")
        }

        if (!oldPassword || !newPassword) {
            return res.status(StatusCodes.OK).json({ status: "fail", message: "All Fields Are Mandatory" });
        }

        const user = await updatePassword(userId, oldPassword, newPassword);
        res.status(StatusCodes.OK).json({ user, status: "success", message: "User Password Updated Successfully" });

    } catch (error) {
        res.status(StatusCodes.OK).json({ status: "fail", message: error.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            throw new CustomError.BadRequestError("User ID not Found")
        }

        const user = await deleteUserService(userId);
        res.status(StatusCodes.OK).json({ user, status: "success", message: "User Deleted Successfully!" });

    } catch (error) {
        res.status(StatusCodes.OK).json({ status: "fail", message: error.message });
    }
};

const updateStatus = async (req, res) => {
    try {
        const { userId, status } = req.body;
        if (!userId || !status) {
            throw new CustomError.BadRequestError("User ID or Status not Found")
        }

        const updatedUser = await updateUserStatus(userId, status);

        if (!updatedUser) {
            throw new CustomError.BadRequestError("User not Found")
        }

        return res.status(StatusCodes.OK).json({ status: "success", message: "User status updated successfully", user: updatedUser });
    } catch (error) {
        console.error("Error updating status:", error);
        return res.status(StatusCodes.OK).json({ status: "fail", message: "Internal server error" });
    }
};


module.exports = {
    register,
    login,
    getAllUsersList,
    fetchSingleUser,
    updateUser,
    updateUserPassword,
    deleteUser,
    updateStatus
}