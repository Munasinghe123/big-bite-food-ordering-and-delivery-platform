const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripe = new Stripe('sk_test_51R7kKHCD9StWxqZANKHmBfSkSlNi30Ew9WbwFqFmIUdasadyQU0d9Qlb0xQoEtWB04IfY8mdIzrAw0WNZCCrNOkI004y3iUYSt') // Your Stripe Secret Key

// Route: POST /api/stripe/create-checkout-session
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { restaurantName} = req.body;

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'lkr', // Sri Lankan Rupees
            product_data: {
              name: 'Delivery Person Registration Fee',
              description: `Registration payment for ${restaurantName}`,
            },
            unit_amount: 50000, // amount in cents (50000 = Rs 500)
          },
          quantity: 1,
        },
      ],
      success_url: `http://localhost:5173/payment-success?restaurantName=${encodeURIComponent(restaurantName)}`,
      cancel_url: `http://localhost:5173/payment-cancel`,
    });

    res.status(200).json({ url: session.url });

  } catch (err) {
    console.error("Stripe Checkout Session Error:", err.message);
    res.status(500).json({ message: "Something went wrong creating Stripe checkout session." });
  }
});

router.post('/create-resturant-checkout-session', async (req, res) => {
  try {
    const { restaurantName } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'lkr',
            product_data: {
              name: 'Restaurant Registration Fee',
              description: `Registration payment for ${restaurantName}`,
            },
            unit_amount: 50000, // Rs. 500
          },
          quantity: 1,
        },
      ],
      success_url: `http://localhost:5173/resturant-payment-success?restaurantName=${encodeURIComponent(restaurantName)}`,
      cancel_url: `http://localhost:5173/resturant-payment-cancel`,
    });

    res.status(200).json({ url: session.url });

  } catch (err) {
    console.error("Stripe Checkout Session Error:", err.message);
    res.status(500).json({ message: "Something went wrong creating Stripe checkout session." });
  }
});



module.exports = router;
