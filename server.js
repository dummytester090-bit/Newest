// backend/server.js
const express = require('express');
const cors = require('cors');
const { randomBytes } = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

// POST endpoint for key generation
app.post('/generatekey', (req, res) => {
    const { validityMinutes, maxUses } = req.body;

    if (!validityMinutes || !maxUses) {
        return res.json({ success: false, error: 'Invalid request' });
    }

    const key = randomBytes(8).toString('hex'); // generate random key
    res.json({ success: true, key });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Halurea key backend is running on port ${PORT}`));
