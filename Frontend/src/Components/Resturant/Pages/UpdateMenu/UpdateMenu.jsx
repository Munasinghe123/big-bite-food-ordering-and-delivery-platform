import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './UpdateMenu.css';
import { assets } from '../../../../assets/assets';
import Sidebar from '../../Sidebar/Sidebar';

const UpdateMenu = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const url = 'http://localhost:30504';

	const [data, setData] = useState({
		name: '',
		description: '',
		price: '',
		category: '',
		restaurantId: ''
	});

	const [currentImage, setCurrentImage] = useState('');
	const [newImage, setNewImage] = useState(null);

	useEffect(() => {
		const fetchMenu = async () => {
			try {
				const res = await axios.get(`${url}/api/menu/list/${id}`);
				if (res.data.success && res.data.data) {
					const { name, description, price, category, restaurantId, image } = res.data.data;

					setData({
						name: name || '',
						description: description || '',
						price: price || '',
						category: category || '',
						restaurantId: restaurantId || ''
					});
					setCurrentImage(image || '');
				} else {
					toast.error('Failed to fetch menu item');
				}
			} catch (error) {
				console.error(error);
				toast.error('Server error');
			}
		};

		fetchMenu();
	}, [id]);

	const onChangeHandler = (e) => {
		const { name, value } = e.target;
		setData(prev => ({ ...prev, [name]: value }));
	};

	const onSubmitHandler = async (e) => {
		e.preventDefault();

		const formData = new FormData();
		formData.append('name', data.name);
		formData.append('description', data.description);
		formData.append('price', data.price);
		formData.append('category', data.category);
		formData.append('restaurantId', data.restaurantId);
		if (newImage) {
			formData.append('image', newImage);
		}

		try {
			const res = await axios.put(`${url}/api/menu/update/${id}`, formData, {
				headers: {
					'Content-Type': 'multipart/form-data'
				}
			});

			if (res.data.success) {
				toast.success('Menu item updated successfully');
				navigate('/menulists');
			} else {
				toast.error('Failed to update menu item');
			}
		} catch (error) {
			console.error(error);
			toast.error('Server error');
		}
	};

	return (
		<div className='layout5'>
			<div className='bar5'>
				<Sidebar />
			</div>

			<div className='update2'>
				<h3>Update Menu</h3><br />
				<form className='flex-col' onSubmit={onSubmitHandler}>
					<div className='update-img-upload2 flex-col'>
						<p>Upload Image</p>
						<label htmlFor='image'>
							<img
								src={
									newImage
										? URL.createObjectURL(newImage)
										: currentImage
											? `${url}/images/${currentImage}`
											: assets.upload_icon
								}
								alt='Menu'
							/>
						</label>
						<input
							type='file'
							id='image'
							hidden
							onChange={(e) => setNewImage(e.target.files[0])}
						/>
					</div>

					<div className='update-product-name flex-col'>
						<p>Restaurant ID</p>
						<input
							onChange={onChangeHandler}
							value={data.restaurantId || ''}
							type='text'
							name='restaurantId'
							placeholder='Enter Restaurant ID'
							required
						/>

						<p>Product Name</p>
						<input
							type='text'
							name='name'
							placeholder='Enter Product Name'
							value={data.name || ''}
							onChange={onChangeHandler}
							required
						/>
					</div>

					<div className='update-product-description flex-col'>
						<p>Product Description</p>
						<textarea
							name='description'
							rows='10'
							placeholder='Enter Product Description'
							value={data.description || ''}
							onChange={onChangeHandler}
							required
						></textarea>
					</div>

					<div className='update-category-price'>
						<div className='update-category flex-col'>
							<p>Category</p>
							<select
								name='category'
								value={data.category || ''}
								onChange={onChangeHandler}
								required
							>
								<option value=''>Select Category</option>
								<option value='Sides'>Sides</option>
								<option value='Pizza'>Pizza</option>
								<option value='Dessert'>Dessert</option>
								<option value='Beverage'>Beverage</option>
								<option value='Soup'>Soup</option>
								<option value='Dish'>Dish</option>
							</select>
						</div>

						<div className='update-price flex-col'>
							<p>Price (Rs.)</p>
							<input
								type='number'
								name='price'
								placeholder='Enter Price'
								value={data.price || ''}
								onChange={onChangeHandler}
								required
							/>
						</div>
					</div>

					<button type='submit' className='update-btn2'>UPDATE</button>
				</form>
			</div>
		</div>
	);
};

export default UpdateMenu;
