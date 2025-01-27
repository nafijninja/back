
const express = require('express');
const dotenv = require('dotenv');
const fetch = require('node-fetch');

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Adafruit IO credentials from environment variables
const AIO_USERNAME = process.env.AIO_USERNAME;
const AIO_KEY = process.env.AIO_KEY;
const BASE_URL = `https://io.adafruit.com/api/v2/${AIO_USERNAME}/feeds`;

// Middleware to parse JSON
app.use(express.json());

// Route to toggle feed value
app.post('/toggle-feed/:feed/:value', async (req, res) => {
    const { feed, value } = req.params;
    
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
            throw new Error(`Failed to update feed. Status: ${response.status}`);
        }

        res.status(200).json({ message: `${feed} updated to ${value}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Test route
app.get('/', (req, res) => {
    res.send('Backend server is running!');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
