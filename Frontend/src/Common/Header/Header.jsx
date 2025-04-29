import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../Context/AuthContext";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faTimes } from "@fortawesome/free-solid-svg-icons";

import BigBiteLogo from "./BigBite.png";

import "./Header.css";

function Header() {
    const { user, logout } = useContext(AuthContext);

    const [isClicked, setIsClicked] = useState(false);

    const buttonClicked = () => {
        setIsClicked((prev) => !prev);
    };

    const handleLogout = () => {
        logout();
        setIsClicked(false);
    };

    return (
        <header className="header">
            <Link to="/" className="logo">
                <img src={BigBiteLogo} className="header-image" />
            </Link>

            <div className="menu-wrapper">
                <ul className="menu-items">
                    {user && user.role === "Customer" ? (
                        <>
                            <li>
                                <Link to="/Customer">Dashboard</Link>
                            </li>
                            <li>
                                <Link to={`/order-history/${user.name}`}>
                                    Order History
                                </Link>
                            </li>
                            <li>
                                <Link to="/profile">User Profile</Link>
                            </li>
                            <li>
                                <Link to="/contact">Contact</Link>
                            </li>
                        </>
                    ) : (
                        <>
                            <li>
                                <Link to="/">Home</Link>
                            </li>
                            <li>
                                <Link to="/menu">Menu</Link>
                            </li>
                            <li>
                                <Link to="/contact">Contact Us</Link>
                            </li>
                            <li>
                                <Link to="/register">Become a partner</Link>
                            </li>
                        </>
                    )}
                </ul>
            </div>

            {user ? (
                <div className="menu-container">
                    <button onClick={buttonClicked} className="menu-toggle">
                        <FontAwesomeIcon icon={isClicked ? faTimes : faBars} />
                    </button>
                    {isClicked && (
                        <div className="dropdown-menu">
                            <button
                                onClick={handleLogout}
                                className="logout-btn"
                            >
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="buttons">
                    <button className="register-btn">
                        <Link to="/CustomerRegister">Register</Link>
                    </button>
                    <button className="login-btn">
                        <Link to="/login">Login</Link>
                    </button>
                </div>
            )}
        </header>
    );
}

export default Header;