import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

function ResturantPaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const updatePaymentStatus = async () => {
      const restaurantName = new URLSearchParams(location.search).get('restaurantName');
      
      if (!restaurantName) {
        console.error('Resturant Name not found in URL');
        return;
      }

      try {
        await axios.put(`http://localhost:30101/api/resturants/updateResturantPaymentStatus/${restaurantName}`);
        console.log('Payment status updated successfully!');
      } catch (error) {
        console.error('Error updating payment status:', error);
      }

      setTimeout(() => {
        navigate('/');
      }, 3000);
    };

    updatePaymentStatus();
  }, [location, navigate]);

  return (
    <div className="payment-success-container">
      <h1>Payment Successful!</h1>
      <p>Thank you for your payment. You will be redirected shortly...</p>
    </div>
  );
}

export default ResturantPaymentSuccess;
