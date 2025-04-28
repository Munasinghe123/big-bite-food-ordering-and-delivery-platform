import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { assets } from '../../../assets/assets';
import './Sidebar.css';

const Sidebar = () => {
  const url = 'http://localhost:7001';
  const [list, setList] = useState([]);

  const fetchAllRestaurants = async () => {
    try {
      const response = await axios.get(`${url}/api/resturants/list`);
      if (response.data.success) {
        setList(response.data.data);
      } else {
        toast.error('Error fetching restaurants');
      }
    } catch (error) {
      console.error(error);
      toast.error('Server error');
    }
  };

  useEffect(() => {
    fetchAllRestaurants();
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

        {list.map((item) => (
          <NavLink to={`/updaterestaurant/${item._id}`} className='sidebar-option' key={item._id}>
            <img className='profile-icon' src={assets.profile} alt='Profile' />
            <div>
              <p>Profile</p>
            </div>
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
