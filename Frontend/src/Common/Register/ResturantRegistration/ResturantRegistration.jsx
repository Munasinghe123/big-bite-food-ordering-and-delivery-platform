import React, { useState } from 'react';
import axios from 'axios';
import './ResturantRegister.css';
import { useNavigate } from 'react-router-dom';

function ResturantRegistration() {
  const [name, setName] = useState('');
  const [fullName, setFullName] = useState('');
  const [location, setLocation] = useState('');
  const [resturantPhoto, setResturantPhoto] = useState(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [email, setEmail] = useState('');
  const [adminName, setAdminName] = useState('');
  const [role] = useState("ResturantAdmin");
  const [adminPhoto, setAdminPhoto] = useState(null);
  const [phone, setPhone] = useState('');
  const [restaurantPhone, setRestaurantPhone] = useState('');
  const [paymentStatus] = useState("Pending");
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const getCoordinates = async (address) => {
    const apiKey = 'pk.2ab1bb342bf1f30767386814587a09fc';
    const response = await axios.get(`https://us1.locationiq.com/v1/search.php?key=${apiKey}&q=${address}&format=json`);
    const data = response.data[0];
    return { lat: data.lat, lng: data.lon };
  };

  const registerResturant = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      if (!location) {
        alert('Enter a valid location.');
        return;
      }

      const { lat, lng } = await getCoordinates(location);

      const formData = new FormData();
      formData.append('name', name);
      formData.append('location', location);
      formData.append('paymentStatus', paymentStatus);
      formData.append('lat', lat);
      formData.append('lng', lng);
      formData.append('restaurantPhone', restaurantPhone);

      if (resturantPhoto) {
        formData.append('resturantPhoto', resturantPhoto);
      }

      formData.append("fullName", fullName);
      formData.append("adminName", adminName);
      formData.append("adminEmail", email);
      formData.append("adminPassword", adminPassword);
      formData.append("phone", phone);
      formData.append("role", role);

      if (adminPhoto) {
        formData.append("adminPhoto", adminPhoto);
      }

      const response = await axios.post('http://localhost:30101/api/resturants/registerResturant', formData, {
        withCredentials: true,
      });

      const registeredResturant = response.data.registeredResturant;
      
      console.log("Registered Resturant", registeredResturant);

      
      const stripeRes = await axios.post('http://localhost:30101/stripe/create-resturant-checkout-session', {
        restaurantName: registeredResturant.restaurantName,
      });

      window.location.href = stripeRes.data.url;

    } catch (err) {
      console.error(err);
      if (err.response?.data?.message) {
        alert(err.response.data.message);
      } else {
        alert('Something went wrong!');
      }
    }
  };

  return (
    <div className='resturantRegister-container'>
      <form onSubmit={registerResturant} className='resturant-form'>
        <h1>Register the Restaurant</h1>

        <label>Restaurant Name</label>
        <input type='text' value={name} onChange={(e) => setName(e.target.value)} required />

        <label>Restaurant Photo</label>
        <input type='file' accept='image/*' onChange={(e) => setResturantPhoto(e.target.files[0])} />

        <label>Location</label>
        <input type='text' value={location} onChange={(e) => setLocation(e.target.value)} required />

        <label>Restaurant Phone</label>
        <input type='text' value={restaurantPhone} onChange={(e) => setRestaurantPhone(e.target.value)} required />

        <h1>Register the Restaurant Admin</h1>

        <label>Full Name</label>
        <input type='text' value={fullName} onChange={(e) => setFullName(e.target.value)} required />

        <label>Admin Name</label>
        <input type='text' value={adminName} onChange={(e) => setAdminName(e.target.value)} required />

        <label>Admin Password</label>
        <input type='password' value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required />

        <label>Admin Email</label>
        <input type='email' value={email} onChange={(e) => setEmail(e.target.value)} required />

        <label>Admin Phone</label>
        <input type='text' value={phone} onChange={(e) => setPhone(e.target.value)} required />

        <label>Admin Photo</label>
        <input type='file' accept='image/*' onChange={(e) => setAdminPhoto(e.target.files[0])} />

        <br /><br />
        <button type='submit'>Submit and Pay</button>
      </form>
    </div>
  );
}

export default ResturantRegistration;
