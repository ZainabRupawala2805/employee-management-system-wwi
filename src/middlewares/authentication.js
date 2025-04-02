const CustomError = require('../errors');
const jwt = require('jsonwebtoken');
const { StatusCodes } = require('http-status-codes');
const User = require('../models/User')


const authenticateUser = async (req, res, next) => {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ status: "fail", message: "No token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).populate("role");

        if (!user) {
            return res.status(401).json({ status: "fail", message: "User not found" });
        }

        req.user = { userId: user._id, role: user.role.name, email: user.email };
        next();
    } catch (error) {
        res.status(401).json({ status: "fail", message: "Invalid or expired token" });
    }
};
module.exports = authenticateUser;

// authMiddleware.js

// const authenticate = async (req, res, next) => {
//     try {
//         const token = req.header('Authorization')?.replace('Bearer ', '');
        
//         if (!token) {
//             throw new Error('Authentication required');
//         }

//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         const user = await User.findById(decoded.userId)
//             .select('-password')
//             .populate('role', 'name');
        
//         if (!user) {
//             throw new Error('User not found');
//         }

//         req.user = {
//             userId: user._id,
//             role: user.role.name, // Assuming role has a 'name' field
//             // Add other needed properties
//         };

//         next();
//     } catch (error) {
//         res.status(401).json({
//             status: 'error',
//             message: error.message
//         });
//     }
// };

// module.exports = authenticate;