import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../Context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../DeliveryPerson/DeliveryPerson.css';

const ORDER_STATUS = {
  DRIVER_ASSIGNED: 'driverAssigned',
  DRIVER_ACCEPTED: 'driverAccepted',
  OUT_FOR_DELIVERY: 'outForDelivery',
  DELIVERED: 'delivered',
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
  const [location, setLocation] = useState(null); 
  const [driverLocation, setDriverLocation] = useState(null); 
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [isAcceptingOrder, setIsAcceptingOrder] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null); 
  const [orderAddresses, setOrderAddresses] = useState({}); 
  const navigate = useNavigate();

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('http://localhost:30703/driverRoutes/showtheorder', {
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
        console.log('Raw Orders Data:', data); 
        setOrders(data || []);


        const addresses = {};
        for (let i = 0; i < (data || []).length; i++) {
          const order = data[i];
          const orderId = order.orderId;


          const restaurantLat = order.restaurant?.location?.latitude;
          const restaurantLon = order.restaurant?.location?.longitude;
          if (restaurantLat && restaurantLon) {
            await delay(1000); 
            const restaurantAddress = await reverseGeocode(restaurantLat, restaurantLon);
            addresses[orderId] = {
              ...addresses[orderId],
              restaurant: restaurantAddress,
            };
          }


          const deliveryLat = order.deliveryLocation?.latitude;
          const deliveryLon = order.deliveryLocation?.longitude;
          if (deliveryLat && deliveryLon) {
            await delay(1000); 
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
      const response = await fetch('http://localhost:30703/driverRoutes/update-location', {
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


      setDriverLocation({
        latitude: location.lat,
        longitude: location.lng,
      });
      setLocation(null); 
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


      if (!order.restaurant?.location?.latitude || !order.restaurant?.location?.longitude) {
        throw new Error('Restaurant location coordinates are missing');
      }


      const restaurantLat = parseFloat(order.restaurant.location.latitude);
      const restaurantLon = parseFloat(order.restaurant.location.longitude);


      console.log('Raw Restaurant Coordinates:', {
        latitude: order.restaurant.location.latitude,
        longitude: order.restaurant.location.longitude,
      });


      if (!isValidCoordinate(restaurantLat, restaurantLon)) {
        throw new Error(`Invalid restaurant coordinates: lat=${restaurantLat}, lon=${restaurantLon}`);
      }


      if (!driverLocation?.latitude || !driverLocation?.longitude) {
        throw new Error('Driver location is not available. Please update your location.');
      }


      const driverLat = parseFloat(driverLocation.latitude);
      const driverLon = parseFloat(driverLocation.longitude);


      if (!isValidCoordinate(driverLat, driverLon)) {
        throw new Error(`Invalid driver coordinates: lat=${driverLat}, lon=${driverLon}`);
      }


      console.log('Processed Coordinates for Map:', {
        driver: { lat: driverLat, lon: driverLon },
        restaurant: { lat: restaurantLat, lon: restaurantLon },
      });


      const updateResponse = await fetch(
        `http://localhost:30703/driverRoutes/updateOrder/${order.orderId}`,
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


      setOrders((prevOrders) =>
        prevOrders.map((o) =>
          o.orderId === order.orderId
            ? { ...o, status: updatedOrder.orderStatus }
            : o
        )
      );


      setSelectedOrder({ ...order, status: updatedOrder.orderStatus });

      // Open map in a new tab with driver and restaurant coordinates
      const mapUrl = `/map.html?driverLat=${encodeURIComponent(driverLat)}&driverLon=${encodeURIComponent(driverLon)}&restaurantLat=${encodeURIComponent(restaurantLat)}&restaurantLon=${encodeURIComponent(restaurantLon)}`;
      console.log('Opening map URL:', mapUrl);
      const mapWindow = window.open(mapUrl, '_blank');

      if (!mapWindow || mapWindow.closed || typeof mapWindow.closed === 'undefined') {
        setError('Popup blocked. Please allow popups for this site and try again.');
      }


      navigate('/DOrderDetails', {
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
      <div className="container">
        <h1>Access Denied</h1>
        <p>You must be logged in as a delivery person to view this page.</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="delivery-animation">
        <div className="delivery-boy"></div>
      </div>
      <div className="bg-white">
        <h2 className="text-xl">Update Your Location</h2>
        <div className="mb-4">
          <button onClick={fetchCurrentLocation}>Get Current Location</button>
          {location && (
            <p className="mt-2">
              Current Location: Lat: {location.lat.toFixed(6)}, Long:{' '}
              {location.lng.toFixed(6)}
            </p>
          )}
          {driverLocation && (
            <p className="mt-2">
              Confirmed Location: Lat: {driverLocation.latitude.toFixed(6)}, Long:{' '}
              {driverLocation.longitude.toFixed(6)}
            </p>
          )}
          <button
            onClick={updateLocation}
            disabled={isUpdatingLocation || !location}
            className={isUpdatingLocation || !location ? 'disabled' : ''}
          >
            {isUpdatingLocation ? 'Updating...' : 'Confirm Location'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center">
          <p>Loading orders...</p>
        </div>
      ) : (
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-xl">Your Orders</h2>

          {orders.length > 0 ? (
            <div>
              {orders
                .filter((order) => order.status !== ORDER_STATUS.DELIVERED) 
                .map((order) => (
                  <div key={order.orderId} className="order-card">
                    {/* Order Overview */}
                    <div className="grid mb-4">
                      <div>
                        <h3 className="text-lg">Order Details</h3>
                        <p>
                          <strong>Order ID:</strong> {order.orderId}
                        </p>
                        <p>
                          <strong>Order Date:</strong>{' '}
                          {new Date(order.orderDate).toLocaleString()}
                        </p>
                        <p>
                          <strong>Total Amount:</strong> Rs.{' '}
                          {order.totalAmount?.toFixed(2)}
                        </p>
                        <p>
                          <strong>Status:</strong>
                          <span
                            className={`status-badge ${
                              order.status === ORDER_STATUS.DRIVER_ASSIGNED
                                ? 'bg-yellow-100'
                                : order.status === ORDER_STATUS.DRIVER_ACCEPTED
                                ? 'bg-blue-100'
                                : order.status ===
                                  ORDER_STATUS.OUT_FOR_DELIVERY
                                ? 'bg-purple-100'
                                : 'bg-gray-100'
                            }`}
                          >
                            {order.status}
                          </span>
                        </p>
                      </div>
                      <div>
                        <h3 className="text-lg">Customer Details</h3>
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
                      <h3 className="text-lg">Restaurant Details</h3>
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
                      <h3 className="text-lg">Delivery Location</h3>
                      <p>
                        <strong>Address:</strong>{' '}
                        {orderAddresses[order.orderId]?.delivery ||
                          `Lat: ${order.deliveryLocation.latitude}, Long: ${order.deliveryLocation.longitude}`}
                      </p>
                    </div>

                    {/* Items Ordered */}
                    <div className="mb-4">
                      <h3 className="text-lg">Items Ordered</h3>
                      <ul className="list-disc">
                        {order.items?.map((item, index) => (
                          <li key={index}>
                            {item.quantity}x {item.itemId} - Rs.{' '}
                            {(item.price * item.quantity).toFixed(2)}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Delivery Person Details (if available) */}
                    {order.deliveryPerson && (
                      <div className="mb-4">
                        <h3 className="text-lg">Assigned Delivery Person</h3>
                        <p>
                          <strong>Name:</strong> {order.deliveryPerson.name}
                        </p>
                        <p>
                          <strong>Phone:</strong> {order.deliveryPerson.phone}
                        </p>
                      </div>
                    )}

                    <div className="flex">
                      {order.status === ORDER_STATUS.DRIVER_ASSIGNED && (
                        <button
                          onClick={() => acceptOrder(order)}
                          disabled={isAcceptingOrder || !driverLocation}
                          className={
                            isAcceptingOrder || !driverLocation
                              ? 'disabled'
                              : ''
                          }
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