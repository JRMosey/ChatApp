// server.js

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const os = require("os");

const app = express();

/*
────────────────────────────────────────────
 CORS CONFIGURATION
Autorise uniquement ton frontend (Vercel)
En local → fonctionne aussi si CLIENT_URL n'est pas défini
────────────────────────────────────────────
*/

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

app.use(cors({
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true
}));

app.use(express.json());

const server = http.createServer(app);

/*
────────────────────────────────────────────
🔌 SOCKET.IO CONFIGURATION
Même configuration CORS que Express
────────────────────────────────────────────
*/

const io = new Server(server, {
    cors: {
        origin: CLIENT_URL,
        methods: ["GET", "POST"],
        credentials: true
    }
});

/*
────────────────────────────────────────────
 ROOMS PRÉDÉFINIES
────────────────────────────────────────────
*/

const rooms = {
    "Generale": { users: [] },
    "Codding": { users: [] },
    "Support": { users: [] },
    "Entraide": { users: [] },
};

/*
────────────────────────────────────────────
 ROUTE TEST (évite "Cannot GET /")
────────────────────────────────────────────
*/

app.get("/", (req, res) => {
    res.send("Backend is running 🚀");
});

/*
────────────────────────────────────────────
ROUTE REST : Liste des rooms
────────────────────────────────────────────
*/

app.get("/rooms", (req, res) => {
    res.json(getRoomsList());
});

/*
────────────────────────────────────────────
⚡ SOCKET EVENTS
────────────────────────────────────────────
*/

io.on("connection", (socket) => {
    console.log(`✅ Connecté : ${socket.id}`);

    socket.emit("rooms_list", getRoomsList());

    // Rejoindre une room
    socket.on("join_room", ({ username, room }) => {
        if (!rooms[room]) rooms[room] = { users: [] };

        socket.join(room);
        socket.currentRoom = room;
        socket.currentUsername = username;

        if (!rooms[room].users.find(u => u.socketId === socket.id)) {
            rooms[room].users.push({ socketId: socket.id, username });
        }

        io.to(room).emit("receive_message", {
            author: "Système",
            message: `${username} a rejoint la room 💬`,
            time: now(),
            system: true,
        });

        io.to(room).emit("room_users", rooms[room].users);
        io.emit("rooms_list", getRoomsList());
    });

    // Créer une room
    socket.on("create_room", ({ roomName }) => {
        const name = roomName.trim();
        if (!name || rooms[name]) return;

        rooms[name] = { users: [] };
        io.emit("rooms_list", getRoomsList());
    });

    // Envoyer message
    socket.on("send_message", (data) => {
        io.to(data.room).emit("receive_message", data);
    });

    // Déconnexion
    socket.on("disconnect", () => {
        const room = socket.currentRoom;
        const username = socket.currentUsername;
        if (!room || !rooms[room]) return;

        rooms[room].users = rooms[room].users.filter(
            u => u.socketId !== socket.id
        );

        io.to(room).emit("receive_message", {
            author: "Système",
            message: `${username} a quitté la room 👋`,
            time: now(),
            system: true,
        });

        io.to(room).emit("room_users", rooms[room].users);
        io.emit("rooms_list", getRoomsList());
    });
});

/*
────────────────────────────────────────────
HELPERS
────────────────────────────────────────────
*/

function now() {
    return new Date().toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit"
    });
}

function getRoomsList() {
    return Object.entries(rooms).map(([name, data]) => ({
        name,
        count: data.users.length,
    }));
}

/*
────────────────────────────────────────────
 SERVER START
Render fournit automatiquement process.env.PORT
────────────────────────────────────────────
*/

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(` Server running on port ${PORT}`);
});
