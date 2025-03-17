const Role = require('../models/Roles');
const CustomError = require('../errors');

class RoleService {
    async addRole(roleData) {
        try {
            const newRole = new Role(roleData);
            return await newRole.save();
        } catch (error) {
            throw new CustomError.BadRequestError(error.message);
        }
    }

    async getAllRoles() {
        return await Role.find();
    }
}

module.exports = new RoleService();
