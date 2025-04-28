import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CancelOrder.css';

function CancelOrder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    orderId: id,
    cancellationReason: '',
    additionalComments: '',
    acknowledgment: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        setUser(storedUser);

        const orderResponse = await axios.get(`http://localhost:5000/orders/view/${id}`);
        setOrder(orderResponse.data);

        if (storedUser && orderResponse.data) {
          if (storedUser.id !== orderResponse.data.customerId) {
            setError('You are not authorized to cancel this order');
          }
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load order details. Please try again.');
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.cancellationReason.trim()) {
      setError('Cancellation reason is required.');
      setLoading(false);
      return;
    }

    if (!formData.acknowledgment) {
      setError('You must acknowledge the cancellation.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:7003/driverRoutes/cancel-order/${formData.orderId}`,
        {
          cancellationReason: formData.cancellationReason,
          additionalComments: formData.additionalComments,
          acknowledgment: formData.acknowledgment,
        }
      );

      if (response.data.success) {
        alert('Order cancelled successfully!');
        navigate('/Customer');
      } else {
        setError(response.data.message || 'Failed to cancel order.');
      }
    } catch (err) {
      console.error('Error cancelling order:', err);
      setError(
        err.response?.data?.message ||
        'Server error while cancelling order. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    navigate(-1);
  };

  if (!order || !user) {
    return <div className="loading">Loading order details...</div>;
  }

  if (error && error.includes('not authorized')) {
    return (
      <div className="cancel-order-container">
        <div className="cancel-order-card">
          <h2>Unauthorized Access</h2>
          <p>{error}</p>
          <button onClick={handleClose} className="btn btn-secondary">
            Back to Order
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cancel-order-container">
      <div className="cancel-order-card">
        <h2>Cancel Order #{formData.orderId}</h2>
        
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Order ID</label>
            <input
              type="text"
              value={formData.orderId}
              readOnly
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="cancellationReason">
              Cancellation Reason *
            </label>
            <select
              id="cancellationReason"
              name="cancellationReason"
              value={formData.cancellationReason}
              onChange={handleInputChange}
              className="form-input"
              required
            >
              <option value="">Select a reason</option>
              <option value="Changed my mind">Changed my mind</option>
              <option value="Found a better option">Found a better option</option>
              <option value="Order taking too long">Order taking too long</option>
              <option value="Delivery issues">Delivery issues</option>
              <option value="Other">Other (please specify in comments)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="additionalComments">Additional Comments</label>
            <textarea
              id="additionalComments"
              name="additionalComments"
              value={formData.additionalComments}
              onChange={handleInputChange}
              className="form-input"
              rows="3"
              placeholder="Any additional details about the cancellation"
            />
          </div>

          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="acknowledgment"
              name="acknowledgment"
              checked={formData.acknowledgment}
              onChange={handleInputChange}
              required
            />
            <label htmlFor="acknowledgment">
              I acknowledge that this cancellation cannot be undone *
            </label>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Back
            </button>
            <button
              type="submit"
              className="btn btn-danger"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Confirm Cancellation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CancelOrder;