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
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const port = process.env.PORT || 8080;
const AIO_USERNAME = process.env.AIO_USERNAME;
const AIO_KEY = process.env.AIO_KEY;
const BASE_URL = `https://io.adafruit.com/api/v2/${AIO_USERNAME}/feeds`;

// Middleware
app.use(cors());
app.use(express.json());

// ✅ Fix: Add root route to confirm backend is running
app.get('/', (req, res) => {
    res.send('<h2>Backend is live. Created by Nafij YT.</h2>');
});

// API to toggle feed state
app.post('/toggle-feed', async (req, res) => {
    const { feed, value } = req.body;

    if (!feed || (value !== 0 && value !== 1)) {
        return res.status(400).send('Invalid input');
    }

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

        // Emit real-time update to clients
        io.emit('feed-updated', { feed, value });

        res.status(200).send(`${feed} updated to ${value}`);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Server error');
    }
});

// API to get current feed status
app.get('/feed-status', async (req, res) => {
    const { feed } = req.query;

    if (!feed) {
        return res.status(400).send('Feed name required');
    }

    try {
        const response = await fetch(`${BASE_URL}/${feed}/data/last`, {
            headers: { 'X-AIO-Key': AIO_KEY }
        });

        if (!response.ok) {
            throw new Error(`Failed to get ${feed} status.`);
        }

        const data = await response.json();
        res.json({ feed, value: parseInt(data.value) });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Server error');
    }
});

// WebSocket connection
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Start server
server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
