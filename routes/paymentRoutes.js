const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

// Generate M-Pesa access token
async function generateAccessToken() {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  try {
    const response = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );
    return response.data.access_token;
  } catch (error) {
    throw new Error('Failed to generate access token');
  }
}

// Format timestamp for M-Pesa
function formatTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

// Initiate payment
router.post('/pay', async (req, res) => {
  const { number, amount } = req.body;
  const logger = req.app.locals.logger;
  const pool = req.app.locals.pool;

  try {
    // Validate input
    if (!number || !amount) {
      return res.status(400).json({ error: 'Phone number and amount are required' });
    }

    const paymentId = uuidv4();
    const timestamp = formatTimestamp();
    const shortcode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

    // Generate access token
    const accessToken = await generateAccessToken();

    // Initiate STK Push
    const stkPushResponse = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: number,
        PartyB: shortcode,
        PhoneNumber: number,
        CallBackURL: `${req.protocol}://${req.get('host')}/api/callback`,
        AccountReference: paymentId,
        TransactionDesc: 'Coffee Shop Payment',
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Store payment details in database
    await pool.execute(
      'INSERT INTO payments (payment_id, number, amount, transaction_id) VALUES (?, ?, ?, ?)',
      [paymentId, number, amount, stkPushResponse.data.CheckoutRequestID]
    );

    logger.info(`Payment initiated for ${number} with amount ${amount}`);
    res.json({
      message: 'Payment initiated',
      payment_id: paymentId,
      checkout_request_id: stkPushResponse.data.CheckoutRequestID,
    });
  } catch (error) {
    logger.error('Payment initiation failed:', error);
    res.status(500).json({ error: 'Failed to initiate payment' });
  }
});

// Handle payment callback
router.post('/callback', async (req, res) => {
  const logger = req.app.locals.logger;
  const pool = req.app.locals.pool;

  try {
    const { Body: { stkCallback: { ResultDesc, CheckoutRequestID, CallbackMetadata } } } = req.body;

    if (ResultDesc === 'The service request is processed successfully.') {
      const amount = CallbackMetadata.Item.find(item => item.Name === 'Amount').Value;
      const mpesaReceiptNumber = CallbackMetadata.Item.find(item => item.Name === 'MpesaReceiptNumber').Value;
      const phoneNumber = CallbackMetadata.Item.find(item => item.Name === 'PhoneNumber').Value;

      // Update payment status in database
      await pool.execute(
        'UPDATE payments SET transaction_id = ?, status = ? WHERE transaction_id = ?',
        [mpesaReceiptNumber, 'completed', CheckoutRequestID]
      );

      logger.info(`Payment completed for ${phoneNumber} with receipt ${mpesaReceiptNumber}`);
    } else {
      await pool.execute(
        'UPDATE payments SET status = ? WHERE transaction_id = ?',
        ['failed', CheckoutRequestID]
      );
      logger.warn(`Payment failed for transaction ${CheckoutRequestID}`);
    }

    res.json({ message: 'Callback processed' });
  } catch (error) {
    logger.error('Callback processing failed:', error);
    res.status(500).json({ error: 'Failed to process callback' });
  }
});

module.exports = router; 