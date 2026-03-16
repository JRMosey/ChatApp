import React, { useState, useEffect, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import Message from "./Message";
import Sidebar from "./Sidebar";

function Chat({ username, room, setConnected, setRoom, setUsername }) {
    const socket = useSocket();
    const [messages, setMessages] = useState([]);
    const [currentMessage, setCurrentMessage] = useState("");
    const [users, setUsers] = useState([]);
    const [showSidebar, setShowSidebar] = useState(false);
    const [activityLogs, setActivityLogs] = useState([]);

    const messagesEndRef = useRef(null);

    useEffect(() => {
        const handleReceiveMessage = (messageData) => {
            setMessages((prev) => [...prev, messageData]);
        };

        const handleRoomUsers = (updatedUsers) => {
            setUsers(updatedUsers);
        };

        const handleActivityLog = (log) => {
            setActivityLogs((prev) => [log, ...prev].slice(0, 5));
        };

        const handleActivityHistory = (history) => {
            setActivityLogs(history);
        };

        socket.on("receive_message", handleReceiveMessage);
        socket.on("room_users", handleRoomUsers);
        socket.on("activity_log", handleActivityLog);
        socket.on("activity_history", handleActivityHistory);

        return () => {
            socket.off("receive_message", handleReceiveMessage);
            socket.off("room_users", handleRoomUsers);
            socket.off("activity_log", handleActivityLog);
            socket.off("activity_history", handleActivityHistory);
        };
    }, [socket]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = () => {
        if (!currentMessage.trim()) return;

        const messageData = {
            room,
            author: username,
            message: currentMessage.trim(),
            time: new Date().toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
            }),
        };

        socket.emit("send_message", messageData);
        setCurrentMessage("");
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const leaveRoom = () => {
        socket.emit("leave_room", { username, room });

        setMessages([]);
        setUsers([]);
        setActivityLogs([]);
        setCurrentMessage("");
        setRoom("");
        setUsername("");
        setConnected(false);
    };

    return (
        <div className="chatWrapper">
            <Sidebar
                users={users}
                room={room}
                show={showSidebar}
                onClose={() => setShowSidebar(false)}
                activityLogs={activityLogs}
            />

            <div className="chatMain">
                <div className="chatHeader">
                    <button
                        className="sidebarToggle"
                        onClick={() => setShowSidebar(!showSidebar)}
                        title="Voir les participants"
                    >
                        <span></span><span></span><span></span>
                    </button>

                    <div className="chatHeaderInfo">
                        <div className="chatHeaderAvatar">
                            {room.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3>#{room}</h3>
                            <p>{users.length} participant{users.length > 1 ? "s" : ""}</p>
                        </div>
                    </div>

                    <button
                        className="leaveRoomBtn"
                        onClick={leaveRoom}
                        title="Quitter la salle"
                    >
                        Quitter la salle
                    </button>
                </div>

                <div className="messagesArea">
                    {messages.length === 0 && (
                        <div className="emptyChat">
                            <p>Aucun message pour l'instant.<br />Soyez le premier à écrire ! 👋</p>
                        </div>
                    )}

                    {messages.map((msg, index) => (
                        <Message key={index} msg={msg} username={username} />
                    ))}

                    <div ref={messagesEndRef} />
                </div>

                <div className="inputArea">
                    <input
                        type="text"
                        placeholder="Écrire un message..."
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        maxLength={500}
                    />
                    <button
                        className="sendBtn"
                        onClick={sendMessage}
                        disabled={!currentMessage.trim()}
                        title="Envoyer"
                    >
                        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Chat;