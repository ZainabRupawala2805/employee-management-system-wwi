const CustomError = require('../errors');
const jwt = require('jsonwebtoken');
const { StatusCodes } = require('http-status-codes');

const authenticateUser = async (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer")) {
        const token = authHeader.split(" ")[1];
        if (!token) {
            throw new CustomError.UnauthenticatedError('User is not authorized or token is missing in the request');
        } else {
            jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
                if (err) {
                    throw new CustomError.UnauthenticatedError('User is not authorized');
                }

                req.user = decoded;
                next();
            });
        }
    } else {
        return res.status(StatusCodes.OK).json({ status: "fail", message: "Auth Token is missing in the request" });
    }
};

module.exports = authenticateUser;