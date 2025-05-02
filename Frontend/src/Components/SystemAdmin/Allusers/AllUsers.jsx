import { useEffect, useState } from "react";
import axios from 'axios';
import "./AllUsers.css";

function AllUsers() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await axios.get(
          "http://localhost:30101/api/users/getallusers",
          { withCredentials: true }
        );
        setUsers(data.allUsers);
      } catch (err) {
        console.error(err);
        alert("Failed to fetch users");
      }
    };
    fetchUsers();
  }, []);

  const customers      = users.filter(u => u.role === "Customer");
  const deliveryPeople = users.filter(u => u.role === "DeliveryPerson");
  const restAdmins     = users.filter(u => u.role === "ResturantAdmin");

  return (
    <div className="all-users-container">
      <h1>All Users</h1>

      {/* Customers */}
      <section className="user-section">
        <h2>Customers</h2>
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
            </tr>
          </thead>
          <tbody>
            {customers.length > 0 ? (
              customers.map(u => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.phone || "—"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3}>No customers found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* Delivery Persons */}
      <section className="user-section">
        <h2>Delivery Persons</h2>
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
            </tr>
          </thead>
          <tbody>
            {deliveryPeople.length > 0 ? (
              deliveryPeople.map(u => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.phone}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3}>No delivery persons found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* Restaurant Admins */}
      <section className="user-section">
        <h2>Restaurant Admins</h2>
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Restaurant Name</th>
            </tr>
          </thead>
          <tbody>
            {restAdmins.length > 0 ? (
              restAdmins.map(u => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.resturantName}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2}>No restaurant admins found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default AllUsers;
