// server.js

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

app.use(cors({
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true
}));

app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: CLIENT_URL,
        methods: ["GET", "POST"],
        credentials: true
    }
});

const rooms = {
    "Generale": { users: [] },
    "Codding": { users: [] },
    "Support": { users: [] },
    "Entraide": { users: [] },
};

// Historique global des 5 derniers évènements
let activityHistory = [];

app.get("/", (req, res) => {
    res.send("Backend is running 🚀");
});

app.get("/rooms", (req, res) => {
    res.json(getRoomsList());
});

io.on("connection", (socket) => {
    console.log(`✅ Connecté : ${socket.id}`);

    socket.emit("rooms_list", getRoomsList());
    socket.emit("activity_history", activityHistory);

    socket.on("join_room", ({ username, room }) => {
        if (!rooms[room]) rooms[room] = { users: [] };

        socket.join(room);
        socket.currentRoom = room;
        socket.currentUsername = username;

        if (!rooms[room].users.find((u) => u.socketId === socket.id)) {
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

        const log = {
            username,
            action: "a rejoint",
            room,
            time: now(),
        };

        activityHistory = [log, ...activityHistory].slice(0, 5);
        io.emit("activity_log", log);
    });

    socket.on("create_room", ({ roomName }) => {
        const name = roomName.trim();
        if (!name || rooms[name]) return;

        rooms[name] = { users: [] };
        io.emit("rooms_list", getRoomsList());
    });

    socket.on("send_message", (data) => {
        io.to(data.room).emit("receive_message", data);
    });

    socket.on("leave_room", ({ username, room }) => {
        if (!room || !rooms[room]) return;

        rooms[room].users = rooms[room].users.filter(
            (u) => u.socketId !== socket.id
        );

        socket.leave(room);

        io.to(room).emit("receive_message", {
            author: "Système",
            message: `${username} a quitté la room 👋`,
            time: now(),
            system: true,
        });

        io.to(room).emit("room_users", rooms[room].users);
        io.emit("rooms_list", getRoomsList());

        const log = {
            username,
            action: "a quitté",
            room,
            time: now(),
        };

        activityHistory = [log, ...activityHistory].slice(0, 5);
        io.emit("activity_log", log);

        socket.currentRoom = null;
        socket.currentUsername = null;
    });

    socket.on("disconnect", () => {
        const room = socket.currentRoom;
        const username = socket.currentUsername;

        if (!room || !rooms[room] || !username) return;

        rooms[room].users = rooms[room].users.filter(
            (u) => u.socketId !== socket.id
        );

        io.to(room).emit("receive_message", {
            author: "Système",
            message: `${username} a quitté la room 👋`,
            time: now(),
            system: true,
        });

        io.to(room).emit("room_users", rooms[room].users);
        io.emit("rooms_list", getRoomsList());

        const log = {
            username,
            action: "a quitté",
            room,
            time: now(),
        };

        activityHistory = [log, ...activityHistory].slice(0, 5);
        io.emit("activity_log", log);
    });
});

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

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});