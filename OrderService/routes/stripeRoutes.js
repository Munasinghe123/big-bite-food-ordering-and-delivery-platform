const express = require('express');
const router = express.Router();
const Stripe = require('stripe');


const stripe = new Stripe('sk_test_51RHlmtPIEAGnbZzQif2Cof9KPE93wjkJg2dcI7BzI9lGiVoEULxHD92RtIwOYdnpdKoxaWQTeEmqvCZytgmZxs4e00MABbu6PM'); // << put your secret key here

router.post('/create-checkout-session', async (req, res) => {
  try {
      const { orderId, amount, customerEmail, customerName } = req.body;

      const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          mode: 'payment',
          line_items: [{
              price_data: {
                  currency: 'lkr',
                  product_data: {
                      name: `Order ${orderId}`,
                  },
                  unit_amount: Math.round(amount * 100),
              },
              quantity: 1,
          }],
          success_url: `http://localhost:30100/payment-success?orderId=${orderId}`,
          cancel_url: 'http://localhost:30100/payment-cancel',
          customer_email: customerEmail,
      });

      res.json({ url: session.url }); 

  } catch (error) {
      console.error('Stripe checkout error:', error);
      res.status(500).json({ error: error.message });
  }
});

module.exports = router;
