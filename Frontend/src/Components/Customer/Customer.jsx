import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import { AuthContext } from '../../Context/AuthContext';
import './Customer.css';

import markerIconPng from "leaflet/dist/images/marker-icon.png";

const markerIcon = new L.Icon({
  iconUrl: markerIconPng,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

function LocationSelector({ setLat, setLng }) {
    useMapEvents({
      click(e) {
        setLat(e.latlng.lat);
        setLng(e.latlng.lng);
      }
    });
    return null;
  }

function Customer() {

    const{user} = useContext(AuthContext);

    const [customer, setCustomer] = useState({});

    const [restaurants, setRestaurants] = useState([]);
    const [selectedRestaurant, setSelectedRestaurant] = useState(null);
    const [menuItems, setMenuItems] = useState([]);
    const [selectedRestaurantDetails, setSelectedRestaurantDetails] = useState(null);
    const [cart, setCart] = useState([]);
    const [showCart, setShowCart] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [deliveryLocationLatitude, setLat] = useState(6.9271);
    const [deliveryLocationLongitude, setLng] = useState(79.8612);
    const [notes, setNotes] = useState('');
    const [error, setError] = useState(null);
    const [pendingOrders, setPendingOrders] = useState([]); 
    const navigate = useNavigate();

    useEffect(() => {

        //debugging
        console.log("User data:", user);
       

        axios.get(`http://localhost:30502/customer/view/${user.name}`,{withCredentials: true})
            .then(res => setCustomer(res.data))
            .catch(err => console.error(err));

         
            axios.get(`http://localhost:30500/orders/view-pending/${user.name}`,{withCredentials: true})
            .then(res => {
              setPendingOrders(res.data);
            })
            .catch(err => console.error(err));
            

        axios.get('http://localhost:30101/api/resturants/list',{withCredentials: true})
            .then(res => {
                if (res.data.success) {
                    const openedRestaurants = res.data.data.filter(r => r.openStatus === 'open');
                    setRestaurants(openedRestaurants);
                }
            })
            .catch(err => console.error(err));
    }, []);

    const handleRestaurantClick = async (restaurantId) => {
        setSelectedRestaurant(restaurantId);
        const restDetails = restaurants.find(r => r.restaurantId === restaurantId);
        setSelectedRestaurantDetails(restDetails);

        try {
            const res = await axios.get('http://localhost:30504/api/menu/list', {
                withCredentials: true
            });

            if (res.data.success) {
                const itemsForRestaurant = res.data.data.filter(item => item.restaurantId === restaurantId);
                setMenuItems(itemsForRestaurant);
            }
        } catch (err) {
            console.error('Failed to load menu items:', err);
        }
    };

    const handleAddToCart = (item) => {
        const updatedCart = [...cart];
        const existingItem = updatedCart.find(ci => ci.itemId === item.menuId);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            updatedCart.push({
                itemId: item.menuId,
                quantity: 1,
                price: item.price,
                name: item.name
            });
        }
        setCart(updatedCart);
    };

    const updateQuantity = (itemId, delta) => {
        const updatedCart = cart.map(item => {
            if (item.itemId === itemId) {
                const newQty = item.quantity + delta;
                return { ...item, quantity: newQty > 0 ? newQty : 1 };
            }
            return item;
        });
        setCart(updatedCart);
    };

    const handleProceedToCheckout = () => {
        setShowCart(false);
        setShowConfirmation(true);
    };


    const handlePlaceOrder = async () => {
        const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const totalAmount = subtotal + 100; // delivery fee
      
        try {
          // 1. Create order

          console.log(selectedRestaurantDetails);
          console.log(customer);

          const response = await axios.post(
            'http://localhost:30500/orders/create-order',
            {
            cartId: `CART-${customer.name}-${Date.now()}`,
            customerUsername: customer.name,
            customerName: customer.customerName,
            customerPhone: customer.phone,
            customerEmail: customer.email,
            restaurantId: selectedRestaurantDetails.restaurantId,
            restaurantName: selectedRestaurantDetails.restaurantName,
            restaurantPhone: selectedRestaurantDetails.restaurantPhone,
            restaurantLocationLatitude: selectedRestaurantDetails.lat,
            restaurantLocationLongitude: selectedRestaurantDetails.lng,
            items: cart.map(item => ({
                itemId: item.itemId,
                quantity: item.quantity,
                price: item.price
            })),
            deliveryLocationLatitude,
            deliveryLocationLongitude,
            paymentMethod: 'Card',
            notes,
            paymentStatus: "Pending",
            totalAmount
        },
        {
          withCredentials: true 
        }
      );
      
          const order = response.data.order; 
      
          const res = await axios.post('http://localhost:30500/stripe/create-checkout-session', {
            orderId: order.orderId,
            amount: order.totalAmount,
            customerEmail: order.customerEmail,
            customerName: order.customerName,
        },{withCredentials: true});
        
        window.location.href = res.data.url;
        
      
        } catch (err) {
          console.error('Order creation failed:', err);
          alert('Failed to place order.');
        }
      };
         
    
      console.log("Customer data:", customer);
     

    return (

      <div className="customer-dashboard">

      <hr className="divider" />
      

      {!selectedRestaurant ? (
          <div>

            <div>
            {customer && <h1 className="welcome">Welcome, {customer.customerName}</h1>}


                </div>

                <div>
                
                {pendingOrders.length > 0 && (
                <div className="pending-orders">
                    <h3>Your Pending Orders</h3>
                    <div className="pending-orders-grid">
                    {pendingOrders.map((order) => (
                        <div key={order.orderId} className="pending-order-card">
                        <p><strong>Restaurant:</strong> {order.restaurantName}</p>
                        <p><strong>Items:</strong> {order.items.map(item => `1x ${item.itemId}`).join(', ')}</p>
                        <p><strong>Total:</strong> Rs. {order.totalAmount}</p>
                        <p><strong>Status:</strong> {order.orderStatus}</p>
                        <button className="view-order-btn" onClick={() => window.location.href = `/order-details/${order.orderId}`}>
                            View Order
                        </button>
                        </div>
                    ))}
                    </div>

                    <div>
                    <button
                        className="view-all-orders-btn"
                        onClick={() => navigate(`/order-history/${customer.name}`)}
                        >
                        View All Orders
                        </button>

                        </div>
                </div>
                )}


                    </div>
                
          <div className="restaurant-grid">
              {restaurants.map((res) => (
                  <div key={res.restaurantId} className="restaurant-card" onClick={() => handleRestaurantClick(res.restaurantId)}>
                      <img
                          src={`http://localhost:30101/api/uploads/${res.restaurantPhoto}`}
                          alt={res.restaurantName}
                          className="restaurant-img"
                      />
                      <div className="restaurant-info">
                          <h3>{res.restaurantName}</h3> 
                          <p>{res.restaurantLocation}</p>
                          <span className="status-open">{res.status}</span>
                      </div>
                  </div>
              ))}
          </div>
          </div>
      ) : (
          <div className="menu-section">
              {selectedRestaurantDetails && (
                  <div className="menu-restaurant-info">
                      <img
                          src={`http://localhost:30101/api/uploads/${selectedRestaurantDetails.restaurantPhoto}`}
                          alt={selectedRestaurantDetails.restaurantName}
                          className="restaurant-banner-img"
                      />
                      <div className="restaurant-summary">
                          <h2 className="restaurant-name">{selectedRestaurantDetails.restaurantName}</h2>
                          <p className="restaurant-address">{selectedRestaurantDetails.restaurantLocation}</p>
                      </div>
                  </div>
              )}

              {menuItems.length === 0 ? (
                  <p>No menu items found.</p>
              ) : (
                  <div className="menu-list">
                      {menuItems.map(item => (
                          <div key={item.menuId} className="menu-item">
                              <div className="menu-item-info">
                                  <h4 className="menu-title">{item.name}</h4>
                                  <p className="menu-meta">LKR {item.price.toFixed(2)}</p>
                                  <p className="menu-description">{item.description}</p>
                              </div>
                              <div className="menu-item-img-wrap">
                                  <img
                                      src={`http://localhost:30504/images/${item.image}`}
                                      alt={item.name}
                                      className="menu-item-img"
                                  />
                                  <button className="menu-add-btn" onClick={() => handleAddToCart(item)}>+</button>
                              </div>
                          </div>
                      ))}
                  </div>
              )}

              <button onClick={() => setSelectedRestaurant(null)} className="back-btn">Back to Restaurants</button>
          </div>
      )}

      {cart.length > 0 && !showCart && (
          <div className="cart-floating" onClick={() => setShowCart(true)}>
              🛒 {cart.reduce((sum, item) => sum + item.quantity, 0)} items | LKR {cart.reduce((sum, item) => sum + item.quantity * item.price, 0).toFixed(2)} – View Cart
          </div>
      )}

      {showCart && (
          <div className="cart-panel">
              <h3>Your Cart</h3>
              {cart.map(item => (
                  <div key={item.itemId} className="cart-item">
                      <span>{item.name}</span>
                      <div className="cart-qty-control">
                          <button onClick={() => updateQuantity(item.itemId, -1)}>-</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.itemId, 1)}>+</button>
                      </div>
                      <span>LKR {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
              ))}
              <div className="cart-total">Subtotal: LKR {cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}</div>
              <button className="checkout-btn" onClick={handleProceedToCheckout}>Checkout</button>
               <button className="close-cart" onClick={() => setShowCart(false)}>Close</button>
          </div>
      )}

    {showConfirmation && (
                <div className="confirmation-page">
                    <h2>Order Confirmation</h2>
                    <p><strong>Name:</strong> {customer.customerName}</p>
                    <p><strong>Phone:</strong> {customer.phone}</p>

                    <label>Delivery Location</label>
                    
                    <button
                        type='button'
                        className='location-btn'
                        onClick={() => {
                            if (navigator.geolocation) {

                                navigator.geolocation.getCurrentPosition(
                                (position) => {
                                    const { latitude, longitude } = position.coords;
                                    setLat(latitude);
                                    setLng(longitude);
                                },
                                (error) => {
                                    setError("Unable to retrieve your location.");
                                    console.error(error);
                                },
                                {
                                    enableHighAccuracy: true,
                                    timeout: 10000,
                                    maximumAge: 0
                                }
                                );
                            
                              } else {
                                setError("Geolocation is not supported by your browser.");
                              }   
                        }}
                        >
                        Use My Location
                        </button>

                        {error && <p className="error-text">{error}</p>}


                    <MapContainer
                    center={
                        deliveryLocationLatitude && deliveryLocationLongitude
                          ? [deliveryLocationLatitude, deliveryLocationLongitude]
                          : [6.9271, 79.8612]
                      }
                    zoom={13}
                    style={{ height: '300px', marginBottom: '1rem' }}
                    >

                        <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                        />
                        <LocationSelector setLat={setLat} setLng={setLng} />
                        <Marker position={[deliveryLocationLatitude, deliveryLocationLongitude]} icon={markerIcon} />
                    </MapContainer>

                    <div >
                        <p>Delivery Location</p> <br />

                        <label>Delivery Location Latitude</label>
                        <input type='text' value={deliveryLocationLatitude} readOnly />

                        <label>Delivery Location Longitude</label>
                        <input type='text' value={deliveryLocationLongitude} readOnly />
                    </div>


                    <textarea
                        placeholder="Add order notes (optional)"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="order-notes"
                    ></textarea>

                    <h3>Cart Items</h3>
                    <ul>
                        {cart.map((item, index) => (
                            <li key={index}>{item.name} - {item.quantity} × Rs.{item.price}</li>
                        ))}
                    </ul>

                    <p><strong>Total:</strong> Rs. {cart.reduce((sum, item) => sum + item.price * item.quantity, 0)}</p>

                    <button className="place-order-btn" onClick={handlePlaceOrder}>Place Order</button>
                    
                    <button className="back-btn" onClick={() => {
                        setShowConfirmation(false);
                        setShowCart(true);
                    }}>Back to Cart</button>
                </div>
            )}  

      
  </div>
);

}

export default Customer;
