const express = require("express");
const fetch = require("node-fetch");
require("dotenv").config();
const http = require("http");
const cors = require("cors");
const socketIo = require("socket.io");

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

app.use(cors());
app.use(express.json());

// API to toggle feed
app.post("/toggle-feed", async (req, res) => {
    const { feed, value } = req.body;
    if (!feed || (value !== 0 && value !== 1)) {
        return res.status(400).send("Invalid input");
    }

    try {
        const response = await fetch(`${BASE_URL}/${feed}/data`, {
            method: "POST",
            headers: { "X-AIO-Key": AIO_KEY, "Content-Type": "application/json" },
            body: JSON.stringify({ value: value.toString() })
        });

        if (!response.ok) {
            throw new Error(`Failed to update ${feed}. Status: ${response.status}`);
        }

        io.emit("feed-updated", { feed, value });  // Broadcast update to all clients
        res.status(200).json({ success: true, message: `${feed} updated to ${value}` });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Server error");
    }
});

// API to get last known feed status
app.get("/feed-status", async (req, res) => {
    const { feed } = req.query;
    if (!feed) return res.status(400).send("Feed parameter is required");

    try {
        const response = await fetch(`${BASE_URL}/${feed}/data/last`, {
            method: "GET",
            headers: { "X-AIO-Key": AIO_KEY }
        });

        if (!response.ok) throw new Error(`Failed to fetch ${feed} status`);

        const data = await response.json();
        res.json({ feed, value: data.value });
    } catch (error) {
        console.error("Error fetching feed status:", error);
        res.status(500).send("Server error");
    }
});

// Handle WebSocket connections
io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);
    socket.on("disconnect", () => console.log("Client disconnected:", socket.id));
});

// Start server
server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
