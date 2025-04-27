import React from "react";

import { AuthContext } from "./Context/AuthContext";
import { useContext } from "react";
import { Routes,Route } from "react-router-dom";

//system admin
import ResturantApproval from './Components/SystemAdmin/Approval/ResturantApproval';
import DeliveryPersonApproval from "./Components/SystemAdmin/Approval/DeliveryPersonApproval";
import AdminDashBoard from "./Components/SystemAdmin/AdminDashBoard/AdminDashBoard";
import RejectedResturants from "./Components/SystemAdmin/Rejected/RejectedResturants";

//customer
import Customer from "./Components/Customer/Customer";

//resturnat
import Resturant from "./Components/Resturant/Resturant";

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

function App(){

  
const {user} = useContext(AuthContext);

  return(
    <>
    <Header/>
    <Routes>
    {
      user ? (
        <>
        {
            user.role ==="SystemAdmin" && (
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
          user.role ==="Customer" &&(
            <Route path="/Customer" element={<Customer/>}/>
          ) 
        }

        {
          user.role==="ResturantAdmin" &&(
            <Route path='/ResturantAdmin' element={<Resturant/>}/>
          )
        }

        {
          user.role==="DeliveryPerson" &&(
            <Route path="/DeliveryPerson" element={<DeliveryPerson/>}/>
          )
        }
        </>
      ):(
      <>
        <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path='/register' element={<RegisterDirection />} />
            <Route path='/CustomerRegister' element={<CustomerRegister />} />
            <Route path='/DileveryPersonRegistration' element={<DileveryPersonRegistration />} />
            <Route path='/ResturantRegistration' element={<ResturantRegistration />} />
            <Route path='/payment-success' element={<PaymentSuccess/>}/>
            <Route path="/payment-cancel" element={<CancelPage/>}/>
            <Route path='/resturant-payment-success' element={<ResturantPaymentSuccess/>}/>
            <Route path='/resturant-payment-cancel' element={<ResturantPaymentCancel/>}/>
      </>
      )
      
    }
     </Routes>
    </>
  )

}

export default App;