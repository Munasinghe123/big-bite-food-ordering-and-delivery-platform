import React, { useEffect, useState } from 'react';
import './Menulists.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../Sidebar/Sidebar';

const Menulists = () => {
  const url = 'http://localhost:30504';
  const [list, setList] = useState([]);
  const [search, setSearch] = useState('');
  const [notFound, setNotFound] = useState('');
  const navigate = useNavigate();


  const fetchAllMenus = async () => {
    try {
      const response = await axios.get(`${url}/api/menu/list`);
      if (response.data.success) {
        setList(response.data.data);
      } else {
        toast.error('Error fetching menu');
      }
    } catch (error) {
      console.error(error);
      toast.error('Server error');
    }
  };

  const deleteMenu = async (menuId) => {
    try {
      const response = await axios.delete(`${url}/api/menu/delete/${menuId}`);
      if (response.data.success) {
        toast.success(response.data.message);
        fetchAllMenus();
      } else {
        toast.error('Error deleting menu');
      }
    } catch (error) {
      console.error(error);
      toast.error('Server error');
    }
  };

  const searchFood = async () => {
    if (!search.trim()) {
      fetchAllMenus();
      setNotFound("");
      return;
    }

    try {
      const response = await axios.get(`${url}/api/menu/search?query=${search}`);
      if (response.data.success) {
        const data = response.data.data;
        if (data.length === 0) {
          setNotFound("No results found");
        } else {
          setList(data);
          setNotFound("");
        }
      } else {
        toast.error('Search failed');
      }
    } catch (error) {
      console.error(error);
      toast.error('Server error');
    }
  };

  useEffect(() => {
    fetchAllMenus();
  }, []);

  return (
    <div className='layout7'>
      <div className='bar7'>
        <Sidebar />
      </div>

      <div className="list-add2 flex-col">
        <h3>Menu Lists</h3>

        {/* Search Bar */}
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by name, menu ID, category, or restaurant ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button onClick={searchFood}>Search</button>
        </div>

        {notFound && (
          <p style={{ color: 'red', marginTop: '10px' }}>{notFound}</p>
        )}

        {/* Table */}
        <div className="list-table">
          <div className="list-table-format title">
            <b>Menu ID</b>
            <b>Image</b>
            <b>Menu Name</b>
            <b>Category</b>
            <b>Price</b>
            <b>Restaurant ID</b>
            <b>Action</b>
          </div>
          {list.map((item, index) => (
            <div key={index} className="list-table-format">
              <p>{item.menuId}</p>
              <img className="menuImage" src={`${url}/images/${item.image}`} alt={item.name} />
              <p>{item.name}</p>
              <p>{item.category}</p>
              <p>Rs. {item.price}</p>
              <p>{item.restaurantId}</p>
              <div className='list-coloumn'>
                <p className="cursor1" onClick={() => navigate(`/update/${item._id}`)}>Update</p>
                <p className="cursor2" onClick={() => deleteMenu(item._id)}>Delete</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

  );
};

export default Menulists;
