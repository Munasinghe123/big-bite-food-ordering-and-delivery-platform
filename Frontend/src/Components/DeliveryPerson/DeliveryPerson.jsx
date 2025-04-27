import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../Context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './DeliveryPerson.css'; // Adjust the path based on your file structure

// Status constants to match backend's validStatuses array
const ORDER_STATUS = {
  DRIVER_ASSIGNED: 'driverAssigned',
  DRIVER_ACCEPTED: 'driverAccepted',
  OUT_FOR_DELIVERY: 'outForDelivery',
  DELIVERED: 'delivered',
};

// Utility function to delay requests (to comply with Nominatim rate limits)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Function to reverse geocode coordinates using Nominatim API
const reverseGeocode = async (lat, lon) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18`,
      {
        headers: {
          'User-Agent': 'DeliveryApp/1.0 (contact: your-email@example.com)', // Replace with your app name and contact
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch address');
    }

    const data = await response.json();
    return data.display_name || `${lat}, ${lon}`; // Fallback to coordinates if address not found
  } catch (err) {
    console.error('Error reverse geocoding:', err);
    return `${lat}, ${lon}`; // Fallback to coordinates on error
  }
};

// Utility function to validate coordinates
const isValidCoordinate = (lat, lon) => {
  const validLat = !isNaN(lat) && lat >= -90 && lat <= 90;
  const validLon = !isNaN(lon) && lon >= -180 && lon <= 180;
  if (!validLat || !validLon) {
    console.error('Invalid coordinates:', { lat, lon });
  }
  return validLat && validLon;
};

const DeliveryPerson = () => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null); // { lat, lng }
  const [driverLocation, setDriverLocation] = useState(null); // Store confirmed driver location
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [isAcceptingOrder, setIsAcceptingOrder] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null); // Track order for navigation
  const [orderAddresses, setOrderAddresses] = useState({}); // Store addresses for each order
  const navigate = useNavigate();

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('http://localhost:7003/driverRoutes/showtheorder', {
          method: 'GET',
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch orders: ${response.status}`);
        }

        const { data } = await response.json();
        console.log('Raw Orders Data:', data); // Debug backend response
        setOrders(data || []);

        // Fetch addresses for each order
        const addresses = {};
        for (let i = 0; i < (data || []).length; i++) {
          const order = data[i];
          const orderId = order.orderId;

          // Restaurant address
          const restaurantLat = order.restaurant?.location?.latitude;
          const restaurantLon = order.restaurant?.location?.longitude;
          if (restaurantLat && restaurantLon) {
            await delay(1000); // 1-second delay between requests
            const restaurantAddress = await reverseGeocode(restaurantLat, restaurantLon);
            addresses[orderId] = {
              ...addresses[orderId],
              restaurant: restaurantAddress,
            };
          }

          // Delivery address
          const deliveryLat = order.deliveryLocation?.latitude;
          const deliveryLon = order.deliveryLocation?.longitude;
          if (deliveryLat && deliveryLon) {
            await delay(1000); // 1-second delay between requests
            const deliveryAddress = await reverseGeocode(deliveryLat, deliveryLon);
            addresses[orderId] = {
              ...addresses[orderId],
              delivery: deliveryAddress,
            };
          }
        }
        setOrderAddresses(addresses);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user && user.role === 'DeliveryPerson') {
      fetchOrders();
    }
  }, [user]);

  // Fetch current location using Geolocation API
  const fetchCurrentLocation = () => {
    setError(null);
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your device or browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
      },
      (err) => {
        console.error('Error fetching location:', err);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Location access denied. Please allow location access in your browser settings.');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Location information is unavailable. Please try again later.');
            break;
          case err.TIMEOUT:
            setError('The request to get your location timed out. Please try again.');
            break;
          default:
            setError('An error occurred while fetching your location.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const updateLocation = async () => {
    if (!location?.lat || !location?.lng) {
      setError('Please fetch your current location first.');
      return;
    }

    setIsUpdatingLocation(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:7003/driverRoutes/update-location', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          latitude: location.lat,
          longitude: location.lng,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update location');
      }

      // Update driverLocation with the confirmed location
      setDriverLocation({
        latitude: location.lat,
        longitude: location.lng,
      });
      setLocation(null); // Clear location after successful update
      alert('Location updated successfully!');
    } catch (err) {
      console.error('Error updating location:', err);
      setError(err.message);
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  const acceptOrder = async (order) => {
    try {
      setIsAcceptingOrder(true);
      setError(null);

      // Validate restaurant coordinates
      if (!order.restaurant?.location?.latitude || !order.restaurant?.location?.longitude) {
        throw new Error('Restaurant location coordinates are missing');
      }

      // Use raw coordinates without swapping to test backend convention
      const restaurantLat = parseFloat(order.restaurant.location.latitude);
      const restaurantLon = parseFloat(order.restaurant.location.longitude);

      // Log raw coordinates for debugging
      console.log('Raw Restaurant Coordinates:', {
        latitude: order.restaurant.location.latitude,
        longitude: order.restaurant.location.longitude,
      });

      // Validate restaurant coordinates
      if (!isValidCoordinate(restaurantLat, restaurantLon)) {
        throw new Error(`Invalid restaurant coordinates: lat=${restaurantLat}, lon=${restaurantLon}`);
      }

      // Validate driver location
      if (!driverLocation?.latitude || !driverLocation?.longitude) {
        throw new Error('Driver location is not available. Please update your location.');
      }

      // Use confirmed driver location
      const driverLat = parseFloat(driverLocation.latitude);
      const driverLon = parseFloat(driverLocation.longitude);

      // Validate driver coordinates
      if (!isValidCoordinate(driverLat, driverLon)) {
        throw new Error(`Invalid driver coordinates: lat=${driverLat}, lon=${driverLon}`);
      }

      // Debug coordinates before opening map
      console.log('Processed Coordinates for Map:', {
        driver: { lat: driverLat, lon: driverLon },
        restaurant: { lat: restaurantLat, lon: restaurantLon },
      });

      // Update order status to 'driverAccepted'
      const updateResponse = await fetch(
        `http://localhost:7003/driverRoutes/updateOrder/${order.orderId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          credentials: 'include',
          body: JSON.stringify({
            orderStatus: ORDER_STATUS.DRIVER_ACCEPTED,
          }),
        }
      );

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.message || 'Failed to accept order');
      }

      const updatedOrderResponse = await updateResponse.json();
      const updatedOrder = updatedOrderResponse.order;

      // Update local state
      setOrders((prevOrders) =>
        prevOrders.map((o) =>
          o.orderId === order.orderId
            ? { ...o, status: updatedOrder.orderStatus }
            : o
        )
      );

      // Set selected order for navigation
      setSelectedOrder({ ...order, status: updatedOrder.orderStatus });

      // Open map in a new tab with driver and restaurant coordinates
      const mapUrl = `/map.html?driverLat=${encodeURIComponent(driverLat)}&driverLon=${encodeURIComponent(driverLon)}&restaurantLat=${encodeURIComponent(restaurantLat)}&restaurantLon=${encodeURIComponent(restaurantLon)}`;
      console.log('Opening map URL:', mapUrl);
      const mapWindow = window.open(mapUrl, '_blank');

      if (!mapWindow || mapWindow.closed || typeof mapWindow.closed === 'undefined') {
        setError('Popup blocked. Please allow popups for this site and try again.');
      }

      // Navigate to OrderDetails in the current tab
      navigate('/OrderDetails', {
        state: {
          order: { ...order, status: updatedOrder.orderStatus },
        },
      });
    } catch (err) {
      console.error('Error accepting order:', err);
      setError(err.message);
    } finally {
      setIsAcceptingOrder(false);
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
      <h1 className="text-2xl font-bold mb-4">Welcome, {user.name}</h1>

      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-xl font-semibold mb-2">Update Your Location</h2>
        <div className="mb-4">
          <button
            onClick={fetchCurrentLocation}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-2"
          >
            Get Current Location
          </button>
          {location && (
            <p className="mt-2">
              Current Location: Lat: {location.lat.toFixed(6)}, Long: {location.lng.toFixed(6)}
            </p>
          )}
          {driverLocation && (
            <p className="mt-2">
              Confirmed Location: Lat: {driverLocation.latitude.toFixed(6)}, Long: {driverLocation.longitude.toFixed(6)}
            </p>
          )}
          <button
            onClick={updateLocation}
            disabled={isUpdatingLocation || !location}
            className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
          >
            {isUpdatingLocation ? 'Updating...' : 'Confirm Location'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <p>Loading orders...</p>
        </div>
      ) : (
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Your Orders</h2>

          {orders.length > 0 ? (
            <div className="space-y-6">
              {orders
                .filter((order) => order.status !== ORDER_STATUS.DELIVERED) // Filter out Delivered orders
                .map((order) => (
                  <div key={order.orderId} className="border rounded-lg p-4 shadow-sm">
                    {/* Order Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Order Details</h3>
                        <p>
                          <strong>Order ID:</strong> {order.orderId}
                        </p>
                        <p>
                          <strong>Order Date:</strong>{' '}
                          {new Date(order.orderDate).toLocaleString()}
                        </p>
                        <p>
                          <strong>Total Amount:</strong> Rs. {order.totalAmount?.toFixed(2)}
                        </p>
                        <p>
                          <strong>Status:</strong>
                          <span
                            className={`ml-2 px-2 py-1 rounded text-xs ${
                              order.status === ORDER_STATUS.DRIVER_ASSIGNED
                                ? 'bg-yellow-100 text-yellow-800'
                                : order.status === ORDER_STATUS.DRIVER_ACCEPTED
                                ? 'bg-blue-100 text-blue-800'
                                : order.status === ORDER_STATUS.OUT_FOR_DELIVERY
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {order.status}
                          </span>
                        </p>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Customer Details</h3>
                        <p>
                          <strong>Name:</strong> {order.customer.name}
                        </p>
                        <p>
                          <strong>Phone:</strong> {order.customer.phone}
                        </p>
                      </div>
                    </div>

                    {/* Restaurant Details */}
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-2">Restaurant Details</h3>
                      <p>
                        <strong>Name:</strong> {order.restaurant.name}
                      </p>
                      <p>
                        <strong>Address:</strong>{' '}
                        {orderAddresses[order.orderId]?.restaurant ||
                          `Lat: ${order.restaurant.location.latitude}, Long: ${order.restaurant.location.longitude}`}
                      </p>
                    </div>

                    {/* Delivery Location */}
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-2">Delivery Location</h3>
                      <p>
                        <strong>Address:</strong>{' '}
                        {orderAddresses[order.orderId]?.delivery ||
                          `Lat: ${order.deliveryLocation.latitude}, Long: ${order.deliveryLocation.longitude}`}
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
                        ))}
                      </ul>
                    </div>

                    {/* Delivery Person Details (if available) */}
                    {order.deliveryPerson && (
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-2">Assigned Delivery Person</h3>
                        <p>
                          <strong>Name:</strong> {order.deliveryPerson.name}
                        </p>
                        <p>
                          <strong>Phone:</strong> {order.deliveryPerson.phone}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-2">
                      {order.status === ORDER_STATUS.DRIVER_ASSIGNED && (
                        <button
                          onClick={() => acceptOrder(order)}
                          disabled={isAcceptingOrder || !driverLocation}
                          className="px-4 py-2 rounded bg-green-500 hover:bg-green-600 text-white disabled:bg-green-300"
                        >
                          {isAcceptingOrder ? 'Accepting...' : 'Accept Order'}
                        </button>
                      )}
                      {(order.status === ORDER_STATUS.DRIVER_ACCEPTED ||
                        order.status === ORDER_STATUS.OUT_FOR_DELIVERY) && (
                        <button
                          onClick={() =>
                            navigate('/OrderDetails', {
                              state: { order },
                            })
                          }
                          className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white"
                        >
                          View Details
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-500">No orders assigned to you yet.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default DeliveryPerson;