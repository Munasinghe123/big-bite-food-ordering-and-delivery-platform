const Restaurant = require('../Models/ResturantModel');
const Menu = require('../Models/menuModel');
const Order = require('../Models/Order');

const getDashboardStats = async (req, res) => {
  try {
    const restaurantCount = await Restaurant.countDocuments({});
    const menuCount = await Menu.countDocuments({});
    const orderCount = await Order.countDocuments({});

    console.log("check 1");

    res.status(200).json({
      success: true,
      data: {
        restaurantCount,
        menuCount,
        orderCount,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error.message);
    res.status(500).json({ success: false, message: 'Error fetching dashboard data' });
  }
};

const getPopularMenuItems = async (req, res) => {
  try {
    // Aggregate orders to count the frequency of each menu item ordered
    const popularItems = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.itemId',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'menus',
          localField: '_id',
          foreignField: 'menuId',
          as: 'menuDetails'
        }
      },
      { $unwind: '$menuDetails' },
      {
        $project: {
          itemName: '$menuDetails.name',
          count: 1
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      data: popularItems,
    });
  } catch (error) {
    console.error('Error fetching popular menu items:', error.message);
    res.status(500).json({ success: false, message: 'Error fetching popular menu items' });
  }
};

const getOrderTrends = async (req, res) => {
  try {
    // Get orders grouped by day for the last 30 days using orderDate
    const orderTrends = await Order.aggregate([
      {
        $match: {
          orderDate: {
            $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$orderDate" }
          },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: orderTrends,
    });
  } catch (error) {
    console.error('Error fetching order trends:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order trends',
    });
  }
};



module.exports = { getDashboardStats, getPopularMenuItems, getOrderTrends };
