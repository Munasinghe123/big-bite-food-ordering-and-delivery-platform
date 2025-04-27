const express = require('express');
const router = express.Router();
const { generateReport } = require('../Controllers/reportController');
//const verifyToken = require('../../AuthService/Middleware/verifyToken');
//const verifyRole = require('../../AuthService/Middleware/verifyRole');

//router.get('/download-report', verifyToken, verifyRole("ResturantAdmin"), generateReport);

router.get('/download-report', generateReport);

module.exports = router;
