
import './AdminDashBoard.css'
import { Link } from 'react-router-dom';

function AdminDashBoard(){

    return(
        <div className="admin-panel">
            <h1>Admin DashBoard</h1>

            <div className='admin-pannel-container'>
                <Link to='/ResturantApproval'><button className='admin-btn'>Restaurant Approval Page</button></Link>
                <Link to='/DeliveryPersonApproval'><button className='admin-btn'>Delivery Person Approval</button></Link>
                <Link to='/RejectedResturants'><button className='admin-btn'>Rejected Restaurants</button></Link>
                <Link to="/allusers"><button className='admin-btn'>Manage user</button></Link>
                <Link to="/order-history"><button className='admin-btn'>View Order History</button></Link>
              
            </div>   
        </div>
    )
}

export default AdminDashBoard;