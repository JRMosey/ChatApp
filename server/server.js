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
    "Generale": { users: [], password: "" },
    "Codding": { users: [], password: "" },
    "Support": { users: [], password: "" },
    "Entraide": { users: [], password: "" },
};

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

    socket.on("join_room", ({ username, room, password }, callback) => {
        if (!rooms[room]) {
            rooms[room] = { users: [], password: "" };
        }

        const roomPassword = rooms[room].password || "";

        if (roomPassword && roomPassword !== (password || "")) {
            if (callback) {
                callback({
                    ok: false,
                    message: "Mot de passe incorrect pour cette salle."
                });
            }
            return;
        }

        socket.join(room);
        socket.currentRoom = room;
        socket.currentUsername = username;

        if (!rooms[room].users.find((u) => u.socketId === socket.id)) {
            rooms[room].users.push({ socketId: socket.id, username });
        }

        if (callback) {
            callback({
                ok: true,
                room
            });
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

    socket.on("create_room", ({ roomName, password }) => {
        const name = roomName.trim();
        if (!name || rooms[name]) return;

        rooms[name] = {
            users: [],
            password: (password || "").trim()
        };

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
        protected: !!data.password,
    }));
}

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});