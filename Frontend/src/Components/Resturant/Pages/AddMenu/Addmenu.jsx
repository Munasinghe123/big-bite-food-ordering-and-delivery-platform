import React, { useState } from 'react';
import './AddMenu.css';
import { assets } from '../../../../assets/assets';
import axios from 'axios';
import { toast } from 'react-toastify';
import Sidebar from '../../Sidebar/Sidebar';

const Addmenu = () => {
	const url = "http://localhost:30504";

	const [image, setImage] = useState(null);
	const [data, setData] = useState({
		name: "",
		description: "",
		category: "",
		price: ""
	});

	const onChangeHandler = (event) => {
		const { name, value } = event.target;
		setData({ ...data, [name]: value });
	};

	const onSubmitHandler = async (event) => {
		event.preventDefault();

		if (!image) {
			toast.error("Please upload an image.");
			return;
		}

		const formData = new FormData();
		formData.append('image', image);
		formData.append('name', data.name);
		formData.append('description', data.description);
		formData.append('category', data.category);
		formData.append('price', Number(data.price));
		formData.append('restaurantId', data.restaurantId);

		try {
			const response = await axios.post(`${url}/api/menu/add`, formData);
			if (response.data.success) {
				setData({
					name: "",
					description: "",
					category: "",
					price: ""
				});
				setImage(null);
				toast.success(response.data.message);
			} else {
				toast.error(response.data.message);
			}
		} catch (error) {
			console.error('Error submitting form:', error);
			toast.error("Something went wrong while adding food.");
		}
	};

	return (
		<div className='layout3'>
			<div className='bar3'>
				<Sidebar />
			</div>

			<div className='add2'>
				<h3>Add Menu</h3><br />
				<form className='flex-col' onSubmit={onSubmitHandler}>
					<div className='add-img-upload2 flex-col'>
						<p>Upload Image</p>
						<label htmlFor='image'>
							<img src={image ? URL.createObjectURL(image) : assets.upload_icon} alt='' />
						</label>
						<input
							onChange={(e) => setImage(e.target.files[0])}
							type='file'
							id='image'
							hidden
							required
						/>
					</div>
					<div className='add-product-name flex-col'>
						<p>Restaurant ID</p>
						<input
							onChange={onChangeHandler}
							value={data.restaurantId}
							type='text'
							name='restaurantId'
							placeholder='Enter Restaurant ID'
							required
						/>
						<p>Product Name</p>
						<input
							onChange={onChangeHandler}
							value={data.name}
							type='text'
							name='name'
							placeholder='Enter Product Name'
							required
						/>
					</div>
					<div className="add-product-description flex-col">
						<p>Product Description</p>
						<textarea
							onChange={onChangeHandler}
							value={data.description}
							name='description'
							rows='10'
							placeholder='Enter Product Description'
							required
						></textarea>
					</div>
					<div className='add-category-price'>
						<div className='add-category flex-col'>
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

						<div className='add-price flex-col'>
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
					<button type='submit' className='add-btn2'>Add Menu</button>
				</form>
			</div>

		</div>

	);
};

export default Addmenu;
