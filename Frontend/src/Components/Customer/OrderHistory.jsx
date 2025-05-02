import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './OrderHistory.css';

function OrderHistory() {
  const { username } = useParams();
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get(`http://localhost:30500/orders/view-history/${username}`);
        setOrders(res.data);
      } catch (err) {
        console.error('Error fetching order history:', err);
      }
    };

    const fetchMenuItems = async () => {
      try {
        const res = await axios.get('http://localhost:30504/api/menu/list', {
          withCredentials: true
        });
        if (res.data.success) {
          setMenuItems(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching menu items:', err);
      }
    };

    fetchOrders();
    fetchMenuItems();
  }, [username]);

  const getItemName = (id) => {
    return menuItems.find((item) => item.menuId === id)?.name || 'Unknown';
  };

  const handleDeleteOrder = async (orderId) => {
    const confirmed = window.confirm("Are you sure you want to remove this order from history?");
    if (!confirmed) return;

    try {
      await axios.delete(`http://localhost:30500/orders/delete/${orderId}`);
      setOrders((prev) => prev.filter((order) => order.orderId !== orderId));
      alert("Order removed successfully.");
    } catch (error) {
      console.error("Failed to delete order:", error);
      alert("Failed to delete order. Please try again.");
    }
  };

  const handleCancelOrder = async (orderId) => {
    const confirmed = window.confirm("Are you sure you want to cancel this order?");
    if (!confirmed) return;

    try {
      await axios.put(`http://localhost:30500/orders/update-order-status/${orderId}`, {
        orderStatus: 'cancelled'
      });
      setOrders((prev) =>
        prev.map((order) =>
          order.orderId === orderId ? { ...order, orderStatus: 'cancelled' } : order
        )
      );
      alert("Order cancelled successfully.");
    } catch (error) {
      console.error("Failed to cancel order:", error);
      alert("Failed to cancel order. Please try again.");
    }
  };

  const completedOrders = orders
  .filter(o => o.orderStatus === 'delivered' || o.orderStatus === 'cancelled')
  .sort((a, b) => {
    const numA = parseInt(a.orderId.split('-')[1], 10);
    const numB = parseInt(b.orderId.split('-')[1], 10);
    return numB - numA;
  });

const otherOrders = orders
  .filter(o => o.orderStatus !== 'delivered' && o.orderStatus !== 'cancelled')
  .sort((a, b) => {
    const numA = parseInt(a.orderId.split('-')[1], 10);
    const numB = parseInt(b.orderId.split('-')[1], 10);
    return numB - numA;
  });



  completedOrders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

  const renderOrder = (order) => (
    <div
      key={order.orderId}
      className={`order-card ${order.orderStatus === 'delivered' ? 'completed' : order.orderStatus === 'cancelled' ? 'cancelled' : ''}`}
    >
      <h3>Order ID: {order.orderId}</h3>
      <p><strong>Order Date:</strong> {new Date(order.orderDate).toLocaleString()}</p>
      <p><strong>Status:</strong> <span className={`order-status ${order.orderStatus}`}>{order.orderStatus}</span></p>

      <h4>Customer Info</h4>
      <p>{order.customerName} ({order.customerUsername})</p>
      <p>{order.customerPhone} | {order.customerEmail}</p>

      <h4>Delivery Location</h4>
      <p>{order.deliveryLocationLatitude}, {order.deliveryLocationLongitude}</p>

      <h4>Restaurant</h4>
      <p>{order.restaurantName} ({order.restaurantPhone})</p>

      <h4>Items</h4>
      <ul>
        {order.items.map((item, index) => (
          <li key={index}>{getItemName(item.itemId)} - {item.quantity} × Rs.{item.price}</li>
        ))}
      </ul>

      <h4>Pricing</h4>
      <p>Subtotal: Rs.{order.subtotal}</p>
      <p>Delivery Charge: Rs.{order.deliveryCharge}</p>
      <p><strong>Total Amount:</strong> Rs.{order.totalAmount}</p>

      <h4>Payment</h4>
      <p>Method: {order.paymentMethod}</p>
      <p>Status: {order.paymentStatus}</p>

      {order.notes && (
        <>
          <h4>Notes</h4>
          <p>{order.notes}</p>
        </>
      )}


      {(order.orderStatus === 'delivered' || order.orderStatus === 'cancelled') && (
        <button
          className="remove-btn"
          onClick={() => handleDeleteOrder(order.orderId)}
          style={{
            marginTop: '1rem',
            backgroundColor: '#ff4d4d',
            color: 'white',
            padding: '0.5rem 1rem',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Remove From History
        </button>
      )}

      {(order.orderStatus !== 'delivered' && order.orderStatus !== 'cancelled') && (
        <button
          className="cancel-btn"
          onClick={() => handleCancelOrder(order.orderId)}
          style={{
            marginTop: '1rem',
            backgroundColor: '#ff9800',
            color: 'white',
            padding: '0.5rem 1rem',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Cancel Order
        </button>
      )}
    </div>
  );

  return (
    <div className="order-history-page">
      <h2 className="history-heading">Order History for {username}</h2>

      {otherOrders.length > 0 && (
        <div>
          <h3>Active Orders</h3>
          <div className="order-history-list">
            {otherOrders.map(renderOrder)}
          </div>
        </div>
      )}

      {completedOrders.length > 0 && (
        <div>
          <h3>Completed Orders</h3>
          <div className="order-history-list">
            {completedOrders.map(renderOrder)}
          </div>
        </div>
      )}

      {orders.length === 0 && <p>No orders found for this user.</p>}
    </div>
  );
}

export default OrderHistory;