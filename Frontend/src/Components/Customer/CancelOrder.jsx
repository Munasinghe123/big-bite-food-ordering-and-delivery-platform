import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CancelOrder.css';

function CancelOrder() {
  const { id } = useParams(); // Auto-fetch orderId from URL
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    orderId: id,
    cancellationReason: '',
    additionalComments: '',
    acknowledgment: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Validate orderId on mount
    if (!id) {
      setError('Invalid order ID');
    }
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.cancellationReason) {
      setError('Cancellation reason is required');
      return;
    }
    if (!formData.acknowledgment) {
      setError('You must acknowledge the cancellation');
      return;
    }
    if (formData.cancellationReason.length < 5) {
      setError('Cancellation reason must be at least 5 characters');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await axios.post(


        `http://localhost:30703/driverRoutes/cancel-order/${id}`,

        {
          orderId: formData.orderId,
          cancellationReason: formData.cancellationReason,
          additionalComments: formData.additionalComments,
          acknowledgment: formData.acknowledgment,
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        alert('Order cancelled successfully');
        navigate('/orders'); // Redirect to orders list or another page
      } else {
        setError(response.data.message || 'Failed to cancel order');
      }
    } catch (err) {
      console.error('Error cancelling order:', err);
      setError(err.response?.data?.message || 'An error occurred while cancelling the order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cancel-order-container">
      <h2>Cancel Order</h2>
      <div className="form-group">
        <label htmlFor="orderId">Order ID</label>
        <input
          type="text"
          id="orderId"
          name="orderId"
          value={formData.orderId}
          disabled
        />
      </div>
      <div className="form-group">
        <label htmlFor="cancellationReason">Cancellation Reason *</label>
        <textarea
          id="cancellationReason"
          name="cancellationReason"
          value={formData.cancellationReason}
          onChange={handleInputChange}
          placeholder="Enter reason for cancellation (min 5 characters)"
          maxLength="500"
        />
      </div>
      <div className="form-group">
        <label htmlFor="additionalComments">Additional Comments</label>
        <textarea
          id="additionalComments"
          name="additionalComments"
          value={formData.additionalComments}
          onChange={handleInputChange}
          placeholder="Any additional comments (optional)"
          maxLength="1000"
        />
      </div>
      <div className="form-group checkbox-group">
        <input
          type="checkbox"
          id="acknowledgment"
          name="acknowledgment"
          checked={formData.acknowledgment}
          onChange={handleInputChange}
        />
        <label htmlFor="acknowledgment">
          I acknowledge that this cancellation is final *
        </label>
      </div>
      {error && <p className="error-message">{error}</p>}
      <div className="button-group">
        <button
          className="submit-button"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit Cancellation'}
        </button>
        <button
          className="back-button"
          onClick={() => navigate(`/order-details/${id}`)}
          disabled={loading}
        >
          Back
        </button>
      </div>
    </div>
  );
}

export default CancelOrder;