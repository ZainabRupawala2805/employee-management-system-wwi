const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');

const roleService = require('../services/roleService');

class RoleController {
    async addRole(req, res) {
        try {
            const { name } = req.body;
            if (!name) return res.status(StatusCodes.OK).json({ status: 'fail', message: "Role name is required" });

            const role = await roleService.addRole({ name });
            res.status(StatusCodes.OK).json({ status: 'success', message: "Role added successfully", role });
        } catch (error) {
            res.status(StatusCodes.OK).json({ status: 'fail', message: error.message });
        }
    }

    async getAllRoles(req, res) {
        try {
            const roles = await roleService.getAllRoles();
            res.status(StatusCodes.OK).json({  status: 'success', roles});
        } catch (error) {
            res.status(StatusCodes.OK).json({ status: 'fail', message: error.message });
        }
    }
}

module.exports = new RoleController();
