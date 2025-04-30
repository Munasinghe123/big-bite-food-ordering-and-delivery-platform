import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../Context/AuthContext';
import { useNavigate } from 'react-router-dom';

const DeliveryPerson = () => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('http://localhost:30101/Addoder/showoder', {
          method: 'GET', 
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }
        const data = await response.json();
        setOrders(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching orders:', err.message);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const acceptOrder = async (orderId, orderDetails) => {
    try {
      const response = await fetch(`http://localhost:30101/Addoder/updateOrder/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        credentials: 'include',
        body: JSON.stringify({ deliveryStatus: 'Accepted' }),
      });

      if (!response.ok) {
        throw new Error('Failed to accept the order');
      }

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? { ...order, deliveryStatus: 'Accepted' } : order
        )
      );

      const mapURL = `https://www.google.com/maps/search/?api=1&query=${orderDetails.restaurantAddress.latitude},${orderDetails.restaurantAddress.longitude}`;
      window.open(mapURL, '_blank');
    } catch (err) {
      console.error('Error updating order status:', err.message);
      setError('Failed to accept the order. Please try again.');
    }
  };

  const pickupConfirm = async (orderId, orderDetails) => {
    try {
      const response = await fetch(`http://localhost:30101/Addoder/updateOrder/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        credentials: 'include',
        body: JSON.stringify({ deliveryStatus: "I'm on the way" }),
      });

      if (!response.ok) {
        throw new Error('Failed to update the order');
      }

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? { ...order, deliveryStatus: "I'm on the way" } : order
        )
      );

      const mapURL = `https://www.google.com/maps/search/?api=1&query=${orderDetails.customerAddress.latitude},${orderDetails.customerAddress.longitude}`;
      window.open(mapURL, '_blank');

      navigate('/deliveryconfirm', { state: { order: orderDetails } });
    } catch (err) {
      console.error('Error updating order status:', err.message);
      setError('Failed to update the order. Please try again.');
    }
  };

  return (
    <div>
      <h1>Delivery Person Dashboard</h1>
      <p>
        <strong>Name:</strong> {user?.name || 'N/A'}
      </p>
      <p>
        <strong>Email:</strong> {user?.email || 'N/A'}
      </p>

      {loading && <p>Loading orders...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {!loading && !error && (
        <div>
          <h2>Orders Assigned:</h2>
          {orders.length > 0 ? (
            <ul>
              {orders.map((order) => (
                <li key={order._id}>
                  <p>
                    <strong>Customer Name:</strong> {order.customerName || 'N/A'}
                  </p>
                  <p>
                    <strong>Pin Number:</strong> {order.pinNumber || 'N/A'}
                  </p>
                  <p>
                    <strong>Restaurant Address:</strong>{' '}
                    {order.restaurantAddress?.latitude}, {order.restaurantAddress?.longitude}
                  </p>
                  <p>
                    <strong>Customer Address:</strong>{' '}
                    {order.customerAddress?.latitude}, {order.customerAddress?.longitude}
                  </p>
                  <p>
                    <strong>Customer Mobile:</strong> {order.customerMobile || 'N/A'}
                  </p>
                  <p>
                    <strong>Order Value:</strong> {order.odervalue || 'N/A'}
                  </p>
                  <p>
                    <strong>Order Details:</strong> {order.orderDetails || 'N/A'}
                  </p>
                  <p>
                    <strong>Delivery Status:</strong> {order.deliveryStatus || 'N/A'}
                  </p>
                  
                  
                  <hr />
                </li>
              ))}
            </ul>
          ) : (
            <p>No orders available</p>
          )}
        </div>
      )}
    </div>
  );
};

export default DeliveryPerson;