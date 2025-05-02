import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './UpdateRestaurant.css'
import { assets } from '../../../../assets/assets';
import Sidebar from '../../Sidebar/Sidebar';

const UpdateRestaurant = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const url = 'http://localhost:30101';

    const [data, setData] = useState({
        restaurantName: '',
        restaurantLocation: '',
        lat: '',
        lng: '',
        openStatus: ''
    });

    const [currentImage, setCurrentImage] = useState('');
    const [newImage, setNewImage] = useState(null);

    useEffect(() => {
        const fetchRestaurant = async () => {
            try {
                const res = await axios.get(`${url}/api/resturants/list/${id}`, { withCredentials: true });
                if (res.data.success && res.data.data) {
                    const { restaurantName, restaurantLocation, lat, lng, openStatus, restaurantPhoto } = res.data.data;
                    console.log("resturant data",res.data.data);
                    setData({
                        restaurantName: restaurantName || '',
                        restaurantLocation: restaurantLocation || '',
                        lat: lat || '',
                        lng: lng || '',
                        openStatus: openStatus || ''
                    });
                    setCurrentImage(restaurantPhoto || '');
                } else {
                    toast.error('Failed to fetch restaurant details');
                }
            } catch (error) {
                console.error(error);
                toast.error('Server error');
            }
        };

        fetchRestaurant();
    }, [id]);

    const onChangeHandler = (e) => {
        const { name, value } = e.target;
        setData(prev => ({ ...prev, [name]: value }));
    };

    const onSubmitHandler = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('restaurantName', data.restaurantName);
        formData.append('restaurantLocation', data.restaurantLocation);
        formData.append('lat', data.lat);
        formData.append('lng', data.lng);
        formData.append('openStatus', data.openStatus);

        if (newImage) {
            formData.append('restaurantPhoto', newImage);
        }

        try {
            const res = await axios.put(`${url}/api/resturants/updateRestaurant/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                withCredentials: true
            });

            if (res.data.success) {
                toast.success('Restaurant updated successfully');
                navigate('/ResturantAdmin');
            } else {
                toast.error('Failed to update restaurant');
            }
        } catch (error) {
            console.error(error);
            toast.error('Server error');
        }
    };

    return (
        <div className='layout4'>
            <div className='bar4'>
                <Sidebar />
            </div>

            <div className='update1'>
                <h3>Update Restaurant</h3><br />
                <form onSubmit={onSubmitHandler}>
                    <div className='update-img-upload1 flex-col'>
                        <p>Upload Image</p>
                        <label htmlFor='image'>
                            <img
                                src={newImage ? URL.createObjectURL(newImage) : currentImage ? `${url}/uploads/${currentImage}` : assets.upload_icon}
                                alt="Restaurant" />
                        </label>
                        <input
                            type='file'
                            id='image'
                            onChange={(e) => setNewImage(e.target.files[0])}
                            hidden
                        />
                    </div>

                    <div className='update-inputs flex-col'>
                        <p>Restaurant Name</p>
                        <input
                            type='text'
                            name='restaurantName'
                            value={data.restaurantName || ''}
                            placeholder='Enter Restaurant Name'
                            onChange={onChangeHandler}
                            required
                        />

                        <p>Restaurant Location</p>
                        <input
                            type='text'
                            name='restaurantLocation'
                            value={data.restaurantLocation || ''}
                            placeholder='Enter Restaurant Location'
                            onChange={onChangeHandler}
                            required
                        />

                        <p>Restaurant Latitude and Longitude</p>
                        <input
                            type="text"
                            placeholder='Latitude'
                            name='lat'
                            value={data.lat}
                            onChange={onChangeHandler}
                            required
                        />
                        <input
                            type="text"
                            placeholder='Longitude'
                            name='lng'
                            value={data.lng}
                            onChange={onChangeHandler}
                            required
                        />
                    </div><br />

                    <p>Restaurant Status</p>
                    <div className='update-status flex-col'>
                        <select name='openStatus' value={data.openStatus || ''} onChange={onChangeHandler} required>
                            <option value=''>Select Status</option>
                            <option value='open'>Open</option>
                            <option value='closed'>Closed</option>
                        </select>
                    </div>

                    <button type='submit' className='update-btn1'>Update Restaurant</button>
                </form>
            </div>
        </div>
    )
};

export default UpdateRestaurant