import React, { useState, useEffect } from "react";
import { useSocket } from "../context/SocketContext";

function Join({ username, setUsername, room, setRoom, setConnected }) {
    const socket = useSocket();

    const [roomsList, setRoomsList] = useState([]);
    const [newRoomName, setNewRoomName] = useState("");
    const [newRoomPassword, setNewRoomPassword] = useState("");
    const [joinPassword, setJoinPassword] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [selectedProtectedRoom, setSelectedProtectedRoom] = useState(null);

    useEffect(() => {
        const handleRoomsList = (list) => {
            setRoomsList(list);
        };

        if (!socket.connected) {
            socket.connect();
        }

        socket.on("rooms_list", handleRoomsList);

        return () => {
            socket.off("rooms_list", handleRoomsList);
        };
    }, [socket]);

    const joinRoom = (selectedRoom, providedPassword = "") => {
        const roomToJoin = selectedRoom || room;

        if (!username.trim() || !roomToJoin.trim()) return;

        setErrorMessage("");

        const doJoin = () => {
            socket.emit(
                "join_room",
                {
                    username: username.trim(),
                    room: roomToJoin.trim(),
                    password: providedPassword,
                },
                (response) => {
                    if (!response || !response.ok) {
                        setErrorMessage(
                            response?.message || "Impossible de rejoindre la salle."
                        );
                        setConnected(false);
                        return;
                    }

                    setRoom(response.room);
                    setJoinPassword("");
                    setSelectedProtectedRoom(null);
                    setConnected(true);
                }
            );
        };

        if (socket.connected) {
            doJoin();
        } else {
            socket.once("connect", doJoin);
            socket.connect();
        }
    };

    const createRoom = () => {
        if (!newRoomName.trim()) return;

        socket.emit("create_room", {
            roomName: newRoomName.trim(),
            password: newRoomPassword.trim(),
        });

        setNewRoomName("");
        setNewRoomPassword("");
        setShowCreate(false);
    };

    const handleRoomClick = (roomData) => {
        setErrorMessage("");

        if (!username.trim()) {
            setRoom(roomData.name);
            setSelectedProtectedRoom(roomData.protected ? roomData.name : null);
            return;
        }

        if (roomData.protected) {
            setRoom(roomData.name);
            setSelectedProtectedRoom(roomData.name);
            return;
        }

        setSelectedProtectedRoom(null);
        joinRoom(roomData.name);
    };

    const handleProtectedJoin = () => {
        if (!selectedProtectedRoom) return;
        joinRoom(selectedProtectedRoom, joinPassword.trim());
    };

    return (
        <div className="joinWrapper">
            <div className="joinContainer">
                <div className="joinLogo">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="44" height="44">
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.553 4.118 1.522 5.851L0 24l6.293-1.499A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm6.145 16.747c-.264.742-1.305 1.358-2.14 1.538-.57.122-1.315.22-3.822-.821-3.21-1.319-5.278-4.578-5.44-4.788-.155-.21-1.3-1.729-1.3-3.298 0-1.569.817-2.34 1.107-2.662.264-.289.578-.362.77-.362.19 0 .383.002.55.01.177.009.414-.067.648.494.243.578.824 2.008.895 2.153.072.145.12.314.024.504-.09.186-.135.3-.264.465-.13.165-.274.368-.39.494-.13.14-.266.291-.114.57.15.278.67 1.105 1.44 1.79 1 .895 1.838 1.174 2.115 1.304.278.13.44.108.603-.065.165-.173.695-.812.88-1.09.186-.278.37-.232.624-.14.254.093 1.614.761 1.89.9.278.138.463.208.531.324.067.116.067.672-.196 1.42z"/>
                    </svg>
                </div>

                <h2>ChatApp</h2>
                <p className="joinSubtitle">Entrez votre pseudo puis choisissez une room</p>

                <div className="inputGroup">
                    <label>Pseudo</label>
                    <input
                        type="text"
                        placeholder="Votre nom..."
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        maxLength={20}
                        autoFocus
                    />
                </div>

                {errorMessage && <p className="joinError">{errorMessage}</p>}

                <div className="roomsSection">
                    <div className="roomsSectionHeader">
                        <label>Choisir une room</label>
                        <button
                            className="createRoomToggle"
                            onClick={() => setShowCreate(!showCreate)}
                            title="Créer une nouvelle room"
                        >
                            {showCreate ? "✕ Annuler" : "+ Nouvelle room"}
                        </button>
                    </div>

                    {showCreate && (
                        <div className="createRoomForm">
                            <input
                                type="text"
                                placeholder="Nom de la nouvelle room..."
                                value={newRoomName}
                                onChange={(e) => setNewRoomName(e.target.value)}
                                maxLength={30}
                            />
                            <input
                                type="password"
                                placeholder="Mot de passe (optionnel)"
                                value={newRoomPassword}
                                onChange={(e) => setNewRoomPassword(e.target.value)}
                                maxLength={30}
                            />
                            <button onClick={createRoom} disabled={!newRoomName.trim()}>
                                Créer
                            </button>
                        </div>
                    )}

                    <div className="roomsGrid">
                        {roomsList.length === 0 ? (
                            <p className="loadingRooms">Chargement des rooms...</p>
                        ) : (
                            roomsList.map((r) => (
                                <button
                                    key={r.name}
                                    className={`roomCard ${room === r.name ? "selected" : ""}`}
                                    onClick={() => handleRoomClick(r)}
                                >
                                    <span className="roomCardAvatar">
                                        {r.name.charAt(0).toUpperCase()}
                                    </span>
                                    <span className="roomCardName">
                                        #{r.name} {r.protected ? "🔒" : ""}
                                    </span>
                                    <span className="roomCardCount">
                                        {r.count > 0 ? `${r.count} 🟢` : "vide"}
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {selectedProtectedRoom && (
                    <div className="protectedRoomBox">
                        <label>Mot de passe pour #{selectedProtectedRoom}</label>
                        <input
                            type="password"
                            placeholder="Entrer le mot de passe..."
                            value={joinPassword}
                            onChange={(e) => setJoinPassword(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleProtectedJoin()}
                            maxLength={30}
                        />
                        <button className="joinBtn" onClick={handleProtectedJoin}>
                            Rejoindre #{selectedProtectedRoom} →
                        </button>
                    </div>
                )}

                {room && username && !selectedProtectedRoom && (
                    <button className="joinBtn" onClick={() => joinRoom(room)}>
                        Rejoindre #{room} →
                    </button>
                )}
            </div>
        </div>
    );
}

export default Join;