// server.js
const express = require('express');
const cors = require('cors');
const { randomBytes } = require('crypto');
const admin = require('firebase-admin');

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 Initialize Firebase Admin from ENV
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://halurea1.firebaseio.com"
});

const db = admin.database();

// Mapping keyType to validity & uses
const keySettings = {
    basic: { validityMinutes: 10, maxUses: 1 },
    standard: { validityMinutes: 30, maxUses: 2 },
    good: { validityMinutes: 60, maxUses: 8 }
};

// ✅ Generate Key
app.post('/generatekey', async (req, res) => {
    const { keyType } = req.body;

    if (!keyType || !keySettings[keyType]) {
        return res.json({ success: false, error: 'Invalid key type' });
    }

    const { validityMinutes, maxUses } = keySettings[keyType];
    const key = randomBytes(8).toString('hex');
    const expiry = Date.now() + validityMinutes * 60 * 1000;

    try {
        const ref = db.ref('keys').push();
        await ref.set({
            key,
            keyType,
            expiry,
            maxUses,
            used: 0,
            createdAt: Date.now()
        });

        res.json({ success: true, key, maxUses });
    } catch (err) {
        console.error(err);
        res.json({ success: false, error: 'Database error' });
    }
});

// ✅ Validate / Use Key
app.post('/usekey', async (req, res) => {
    const { key } = req.body;

    if (!key) return res.json({ success: false, error: 'No key provided' });

    try {
        const snapshot = await db.ref('keys').once('value');
        let found = null;
        let refKey = null;

        snapshot.forEach(child => {
            const data = child.val();
            if (data.key === key) {
                found = data;
                refKey = child.ref;
            }
        });

        if (!found) return res.json({ success: false, error: 'Invalid key' });

        // Expired
        if (Date.now() > found.expiry) {
            await refKey.remove();
            return res.json({ success: false, error: 'Key expired' });
        }

        // Used up
        if (found.used >= found.maxUses) {
            await refKey.remove();
            return res.json({ success: false, error: 'Key fully used' });
        }

        // ✅ Increase usage
        await refKey.update({ used: found.used + 1 });
        res.json({ success: true, remainingUses: found.maxUses - (found.used + 1) });

    } catch (err) {
        console.error(err);
        res.json({ success: false, error: 'Server error' });
    }
});

// ✅ Auto cleanup expired/used keys
setInterval(async () => {
    try {
        const snapshot = await db.ref('keys').once('value');
        snapshot.forEach(child => {
            const data = child.val();
            if (!data) return;
            if (Date.now() > data.expiry || data.used >= data.maxUses) {
                child.ref.remove();
            }
        });
        console.log("Cleanup done");
    } catch (err) {
        console.error("Cleanup error:", err);
    }
}, 60000); // every 60s

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Halurea Key Backend running on port ${PORT}`));
