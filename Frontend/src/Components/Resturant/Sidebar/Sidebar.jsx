import React, { useContext, useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { assets } from '../../../assets/assets';
import './Sidebar.css';

import { AuthContext } from '../../../Context/AuthContext';

const Sidebar = () => {
  const url = 'http://localhost:30101';
  const { user } = useContext(AuthContext);

  console.log(user);

  const fetchRestaurantProfile = async () => {
    try {
      if (!user || !user.id) {
        return; 
      }

     
      const response = await axios.get(`${url}/api/resturants/list/${user.id}`,{withCredentials: true});
      if (response.data.success) {
        
        
      } else {
        toast.error('Error fetching restaurant profile');
      }
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      toast.error('Server error');
    }
  };

  useEffect(() => {
    if (user) {
      fetchRestaurantProfile();
    }
  }, [user]);

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
        
        <NavLink to={`/updaterestaurant/${user?.id}`} className='sidebar-option'>
          <img className='profile-icon' src={assets.profile} alt='Profile' />
          <p>Profile</p>
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;