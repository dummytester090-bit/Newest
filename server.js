const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const app = express();
const port = process.env.PORT || 3000;

// Temporary in-memory DB
const keysDB = {};

app.use(cors());
app.use(express.json());

app.post('/generateKey', (req, res) => {
  const { validityMinutes, maxUses } = req.body;
  if (!validityMinutes || !maxUses) return res.status(400).json({ success: false, error: 'Missing validityMinutes or maxUses' });

  try {
    const key = crypto.randomBytes(16).toString('hex');
    const expiry = Date.now() + validityMinutes * 60 * 1000;

    keysDB[key] = { expiry, remainingUses: maxUses, used: false, createdAt: Date.now() };

    res.json({ success: true, key });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.listen(port, () => console.log(`Backend server running on port ${port}`));
