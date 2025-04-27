const express = require('express');
const router = express.Router();
const { getAllUsers } = require('../../Controllers/SystemAdmin/UserRelatedController');
const verifyToken = require('../../Middleware/verifyToken');
const verifyRole = require('../../Middleware/verifyRole');

router.get('/getAllUsers', verifyToken, verifyRole("SystemAdmin"), getAllUsers);

module.exports = router;