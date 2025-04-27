const express = require('express');
const router = express.Router();
const upload = require('../Middleware/multerConfig');
const verifyToken = require('../Middleware/verifyToken');
const verifyRole = require('../Middleware/verifyRole')

const{login,logout,checkToken,register,getAllUsers} = require('../Controller/UserController');

router.post('/login',login);
router.post('/logout',logout);
router.get('/checkToken',checkToken);
router.post('/register',upload,register);

router.get('/getallusers',verifyToken,verifyRole("SystemAdmin"),getAllUsers);



module.exports=router;