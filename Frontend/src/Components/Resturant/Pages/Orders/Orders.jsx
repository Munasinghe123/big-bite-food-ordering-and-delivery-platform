import React, { useState, useEffect } from 'react';
import './Orders.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import { assets } from '../../../../assets/assets';
import Sidebar from '../../Sidebar/Sidebar';

const Orders = () => {
	const url = "http://localhost:5004";
	const url2 = "http://localhost:5000";

	const [orders, setOrders] = useState([]);

	const fetchAllOrders = async () => {
		try {
			const response = await axios.get(`${url2}/api/order/list`);
			if (response.data.success) {
				setOrders(response.data.data);
				console.log(response.data.data);
			} else {
				toast.error("Failed to fetch orders");
			}
		} catch (error) {
			toast.error("Error");
		}
	};

	const statusHandler = async (event, orderId) => {
		const newStatus = event.target.value;

		try {
			const response = await axios.put(`${url2}/api/order/${orderId}/status`, {
				orderStatus: newStatus
			});

			if (response.data.success) {
				await fetchAllOrders();
			}
		} catch (error) {
			console.error("Error")
		}
	}

	useEffect(() => {
		fetchAllOrders();
	}, []);

	const handleDownload = () => {
		window.open(`${url}/api/report/download-report`, '_blank');
	};

	return (
		<div className='layout8'>
			<div className='bar8'>
				<Sidebar />
			</div>

			<div className='order-add'>
				<h3>Order History</h3>
				<div>
					<button
						onClick={handleDownload}
						className='download-btn'
					>
						📄 Download PDF Report
					</button>
				</div>
				<div className='order-list'>
					{orders.map((order, index) => (
						<div key={index} className='order-item'>

							<img src={assets.parcel_icon} className='parcel-icon' alt='Parcel Icon' />

							<div>
								<p className='order-item-id'><strong>Order ID:</strong> {order.orderId}</p>
								<p className='order-customer-id'><strong>Customer ID:</strong> {order.customerId}</p>
								<p className='order-item-address'><strong>Payment Status:</strong> {order.paymentStatus}</p>
								<p className='order-item-address'><strong>Order Time:</strong> {new Date(order.orderTime).toLocaleString()}</p>
								<p className='order-item-phone'><strong>Order Status:</strong> {order.orderStatus}</p>
							</div>

							<p className='order-item-food'>
								<p>Menu Item x Quantity:</p>
								{order.items.map((item, itemIndex) => (
									<span key={itemIndex}>
										{item.itemName} x {item.quantity}
										{itemIndex !== order.items.length - 1 ? ', ' : ''}
									</span>
								))}
							</p>

							<p><strong>Rs.{order.totalAmount}</strong></p>

							<select onChange={(event) => statusHandler(event, order.orderId)} value={order.orderStatus}>
								<option value="" disabled selected>Pending</option>
								<option value="confirmed">Confirmed</option>
								<option value="preparing">Preparing</option>
								<option value="readyForPickup">Ready For Pickup</option>
								<option value="cancelled">Cancelled</option>
							</select>

						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default Orders;
