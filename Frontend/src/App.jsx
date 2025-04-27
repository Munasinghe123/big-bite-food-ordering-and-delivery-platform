import React from "react";

import { AuthContext } from "./Context/AuthContext";
import { useContext } from "react";
import { Routes, Route } from "react-router-dom";

//system admin
import ResturantApproval from './Components/SystemAdmin/Approval/ResturantApproval';
import DeliveryPersonApproval from "./Components/SystemAdmin/Approval/DeliveryPersonApproval";
import AdminDashBoard from "./Components/SystemAdmin/AdminDashBoard/AdminDashBoard";
import RejectedResturants from "./Components/SystemAdmin/Rejected/RejectedResturants";

//customer
import Customer from "./Components/Customer/Customer";
import PaymentSuccessC from "./Components/Customer/PaymentSuccess";
import PaymentCancelC from "./Components/Customer/PaymentCancel";
import OrderDetails from './Components/Customer/OrderDetails';
import OrderHistory from './Components/Customer/OrderHistory';

//resturnat
import Dashboard from "./Components/Resturant/Pages/Dashboard/Dashboard";
import Menulists from "./Components/Resturant/Pages/Menulists/Menulists";
import AddMenu from "./Components/Resturant/Pages/AddMenu/Addmenu";
import UpdateMenu from "./Components/Resturant/Pages/UpdateMenu/UpdateMenu";
import Orders from "./Components/Resturant/Pages/Orders/Orders";
import UpdateRestaurant from "./Components/Resturant/Pages/UpdateRestaurant/UpdateRestaurant";

//delivery Person
import DeliveryPerson from "./Components/DeliveryPerson/DeliveryPerson";


//common
import LandingPage from "./Common/LandingPage/LandingPage";
import Login from "./Common/Login/Login";
import Header from "./Common/Header/Header";
import RegisterDirection from './Common/Register/RegisterDirection/RegisterDirection'
import CustomerRegister from './Common/Register/CustomerRegistration/CustomerRegister'
import DileveryPersonRegistration from './Common/Register/DileveryPersonRegistration/DileveryPersonRegistration'
import ResturantRegistration from './Common/Register/ResturantRegistration/ResturantRegistration'

import PaymentSuccess from "./Common/Register/DileveryPersonRegistration/PaymentSuccess";
import CancelPage from './Common/Register/DileveryPersonRegistration/PaymentCancel';

import ResturantPaymentCancel from "./Common/Register/ResturantRegistration/ResturantPaymentCancel";
import ResturantPaymentSuccess from "./Common/Register/ResturantRegistration/ResturantPaymentSuccess";

function App() {

  const { user } = useContext(AuthContext);

  return (
    <>
      <Header />
      <Routes>
        {
          user ? (
            <>
              {
                user.role === "SystemAdmin" && (
                  <>
                    <Route path="/ResturantApproval" element={<ResturantApproval/>}/>
                    <Route path="/DeliveryPersonApproval" element={<DeliveryPersonApproval/>}/>
                    <Route path="/AdminDashBoard" element={<AdminDashBoard/>}/>
                    <Route path='/register' element={<RegisterDirection />} />
                    <Route path='/DileveryPersonRegistration' element={<DileveryPersonRegistration />} />
                    <Route path='/ResturantRegistration' element={<ResturantRegistration />} />
                    <Route path="/RejectedResturants" element={<RejectedResturants/>}/>

                  </>

                )
              }

              {
                user.role === "Customer" && (
                  <>
                  <Route path="/Customer" element={<Customer/>}/>
                  <Route path="/payment-success" element={<PaymentSuccessC />} />
                  <Route path="/payment-cancel" element={<PaymentCancelC />} />
                  <Route path="/order-details/:id" element={<OrderDetails />} />
                  <Route path="/order-history/:username" element={<OrderHistory />} />
                  </>
                )
              }

              {
                user.role === "ResturantAdmin" && (
                  <>
                    <Route path="/ResturantAdmin" element={<Dashboard />} />
                    <Route path="/addmenu" element={<AddMenu />} />
                    <Route path="/update/:id" element={<UpdateMenu />} />
                    <Route path="/menulists" element={<Menulists />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/updaterestaurant/:id" element={<UpdateRestaurant />} />
                  </>
                )
              }

              {
                user.role === "DeliveryPerson" && (
                  <Route path="/DeliveryPerson" element={<DeliveryPerson />} />
                )
              }
            </>
          ) : (
            <>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path='/register' element={<RegisterDirection />} />
              <Route path='/CustomerRegister' element={<CustomerRegister />} />
              <Route path='/DileveryPersonRegistration' element={<DileveryPersonRegistration />} />
              <Route path='/ResturantRegistration' element={<ResturantRegistration />} />
              <Route path='/payment-success' element={<PaymentSuccess />} />
              <Route path="/payment-cancel" element={<CancelPage />} />
              <Route path='/resturant-payment-success' element={<ResturantPaymentSuccess />} />
              <Route path='/resturant-payment-cancel' element={<ResturantPaymentCancel />} />
            </>
          )

        }
      </Routes>
    </>
  )

}

export default App;