import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../Context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

const ORDER_STATUS = {
  OUT_FOR_DELIVERY: 'outForDelivery',
  DELIVERED: 'delivered',
};

const reverseGeocode = async (lat, lon) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18`,
      {
        headers: {
          'User-Agent': 'DeliveryApp/1.0 (contact: your-email@example.com)', 
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch address');
    }

    const data = await response.json();
    return data.display_name || `${lat}, ${lon}`; 
  } catch (err) {
    console.error('Error reverse geocoding:', err);
    return `${lat}, ${lon}`; 
  }
};

function DeliveryConfirm() {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const { order } = location.state || {}; 
  const [deliveryAddress, setDeliveryAddress] = useState(null); 


  const API_BASE_URL = 'http://localhost:30703';


  useEffect(() => {
    const fetchDeliveryAddress = async () => {
      if (order?.deliveryLocation?.latitude && order?.deliveryLocation?.longitude) {
        const address = await reverseGeocode(
          order.deliveryLocation.latitude,
          order.deliveryLocation.longitude
        );
        setDeliveryAddress(address);
      }
    };

    fetchDeliveryAddress();
  }, [order]);

  const completeDelivery = async () => {
    if (!order || !order.orderId) {
      alert('No order details available to update.');
      return;
    }

    try {
      // Fetch order data before updating status
      let customerEmail = order.customer?.email || order.customerEmail;
      console.log(`Initial customerEmail from order: ${customerEmail} for orderId: ${order.orderId}`);

      if (!customerEmail) {
        console.log(`No customerEmail in order object. Fetching from /showtheorder for orderId: ${order.orderId}`);
        const orderResponse = await fetch(`${API_BASE_URL}/driverRoutes/showtheorder`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          credentials: 'include',
        });

        if (!orderResponse.ok) {
          const responseText = await orderResponse.text();
          console.error(`Failed to fetch orders from showtheorder: Status ${orderResponse.status}, Response: ${responseText.substring(0, 100)}...`);
          throw new Error(`Failed to fetch order details: ${orderResponse.status}`);
        }

        const orders = await orderResponse.json();
        console.log('showtheorder response:', JSON.stringify(orders, null, 2));
        const targetOrder = orders.data.find(o => o.orderId === order.orderId);
        if (targetOrder) {
          customerEmail = targetOrder.customer?.email || targetOrder.customerEmail;
          console.log(`Extracted customer email: ${customerEmail} for orderId: ${order.orderId}`);
        } else {
          console.warn(`Order ${order.orderId} not found in showtheorder response`);
        }
      }

      // Update order status to "delivered"
      console.log(`Updating order status to delivered for orderId: ${order.orderId}`);
      const updateResponse = await fetch(`${API_BASE_URL}/driverRoutes/updateOrder/${order.orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        credentials: 'include',
        body: JSON.stringify({ orderStatus: ORDER_STATUS.DELIVERED }),
      });

      if (!updateResponse.ok) {
        let errorMessage = `Failed to update delivery status: ${updateResponse.status}`;
        try {
          const errorData = await updateResponse.json();
          errorMessage = errorData.message || errorMessage;
        } catch (jsonError) {
          const responseText = await updateResponse.text();
          console.error('Non-JSON response from updateOrder:', responseText);
          errorMessage = `Server returned status ${updateResponse.status}. Response: ${responseText.substring(0, 100)}...`;
        }
        throw new Error(errorMessage);
      }

      const updateData = await updateResponse.json();
      console.log(`Order ${order.orderId} marked as delivered:`, updateData);

      // Send email notification to the customer
      if (customerEmail) {
        const emailSubject = `Order Delivered - Order ID: ${order.orderId}`;
        const emailBody = `
          Dear ${order.customer?.name || 'Customer'},

          Your order has been successfully delivered!

          Order Details:
          - Order ID: ${order.orderId}
          - Order Date: ${order.orderDate ? new Date(order.orderDate).toLocaleString() : 'N/A'}
          - Restaurant: ${order.restaurant?.name || 'N/A'}
          - Delivery Address: ${deliveryAddress || 'N/A'}
          - Total Amount: Rs. ${order.totalAmount?.toFixed(2) || 'N/A'}
          - Items:
            ${order.items?.map((item, index) => `${index + 1}. ${item.quantity}x ${item.itemId} - Rs. ${(item.price * item.quantity).toFixed(2)}`).join('\n            ') || 'No items available'}

          Thank you for choosing our service!

          Best regards,
          Your Delivery App Team
        `;

        console.log(`Sending email to ${customerEmail} for orderId: ${order.orderId}`);
        const emailResponse = await fetch(`${API_BASE_URL}/driverRoutes/sendEmail`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          credentials: 'include',
          body: JSON.stringify({
            to: customerEmail,
            subject: emailSubject,
            text: emailBody,
          }),
        });

        if (!emailResponse.ok) {
          let emailErrorMessage = `Failed to send email: ${emailResponse.status}`;
          try {
            const errorData = await emailResponse.json();
            emailErrorMessage = errorData.message || emailErrorMessage;
          } catch (jsonError) {
            const responseText = await emailResponse.text();
            console.error('Non-JSON response from sendEmail:', responseText);
            emailErrorMessage = `Server returned status ${emailResponse.status}. Response: ${responseText.substring(0, 100)}...`;
          }
          console.error('Email error:', emailErrorMessage);
          alert(`Order marked as delivered, but failed to send email to ${customerEmail}: ${emailErrorMessage}`);
        } else {
          const emailData = await emailResponse.json();
          console.log(`Email sent successfully to ${customerEmail}:`, emailData.message);
        }
      } else {
        console.error(`No customer email found for order: ${order.orderId}. Cannot send notification.`);
        alert('Order marked as delivered, but no customer email found to send notification.');
      }

      alert('Order marked as delivered successfully!');
      navigate('/DeliveryPerson'); // Redirect to DeliveryPerson dashboard
    } catch (err) {
      console.error('Error in completeDelivery:', err);
      alert(`Failed to update delivery status: ${err.message}. Please try again.`);
    }
  };

  if (!user || user.role !== 'DeliveryPerson') {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p>You must be logged in as a delivery person to view this page.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Delivery Confirmation</h1>

      <div className="bg-white p-4 rounded shadow mb-4">
        <h2 className="text-lg font-semibold mb-2">Driver Details</h2>
        <p>
          <strong>Driver Name:</strong> {user?.name || 'N/A'}
        </p>
        <p>
          <strong>Driver Email:</strong> {user?.email || 'N/A'}
        </p>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Order Details</h2>
        {order ? (
          <>
            <p>
              <strong>Order ID:</strong> {order.orderId || 'N/A'}
            </p>
            <p>
              <strong>Order Date:</strong> {order.orderDate ? new Date(order.orderDate).toLocaleString() : 'N/A'}
            </p>
            <p>
              <strong>Customer Name:</strong> {order.customer?.name || 'N/A'}
            </p>
            <p>
              <strong>Customer Phone:</strong> {order.customer?.phone || 'N/A'}
            </p>
            <p>
              <strong>Restaurant Name:</strong> {order.restaurant?.name || 'N/A'}
            </p>
            <p>
              <strong>Delivery Address:</strong>{' '}
              {deliveryAddress ||
                (order.deliveryLocation
                  ? `Lat: ${order.deliveryLocation.latitude}, Long: ${order.deliveryLocation.longitude}`
                  : 'N/A')}
            </p>
            <p>
              <strong>Total Amount:</strong> Rs. {order.totalAmount?.toFixed(2) || 'N/A'}
            </p>
            <p>
              <strong>Order Items:</strong>
              <ul className="list-disc pl-5">
                {order.items?.map((item, index) => (
                  <li key={index}>
                    {item.quantity}x {item.itemId} - Rs. {(item.price * item.quantity).toFixed(2)}
                  </li>
                )) || <li>No items available</li>}
              </ul>
            </p>
            <p>
              <strong>Order Status:</strong>{' '}
              <span
                className={`ml-2 px-2 py-1 rounded text-xs ${
                  order.status === ORDER_STATUS.OUT_FOR_DELIVERY
                    ? 'bg-purple-100 text-purple-800'
                    : order.status === ORDER_STATUS.DELIVERED
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {order.status || 'N/A'}
              </span>
            </p>

            <div className="flex justify-end space-x-2 mt-4">
              {order.status === ORDER_STATUS.OUT_FOR_DELIVERY && (
                <>
                  <button
                    onClick={completeDelivery}
                    className="px-4 py-2 rounded bg-green-500 hover:bg-green-600 text-white"
                  >
                    Mark as Delivered
                  </button>
                  <button
                    onClick={() => navigate('/DeliveryPerson')}
                    className="px-4 py-2 rounded bg-gray-500 hover:bg-gray-600 text-white"
                  >
                    Back to Dashboard
                  </button>
                </>
              )}
              {order.status === ORDER_STATUS.DELIVERED && (
                <button
                  onClick={() => navigate('/DeliveryPerson')}
                  className="px-4 py-2 rounded bg-gray-500 hover:bg-gray-600 text-white"
                >
                  Back to Dashboard
                </button>
              )}
            </div>
          </>
        ) : (
          <p className="text-gray-500">No order details available. Please go back and select an order.</p>
        )}
      </div>
    </div>
  );
}

export default DeliveryConfirm;