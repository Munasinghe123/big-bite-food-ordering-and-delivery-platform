import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './DileveryPersonRegistration.css';

function DileveryPersonRegistration() {
  const [name, setName] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicalNo, setVehicalNo] = useState('');
  const [photo, setPhoto] = useState(null);
  const [role] = useState('DeliveryPerson');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const[paymentStatus]= useState("pending");

  const navigate = useNavigate();

  const registerForm = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();

      formData.append('name', name);
      formData.append('fullName', fullName);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('vehicalNo', vehicalNo);
      formData.append('password', password);
      formData.append('role', role);
      formData.append('paymentStatus',paymentStatus);
      if (photo) {
        formData.append('diliveryPhoto', photo);
      }

      const response = await axios.post(
        'http://localhost:30101/api/deliveryPerson/registerDelivery',
        formData,
        { withCredentials: true }
      );

      const deliveryPerson = response.data.newDeliveryPerson; 
      
      console.log("check 1");
      
      const res = await axios.post('http://localhost:30101/stripe/create-checkout-session', {        
        name: deliveryPerson.name,     
    });

    console.log("check 2");
    
    window.location.href = res.data.url;

      setSuccess(response.data.message);
      setTimeout(() => navigate('/'), 2000);

    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Registration failed!');
    }
  };

  return (
    <div className='form-container'>
      <div className='form-card'>
        <h1>Delivery person Register</h1>

        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
        {success && <p style={{ color: 'green', textAlign: 'center' }}>{success}</p>}

        <form onSubmit={registerForm}>
          <label>Photo</label>
          <input type='file' accept='image/*' onChange={(e) => setPhoto(e.target.files[0])} /> <br /><br />

          <label>Full name</label>
          <input type='text' value={fullName} onChange={(e) => setFullName(e.target.value)} required /> <br /><br />

          <label>Name</label>
          <input type='text' value={name} onChange={(e) => setName(e.target.value)} required /> <br /><br />

          <label>Vehicle No</label>
          <input type='text' value={vehicalNo} onChange={(e) => setVehicalNo(e.target.value)} required /> <br /><br />

          <label>Email</label>
          <input type='email' value={email} onChange={(e) => setEmail(e.target.value)} required /> <br /><br />

          <label>Phone</label>
          <input type='text' value={phone} onChange={(e) => setPhone(e.target.value)} required /> <br /><br />

          <label>Password</label>
          <input type='password' value={password} onChange={(e) => setPassword(e.target.value)} required /> <br /><br />

          <button className='submitNPayButton' type='submit'>Submit and pay</button>
        </form>
      </div>
    </div>
  );
}

export default DileveryPersonRegistration;
