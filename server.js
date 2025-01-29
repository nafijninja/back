const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors'); // Enable CORS
require('dotenv').config();
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const port = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use(cors()); // Allow cross-origin requests

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

        // Emit the feed update to connected clients
        io.emit('feed-updated', { feed, value });

        res.status(200).send(`${feed} updated to ${value}`);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Server error');
    }
});

// Test route for checking server status
app.get('/', (req, res) => {
    res.send('Backend is live!');
});

// Handle WebSocket connections
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Start the server
server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
