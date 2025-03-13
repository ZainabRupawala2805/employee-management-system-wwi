const express = require('express');
const router = express.Router();
const authenticateUser = require('../middlewares/authentication');
const RoleController = require('../controllers/roleController');

router.post('/add-role', RoleController.addRole);
router.get('/get-roles', RoleController.getAllRoles);

module.exports = router;