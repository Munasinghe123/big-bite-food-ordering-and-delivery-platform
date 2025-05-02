import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../Context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';


const ORDER_STATUS = {
  DRIVER_ACCEPTED: 'driverAccepted',
  OUT_FOR_DELIVERY: 'outForDelivery',
};


const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


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


const isValidCoordinate = (lat, lon) => {
  const validLat = !isNaN(lat) && lat >= -90 && lat <= 90;
  const validLon = !isNaN(lon) && lon >= -180 && lon <= 180;
  if (!validLat || !validLon) {
    console.error('Invalid coordinates:', { lat, lon });
  }
  return validLat && validLon;
};


const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const OrderDetails = () => {
  const { user } = useContext(AuthContext);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addresses, setAddresses] = useState({ restaurant: null, delivery: null }); 
  const navigate = useNavigate();
  const location = useLocation();

 
  const SWAP_COORDINATES = false; 


  const API_BASE_URL = 'http://localhost:30703';


  useEffect(() => {
    const fetchAddresses = async (order) => {
      const newAddresses = { restaurant: null, delivery: null };


      let restaurantLat = order.restaurant?.location?.latitude;
      let restaurantLon = order.restaurant?.location?.longitude;
      if (SWAP_COORDINATES) {
        [restaurantLat, restaurantLon] = [restaurantLon, restaurantLat];
      }
      if (restaurantLat && restaurantLon) {
        const restaurantAddress = await reverseGeocode(restaurantLat, restaurantLon);
        newAddresses.restaurant = restaurantAddress;
      }

      await delay(1000);


      let deliveryLat = order.deliveryLocation?.latitude;
      let deliveryLon = order.deliveryLocation?.longitude;
      if (SWAP_COORDINATES) {
        [deliveryLat, deliveryLon] = [deliveryLon, deliveryLat];
      }
      if (deliveryLat && deliveryLon) {
        const deliveryAddress = await reverseGeocode(deliveryLat, deliveryLon);
        newAddresses.delivery = deliveryAddress;
      }

      setAddresses(newAddresses);
    };

    if (location.state && location.state.order) {
      console.log('Order from location.state:', location.state.order);
      // Normalize the status field (prioritize orderStatus if present)
      const passedOrder = location.state.order;
      const normalizedOrder = {
        ...passedOrder,
        status: passedOrder.orderStatus || passedOrder.status,
      };
      setOrder(normalizedOrder);
      fetchAddresses(normalizedOrder);
      setLoading(false);
    } else {
      // If no order is passed, fetch it
      const fetchOrder = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/driverRoutes/showtheorder`, {
            method: 'GET',
            credentials: 'include',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          });

          if (!response.ok) {
            throw new Error(`Error fetching orders: ${response.status}`);
          }

          const { data } = await response.json();
          console.log('Fetched orders:', data);
          const orderId = location.state?.order?.orderId;
          const foundOrder = data.find((o) => o.orderId === orderId);
          if (foundOrder) {
            setOrder(foundOrder);
            await fetchAddresses(foundOrder);
          } else {
            throw new Error('Order not found');
          }
        } catch (err) {
          console.error('Error fetching order:', err.message);
          setError('Failed to fetch order details. Please try again later.');
        } finally {
          setLoading(false);
        }
      };

      if (user && user.role === 'DeliveryPerson') {
        fetchOrder();
      }
    }
  }, [location.state, user]);

  const pickupConfirm = async () => {
    if (!order || !order.orderId) {
      setError('No order or order ID found.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Log order ID for debugging
      console.log('Attempting to update order with ID:', order.orderId);

      // Update order status to 'outForDelivery'
      const response = await fetch(
        `${API_BASE_URL}/driverRoutes/updateOrder/${order.orderId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          credentials: 'include',
          body: JSON.stringify({ orderStatus: ORDER_STATUS.OUT_FOR_DELIVERY }),
        }
      );

      if (!response.ok) {
        let errorMessage = `Failed to update the order: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (jsonError) {
          // Log the response text for debugging
          const responseText = await response.text();
          console.error('Non-JSON response:', responseText);
          errorMessage = `Server returned status ${response.status}. Response: ${responseText.substring(0, 100)}...`;
        }
        throw new Error(errorMessage);
      }

      const updatedOrderResponse = await response.json();
      const updatedOrder = updatedOrderResponse.order;

      // Update local state
      setOrder({ ...order, status: updatedOrder.orderStatus });

      // Get and validate restaurant coordinates
      let restaurantLat = parseFloat(order.restaurant?.location?.latitude);
      let restaurantLon = parseFloat(order.restaurant?.location?.longitude);
      if (SWAP_COORDINATES) {
        [restaurantLat, restaurantLon] = [restaurantLon, restaurantLat];
      }
      if (!restaurantLat || !restaurantLon || !isValidCoordinate(restaurantLat, restaurantLon)) {
        throw new Error(`Invalid restaurant coordinates: lat=${restaurantLat}, lon=${restaurantLon}`);
      }

      // Get and validate customer (delivery) coordinates
      let customerLat = parseFloat(order.deliveryLocation?.latitude);
      let customerLon = parseFloat(order.deliveryLocation?.longitude);
      if (SWAP_COORDINATES) {
        [customerLat, customerLon] = [customerLon, customerLat];
      }
      if (!customerLat || !customerLon || !isValidCoordinate(customerLat, customerLon)) {
        throw new Error(`Invalid customer coordinates: lat=${customerLat}, lon=${customerLon}`);
      }

      // Check if coordinates are geographically plausible (e.g., within 50 km)
      const distance = getDistance(restaurantLat, restaurantLon, customerLat, customerLon);
      console.log('Distance between restaurant and customer:', distance.toFixed(2), 'km');
      if (distance > 50) {
        console.warn('Warning: Restaurant and customer are too far apart for a realistic delivery route.');
        throw new Error('Locations are too far apart for delivery. Please verify the coordinates.');
      }

      // Debug coordinates
      console.log('Restaurant (Start) Coordinates:', { lat: restaurantLat, lon: restaurantLon });
      console.log('Customer (End) Coordinates:', { lat: customerLat, lon: customerLon });

      // Open map.html in a new tab with restaurant as start and customer as end
      const mapUrl = `/map.html?driverLat=${encodeURIComponent(restaurantLat)}&driverLon=${encodeURIComponent(restaurantLon)}&restaurantLat=${encodeURIComponent(customerLat)}&restaurantLon=${encodeURIComponent(customerLon)}`;
      console.log('Opening map URL (Restaurant to Customer):', mapUrl);
      const mapWindow = window.open(mapUrl, '_blank');

      // Handle popup blockers
      if (!mapWindow || mapWindow.closed || typeof mapWindow.closed === 'undefined') {
        setError(`Popup blocked. Please allow popups for this site or manually visit: ${mapUrl}`);
      }

      // Navigate to /deliveryconfirm with the updated order
      navigate('/deliveryconfirm', {
        state: { order: { ...order, status: updatedOrder.orderStatus } },
      });
    } catch (err) {
      console.error('Error updating order status:', err.message);
      setError(`Failed to update the order: ${err.message}`);
    } finally {
      setLoading(false);
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
      <h1 className="text-2xl font-bold mb-4">Order Details</h1>

      {loading ? (
        <div className="text-center py-8">
          <p>Loading order details...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
          {error.includes('Popup blocked') && (
            <a
              href={error.split(': ')[1]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              Click here to open the map
            </a>
          )}
        </div>
      ) : !order ? (
        <p className="text-gray-500">Order not found.</p>
      ) : (
        <div className="bg-white p-4 rounded shadow">
          {/* Order Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Order Details</h3>
              <p><strong>Order ID:</strong> {order.orderId}</p>
              <p><strong>Order Date:</strong> {new Date(order.orderDate).toLocaleString()}</p>
              <p><strong>Total Amount:</strong> Rs. {order.totalAmount?.toFixed(2)}</p>
              <p>
                <strong>Status:</strong>
                <span
                  className={`ml-2 px-2 py-1 rounded text-xs ${
                    order.status === 'driverAssigned'
                      ? 'bg-yellow-100 text-yellow-800'
                      : order.status === 'driverAccepted'
                      ? 'bg-blue-100 text-blue-800'
                      : order.status === 'outForDelivery'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {order.status || 'Unknown'}
                </span>
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Customer Details</h3>
              <p><strong>Name:</strong> {order.customer?.name || 'N/A'}</p>
              <p><strong>Phone:</strong> {order.customer?.phone || 'N/A'}</p>
            </div>
          </div>

          {/* Restaurant Details */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Restaurant Details</h3>
            <p><strong>Name:</strong> {order.restaurant?.name || 'N/A'}</p>
            <p>
              <strong>Address:</strong>{' '}
              {addresses.restaurant ||
                `Lat: ${order.restaurant?.location?.latitude || 'N/A'}, Long: ${
                  order.restaurant?.location?.longitude || 'N/A'
                }`}
            </p>
          </div>

          {/* Delivery Location */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Delivery Location</h3>
            <p>
              <strong>Address:</strong>{' '}
              {addresses.delivery ||
                `Lat: ${order.deliveryLocation?.latitude || 'N/A'}, Long: ${
                  order.deliveryLocation?.longitude || 'N/A'
                }`}
            </p>
          </div>

          {/* Items Ordered */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Items Ordered</h3>
            <ul className="list-disc pl-5">
              {order.items?.map((item, index) => (
                <li key={index}>
                  {item.quantity}x {item.itemId} - Rs. {(item.price * item.quantity).toFixed(2)}
                </li>
              )) || <li>No items available</li>}
            </ul>
          </div>

          {/* Delivery Person Details */}
          {order.deliveryPerson && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Assigned Delivery Person</h3>
              <p><strong>Name:</strong> {order.deliveryPerson.name || 'N/A'}</p>
              <p><strong>Phone:</strong> {order.deliveryPerson.phone || 'N/A'}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            {order.status === ORDER_STATUS.DRIVER_ACCEPTED && (
              <button
                onClick={pickupConfirm}
                disabled={loading}
                className="px-4 py-2 rounded bg-green-500 hover:bg-green-600 text-white disabled:bg-green-300"
              >
                {loading ? 'Processing...' : 'Confirm Pickup'}
              </button>
            )}
            {order.status === ORDER_STATUS.OUT_FOR_DELIVERY && (
              <button
                onClick={() => navigate('/deliveryconfirm', { state: { order } })}
                className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white"
              >
                Proceed to Delivery Confirmation
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;