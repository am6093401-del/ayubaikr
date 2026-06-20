// server.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = 3000;
const PI_API_KEY = "YOUR_PI_API_KEY_HERE"; // From Pi Developer Portal
const PI_BASE_URL = "https://api.minepi.com";

// In-memory storage (use DB in production)
const transactions = [];

app.post('/api/payment/approve', async (req, res) => {
  const { paymentId } = req.body;
  try {
    const response = await axios.post(
      `\( {PI_BASE_URL}/v2/payments/ \){paymentId}/approve`,
      {},
      { headers: { Authorization: `Bearer ${PI_API_KEY}` } }
    );
    console.log("Payment approved:", paymentId);
    res.json({ status: "approved" });
  } catch (error) {
    console.error(error.response?.data || error);
    res.status(500).json({ error: "Approval failed" });
  }
});

app.post('/api/payment/complete', async (req, res) => {
  const { paymentId, txid } = req.body;
  try {
    await axios.post(
      `\( {PI_BASE_URL}/v2/payments/ \){paymentId}/complete`,
      { txid },
      { headers: { Authorization: `Bearer ${PI_API_KEY}` } }
    );
    transactions.push({ id: paymentId, txid, time: new Date(), amount: req.body.amount });
    console.log("Payment completed:", txid);
    res.json({ status: "completed" });
  } catch (error) {
    res.status(500).json({ error: "Completion failed" });
  }
});

app.get('/api/transactions', (req, res) => {
  res.json(transactions);
});

app.listen(PORT, () => {
  console.log(`✅ Ayubaikr Backend running on http://localhost:${PORT}`);
});