// Import necessary packages
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');

// Create the Express app and an HTTP server
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS settings to allow our frontend to connect
const io = socketio(server, {
    cors: {
        origin: "*", // Allow connections from any origin
        methods: ["GET", "POST"]
    }
});

// Use the CORS middleware for Express
app.use(cors());

// This function runs whenever a new client connects to our server
io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Listen for "send-location" events from this specific client
    socket.on("send-location", (data) => {
        // When a location is received, broadcast it to ALL connected clients
        // We include the sender's ID so clients know who the location belongs to
        io.emit("receive-location", { id: socket.id, ...data });
    });

    // Listen for the "disconnect" event for this client
    socket.on("disconnect", () => {
        console.log("A user disconnected:", socket.id);
        // Tell all other clients that this user has disconnected
        io.emit("user-disconnected", socket.id);
    });
});

// Define the port the server will run on. Use the one from the environment (for deployment) or 3000 for local development.
const PORT = process.env.PORT || 3000;

// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});