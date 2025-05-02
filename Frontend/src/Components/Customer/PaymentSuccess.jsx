import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const processPaymentSuccess = async () => {
      const orderId = new URLSearchParams(location.search).get('orderId');
      
      if (!orderId) {
        console.error('Order ID not found in URL');
        toast.error('Payment verification failed: Missing order ID');
        navigate('/Customer');
        return;
      }

      try {
        await axios.put(
          `http://localhost:30500/orders/mark-paid/${orderId}`,
          {}, 
          {
            withCredentials: true
          }
        );
        
        console.log('Payment status updated successfully!');
        toast.success('Payment successfully processed!');

        const assignDriverResponse = await axios.post(
          'http://localhost:30703/driverRoutes/assign-driver-payment-success',
          { 
            orderId,
            secretKey: import.meta.env.VITE_PAYMENT_SUCCESS_SECRET
          }
        );
        
        console.log('Driver assignment response:', assignDriverResponse.data);
        
        if (assignDriverResponse.data.success) {
          toast.success('Driver assigned to your order!');
          console.log('Driver assigned successfully!');
        } else {
          toast.warning('Driver assignment in progress...');
          console.warn('Driver assignment had issues:', assignDriverResponse.data.message);
        }

      } catch (error) {
        console.error('Error during payment processing:', error);
        
        if (error.response) {
          if (error.response.status === 401) {
            toast.error('Payment verification failed: Unauthorized');
          } else if (error.response.status === 404) {
            toast.warning('No available drivers at the moment. We will notify you when one becomes available.');
          } else {
            toast.error(`Payment processing error: ${error.response.data.message || 'Unknown error'}`);
          }
        } else {
          toast.error('Network error during payment processing. Please check your order status later.');
        }
      }

      setTimeout(() => {
        navigate('/Customer');
      }, 3000);
    };

    processPaymentSuccess();
  }, [location, navigate]);

  return (
    <div className="payment-success-container" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      textAlign: 'center',
      padding: '2rem',
      backgroundColor: '#f8f9fa'
    }}>
      <h1 style={{ color: '#28a745', fontSize: '2.5rem', marginBottom: '1rem' }}>
        Payment Successful!
      </h1>
      <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
        Thank you for your payment. You will be redirected shortly...
      </p>
      <div className="loading-spinner" style={{
        width: '50px',
        height: '50px',
        border: '5px solid #f3f3f3',
        borderTop: '5px solid #28a745',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}></div>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default PaymentSuccess;