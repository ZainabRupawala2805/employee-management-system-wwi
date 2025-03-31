const express = require('express');
const router = express.Router();
const authenticateUser = require('../middlewares/authentication');
const { register, login, getAllUsersList, fetchSingleUser, updateUser, updateUserPassword, deleteUser, updateStatus } = require ('../controllers/usersController');

router.post('/register', register);
router.post('/login', login);
router.get('/get-all-users', authenticateUser , getAllUsersList);
router.get('/profile/:id', authenticateUser, fetchSingleUser)
router.put('/update-profile/:userId', authenticateUser, updateUser)
router.put('/update-password/:userId', authenticateUser, updateUserPassword)
router.delete('/delete/:userId', authenticateUser, deleteUser)
router.put('/update-status', authenticateUser, updateStatus)

module.exports = router;