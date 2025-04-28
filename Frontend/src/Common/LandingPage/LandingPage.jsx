import React from 'react'
import './LandingPage.css'
import { Link } from 'react-router-dom'

function LandingPage() {
    return (
        <div className='landing-page-container'>
            <section className='hero-section'>
                <h2 className='hero-heading'>Order. Eat. Repeat!!!</h2>
                <p className='hero-paragraph'>Delicious meals, delivered fast to your doorstep.</p>
                <Link to="/menu" className="hero-button">Order Now</Link>
            </section>

            <section className='features-section'>
                <div className='feature-card'>
                    <h3>Fresh Food</h3>
                    <p>We deliver freshly prepared meals with top quality ingredients.</p>
                </div>

                <div className='feature-card'>
                    <h3>Track Your Delivery</h3>
                    <p>Stay updated in real-time with our smart delivery tracking system.</p>
                </div>

                <div className='feature-card'>
                    <h3>Secure Payments</h3>
                    <p>Experience fast and secure payments with trusted gateways.</p>
                </div>
            </section>
        </div>
    )
}

export default LandingPage
