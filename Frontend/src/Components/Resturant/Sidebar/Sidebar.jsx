import React, { useContext, useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { assets } from '../../../assets/assets';
import './Sidebar.css';

import { AuthContext } from '../../../context/AuthContext';

const Sidebar = () => {
  const url = 'http://localhost:7001';
  const [restaurant, setRestaurant] = useState(null);
  const  { user } = useContext(AuthContext);

  const fetchRestaurantProfile = async () => {
    try {
      const restaurantId = localStorage.getItem('restaurantId');
  
      if (!restaurantId) {
        toast.error('No restaurant ID found. Please login again.');
        return;
      }
  
      const response = await axios.get(`${url}/api/resturants/list/${user.restaurantId}`);
      if (response.data.success) {
        setRestaurant(response.data.data);
      } else {
        toast.error('Error fetching restaurant profile');
      }
    } catch (error) {
      console.error(error);
      toast.error('Server error');
    }
  };

  useEffect(() => {
    fetchRestaurantProfile();
  }, []);

  return (
    <div className='sidebar'>
      <div className='options'>
        <NavLink to='/ResturantAdmin' className='sidebar-option'>
          <img className='dashboard' src={assets.dashboard_icon} alt='Dashboard' />
          <p>Dashboard</p>
        </NavLink>
        <NavLink to='/addmenu' className='sidebar-option'>
          <img className='add-menu' src={assets.add_icon} alt='Add Menu' />
          <p>Add Menu</p>
        </NavLink>
        <NavLink to='/menulists' className='sidebar-option'>
          <img className='menu-lists' src={assets.menu_icon} alt='Menu Lists' />
          <p>Menu Items</p>
        </NavLink>
        <NavLink to='/orders' className='sidebar-option'>
          <img className='order-icon' src={assets.order_icon} alt='Order History' />
          <p>Order History</p>
        </NavLink>

        {restaurant && (
          <NavLink to={`/updaterestaurant/${user._id}`} className='sidebar-option'>
            <img className='profile-icon' src={assets.profile} alt='Profile' />
            <p>Profile</p>
          </NavLink>
        )}
      </div>
    </div>
  );
};

export default Sidebar; 