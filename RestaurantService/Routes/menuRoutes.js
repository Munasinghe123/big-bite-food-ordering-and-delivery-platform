const express = require('express');
const router = express.Router();
const { addFood, getAllFood, getFoodById, updateFood, deleteFood, searchFood } = require('../Controllers/menuController');
const upload = require('../Middleware/multerConfig');
//const verifyToken = require('../../AuthService/Middleware/verifyToken');
//const verifyRole = require('../../AuthService/Middleware/verifyRole');

// router.post('/add', verifyToken, verifyRole("RestaurantAdmin"), upload.single("image"), addFood);
// router.get('/list', verifyToken, verifyRole("RestaurantAdmin"), getAllFood);
// router.get('/list/:id', verifyToken, verifyRole("RestaurantAdmin"), getFoodById);
// router.get('/search', verifyToken, verifyRole("RestaurantAdmin"), searchFood);
// router.put('/update/:id', verifyToken, verifyRole("RestaurantAdmin"), upload.single('image'), updateFood);
// router.delete('/delete/:id', verifyToken, verifyRole("RestaurantAdmin"), deleteFood);

router.post('/add', upload.single("image"), addFood);
router.get('/list', getAllFood);
router.get('/list/:id', getFoodById);
router.get('/search', searchFood);
router.put('/update/:id', upload.single('image'), updateFood);
router.delete('/delete/:id', deleteFood);

module.exports = router;