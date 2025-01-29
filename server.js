const express = require('express');
const fetch = require('node-fetch');
require('dotenv').config();
const http = require('http');
const cors = require('cors');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*", // Allow frontend to connect
        methods: ["GET", "POST"]
    }
});

const port = process.env.PORT || 8080;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json());

// API endpoint to toggle the feed
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

        console.log(`Broadcasted update: ${feed} -> ${value}`);

        res.status(200).send(`${feed} updated to ${value}`);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Server error');
    }
});

// Handle WebSocket connections
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Start the server
server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
