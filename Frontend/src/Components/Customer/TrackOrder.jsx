import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const TrackOrder = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const isValidCoordinate = (lat, lon) => {
    const validLat = !isNaN(lat) && lat >= -90 && lat <= 90;
    const validLon = !isNaN(lon) && lon >= -180 && lon <= 180;
    if (!validLat || !validLon) {
      console.error('Invalid coordinates:', { lat, lon });
    }
    return validLat && validLon;
  };

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError('No order ID provided.');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`http://localhost:30500/orders/view/${orderId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        console.log('Fetched order:', response.data);

        const orderData = response.data;
        // Validate coordinates
        const restaurantLat = parseFloat(orderData.restaurantLocationLatitude);
        const restaurantLon = parseFloat(orderData.restaurantLocationLongitude);
        const deliveryLat = parseFloat(orderData.deliveryLocationLatitude);
        const deliveryLon = parseFloat(orderData.deliveryLocationLongitude);

        if (
          !isValidCoordinate(restaurantLat, restaurantLon) ||
          !isValidCoordinate(deliveryLat, deliveryLon)
        ) {
          throw new Error('Invalid restaurant or delivery coordinates.');
        }

        setOrder(orderData);
        setLoading(false);
      } catch (err) {
        let errorMessage = 'Failed to fetch order details';
        if (err.code === 'ERR_NETWORK') {
          errorMessage = 'Network error: Please ensure the backend server is running';
        } else if (err.response) {
          errorMessage = `Failed to fetch order: ${err.response.status} ${err.response.statusText}`;
        }
        setError(errorMessage);
        setLoading(false);
        console.error('Error fetching order:', err);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-bold mb-4">Track Order #{orderId}</h2>
        <div className="text-gray-500">Loading order details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-bold mb-4">Track Order #{orderId}</h2>
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          {error}
        </div>
        <button
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          onClick={() => navigate('/DeliveryDetails')}
        >
          Back to Orders
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-bold mb-4">Track Order #{orderId}</h2>
        <div className="text-gray-500">No order details available. Please select an order.</div>
        <button
          className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          onClick={() => navigate('/DeliveryDetails')}
        >
          Back to Orders
        </button>
      </div>
    );
  }

  // Construct URL for map2.html with query parameters
  const mapUrl = `/map2.html?orderId=${encodeURIComponent(orderId)}&restaurantLat=${encodeURIComponent(
    order.restaurantLocationLatitude
  )}&restaurantLon=${encodeURIComponent(order.restaurantLocationLongitude)}&deliveryLat=${encodeURIComponent(
    order.deliveryLocationLatitude
  )}&deliveryLon=${encodeURIComponent(order.deliveryLocationLongitude)}`;

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Track Order #{orderId}</h2>
      <div className="bg-white p-4 rounded shadow mb-4">
        <h3 className="text-lg font-semibold mb-2">Order Details</h3>
        <p>
          <strong>Status:</strong>
          <span
            className={`ml-2 px-2 py-1 rounded text-xs ${
              order.orderStatus === 'driverAssigned'
                ? 'bg-yellow-100 text-yellow-800'
                : order.orderStatus === 'driverAccepted'
                ? 'bg-blue-100 text-blue-800'
                : order.orderStatus === 'outForDelivery'
                ? 'bg-purple-100 text-purple-800'
                : order.orderStatus === 'delivered'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {order.orderStatus || 'N/A'}
          </span>
        </p>
        <p><strong>Restaurant:</strong> {order.restaurantName || 'N/A'}</p>
        <p>
          <strong>Restaurant Location:</strong>
          {order.restaurantLocationLatitude && order.restaurantLocationLongitude
            ? `Lat: ${order.restaurantLocationLatitude}, Lon: ${order.restaurantLocationLongitude}`
            : 'N/A'}
        </p>
        <p>
          <strong>Your Location:</strong>
          {order.deliveryLocationLatitude && order.deliveryLocationLongitude
            ? `Lat: ${order.deliveryLocationLatitude}, Lon: ${order.deliveryLocationLongitude}`
            : 'N/A'}
        </p>
      </div>
      <iframe
        src={mapUrl}
        title="Order Tracking Map"
        className="w-full h-[500px] rounded shadow"
        frameBorder="0"
      ></iframe>
      <button
        className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        onClick={() => navigate('/DeliveryDetails')}
      >
        Back to Orders
      </button>
    </div>
  );
};

export default TrackOrder;