import React, { useEffect, useState } from 'react';
import './Dashboard.css';
import { BsFillArchiveFill, BsFillGrid3X3GapFill, BsPeopleFill } from 'react-icons/bs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import axios from 'axios';
import Sidebar from '../../Sidebar/Sidebar';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const url = "http://localhost:30504";
  const url2 = "http://localhost:30500";

  const [dashboardStats, setDashboardStats] = useState({
    restaurantCount: 0,
    menuCount: 0,
    orderCount: 0
  });
  const [popularMenuItems, setPopularMenuItems] = useState([]);
  const [orderTrends, setOrderTrends] = useState([]);
  const [orders, setOrders] = useState([]);

  const fetchAllOrders = async () => {
    try {
      const response = await axios.get(`${url2}/orders/view-all-orders`);

      if (Array.isArray(response.data)) {
        setOrders(response.data);
      } else {
        toast.error("Failed to fetch orders");
      }
    } catch (error) {
      toast.error("Error fetching orders");
    }
  };

  const statusHandler = async (event, orderId) => {
    const newStatus = event.target.value;

    try {
      const response = await axios.put(`${url2}/orders/${orderId}/status`, {
        orderStatus: newStatus
      });

      if (response.data.success) {
        await fetchAllOrders();
      }
    } catch (error) {
      console.error("Error")
    }
  }

  useEffect(() => {

    axios.get(`${url}/api/dashboard/stats`)
      .then(response => {
        setDashboardStats(response.data.data);
      })
      .catch(error => {
        console.error('Error fetching dashboard stats:', error);
      });


    axios.get(`${url}/api/dashboard/popular-menu-items`)
      .then(response => {
        setPopularMenuItems(response.data.data);
      })
      .catch(error => {
        console.error('Error fetching popular menu items:', error);
      });


    axios.get(`${url}/api/dashboard/order-trends`)
      .then(response => {
        setOrderTrends(response.data.data);
      })
      .catch(error => {
        console.error('Error fetching order trends:', error);
      });

    fetchAllOrders();
  }, []);

  const orderTrendsChartData = orderTrends.map(trend => ({
    name: trend._id,
    orderCount: trend.orderCount
  }));

  const popularMenuItemsChartData = popularMenuItems.map(item => ({
    name: item.itemName,
    orderCount: item.count
  }));

  return (
    <div className='layout1'>
      <div className='bar1'>
        <Sidebar />
      </div>

      <div className='main-container'>
        <div className='main-title'>
          <h3>Dashboard</h3>
        </div>

        <div className='main-cards'>
          <div className='card'>
            <div className='card-inner'>
              <h3>RESTAURANTS</h3>
              <BsFillArchiveFill className='card_icon' />
            </div>
            <h1>{dashboardStats.restaurantCount}</h1>
          </div>
          <div className='card'>
            <div className='card-inner'>
              <h3>MENU ITEMS</h3>
              <BsFillGrid3X3GapFill className='card_icon' />
            </div>
            <h1>{dashboardStats.menuCount}</h1>
          </div>
          <div className='card'>
            <div className='card-inner'>
              <h3>ORDERS</h3>
              <BsPeopleFill className='card_icon' />
            </div>
            <h1>{dashboardStats.orderCount}</h1>
          </div>
        </div>

        <div className='charts'>
          {/* Bar chart for Popular Menu Items */}
          <ResponsiveContainer width="100%" height={300}>
            <h3 className='pmenu-items'>Popular Menu Items</h3>
            <BarChart
              data={popularMenuItemsChartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="orderCount" fill="#c87a3f" />
            </BarChart>
          </ResponsiveContainer>

          {/* Line chart for Order Trends */}
          <ResponsiveContainer width="100%" height={300}>
            <h3 className='order-trends'>Order Trends</h3>
            <LineChart
              data={orderTrendsChartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="orderCount" stroke="#8884d8" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="list-table3">
          <h3 className="order-cap">Recent Orders</h3>
          <div className='table-format'>
            <div className="list-table3-format title">
              <b>Order ID</b>
              <b>Customer Name</b>
              <b>Menu Item x Quantity</b>
              <b>Total Amount</b>
              <b>Order Status</b>
              <b>Action</b>
            </div>
            {orders.map((order, index) => (
              <div key={index} className="list-table3-format">
                <p>{order.orderId}</p>
                <p>{order.customerName}</p>
                <p>
                  {order.items.map((item, itemIndex) => (
                    <span key={itemIndex}>
                      {item.itemId} x {item.quantity}
                      {itemIndex !== order.items.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </p>
                <p>Rs.{order.totalAmount}</p>
                <p>{order.orderStatus}</p>
                <select className="action-status" onChange={(event) => statusHandler(event, order.orderId)} value={order.orderStatus}>
                  <option value="" selected>Change Status</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="preparing">Preparing</option>
                  <option value="readyForPickup">Ready For Pickup</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

  );
}

export default Dashboard;
