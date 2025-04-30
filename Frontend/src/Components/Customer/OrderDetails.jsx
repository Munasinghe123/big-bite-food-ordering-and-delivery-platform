import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './OrderDetails.css';

function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    axios.get(`http://localhost:30500/orders/view/${id}` ,{withCredentials: true})
      .then(res => setOrder(res.data))
      .catch(err => console.error("Failed to load order:", err));
  }, [id]);

  const handleTrackOrder = () => {
    if (!order) return;

    const { orderId, _id, restaurantLocationLatitude, restaurantLocationLongitude, deliveryLocationLatitude, deliveryLocationLongitude } = order;

    // Validate coordinates
    const isValidCoordinate = (lat, lon) => !isNaN(lat) && lat >= -90 && lat <= 90 && !isNaN(lon) && lon >= -180 && lon <= 180;
    if (
      !isValidCoordinate(parseFloat(restaurantLocationLatitude), parseFloat(restaurantLocationLongitude)) ||
      !isValidCoordinate(parseFloat(deliveryLocationLatitude), parseFloat(deliveryLocationLongitude))
    ) {
      console.error('Invalid coordinates:', {
        restaurantLat: restaurantLocationLatitude,
        restaurantLon: restaurantLocationLongitude,
        deliveryLat: deliveryLocationLatitude,
        deliveryLon: deliveryLocationLongitude,
      });
      alert('Invalid restaurant or delivery coordinates. Unable to display tracking map.');
      return;
    }

    // Construct map3.html URL with query parameters
    const mapUrl = `/map3.html?orderId=${encodeURIComponent(orderId || _id)}&restaurantLat=${encodeURIComponent(
      restaurantLocationLatitude
    )}&restaurantLon=${encodeURIComponent(restaurantLocationLongitude)}&deliveryLat=${encodeURIComponent(
      deliveryLocationLatitude
    )}&deliveryLon=${encodeURIComponent(deliveryLocationLongitude)}`;

    console.log('Opening map3.html with URL:', mapUrl);

    // Open map3.html in a new tab
    window.open(mapUrl, '_blank');
  };


  if (!order) return <p>Loading order details...</p>;

  return (
    <div className="order-details-container">
      <h2>Order Details</h2>
      <p><strong>Order ID:</strong> {order.orderId}</p>
      <p><strong>Status:</strong> {order.orderStatus}</p>
      <p><strong>Payment Status:</strong> {order.paymentStatus}</p>
      <p><strong>Total:</strong> Rs. {order.totalAmount}</p>
      <h3>Items:</h3>
      <ul>
        {order.items.map((item, index) => (
          <li key={index}>
            {item.itemId} × {item.quantity} = Rs. {item.quantity * item.price}
          </li>
        ))}
      </ul>
      <p><strong>Delivery Address:</strong> {order.deliveryLocationLatitude}, {order.deliveryLocationLongitude}</p>
      <p><strong>Notes:</strong> {order.notes || 'N/A'}</p>
      <div className="order-actions">
        <button 
          className="track-button"
          onClick={handleTrackOrder}
        >
          Track Order
        </button>

        <button 


          className="cancel-button"
          onClick={() => navigate(`/cancel-order/${order.orderId}`)}
          
        >
          Cancel Order
        </button>

      </div>
    </div>
  );
}

export default OrderDetails;