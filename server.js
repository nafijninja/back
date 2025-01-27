// server.js
const express = require('express');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// API endpoint to toggle the feed on Adafruit IO
app.post('/toggle-feed', async (req, res) => {
    const { feed, value } = req.body;

    if (!feed || (value !== 0 && value !== 1)) {
        return res.status(400).send('Invalid input');
    }

    const AIO_USERNAME = process.env.AIO_USERNAME;
    const AIO_KEY = process.env.AIO_KEY;
    const BASE_URL = `https://io.adafruit.com/api/v2/${AIO_USERNAME}/feeds`;

    try {
        const response = await fetch(`${BASE_URL}/${feed}/data`, {
            method: 'POST',
            headers: {
                'X-AIO-Key': AIO_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ value: value.toString() }),
        });

        if (!response.ok) {
            throw new Error(`Failed to update ${feed}. Status: ${response.status}`);
        }

        console.log(`${feed} updated to ${value}`);
        res.status(200).send(`${feed} updated to ${value}`);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Server error');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
