import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
//import './CancelOrder.css';

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

  // Fetch order details to verify cancellable status
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/orders/view/${id}`);
        setOrder(response.data);
      } catch (err) {
        console.error('Failed to fetch order:', err);
        setError('Failed to load order details. Please try again.');
      }
    };
    fetchOrder();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
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
    if (formData.cancellationReason.length < 5) {
      setError('Cancellation reason must be at least 5 characters long.');
      setLoading(false);
      return;
    }
    if (!formData.acknowledgment) {
      setError('You must acknowledge the cancellation.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:7003/driverRoutes/cancel-order', {
        orderId: formData.orderId,
        cancellationReason: formData.cancellationReason,
        additionalComments: formData.additionalComments,
        acknowledgment: formData.acknowledgment,
      });

      if (response.data.success) {
        alert('Order cancelled successfully!');
        navigate('/orders'); // Redirect to orders list or another page
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
    navigate(-1); // Go back to the previous page
  };

  if (!order) return <div className="loading">Loading order details...</div>;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Cancel Order #{id}</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="cancellationReason">
              Cancellation Reason <span className="required">*</span>
            </label>
            <textarea
              id="cancellationReason"
              name="cancellationReason"
              value={formData.cancellationReason}
              onChange={handleInputChange}
              className="form-input textarea"
              rows="4"
              maxLength="500"
              placeholder="Enter reason for cancellation"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="additionalComments">Additional Comments (Optional)</label>
            <textarea
              id="additionalComments"
              name="additionalComments"
              value={formData.additionalComments}
              onChange={handleInputChange}
              className="form-input textarea"
              rows="3"
              maxLength="1000"
              placeholder="Any additional comments"
            />
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="acknowledgment"
                checked={formData.acknowledgment}
                onChange={handleInputChange}
                className="checkbox"
                required
              />
              I acknowledge that this action cannot be undone{' '}
              <span className="required">*</span>
            </label>
          </div>
          <div className="form-actions">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Close
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Cancelling...' : 'Cancel Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CancelOrder;