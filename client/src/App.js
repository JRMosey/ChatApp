import React, { useState } from "react";
import "./App.css";
import Join from "./components/Join";
import Chat from "./components/Chat";
import { SocketProvider } from "./context/SocketContext";

function App() {
    const [username, setUsername] = useState("");
    const [room, setRoom] = useState("");
    const [connected, setConnected] = useState(false);

    return (
        <SocketProvider>
            <div className="App">
                {!connected ? (
                    <Join
                        username={username}
                        setUsername={setUsername}
                        room={room}
                        setRoom={setRoom}
                        setConnected={setConnected}
                    />
                ) : (
                    <Chat
                        username={username}
                        room={room}
                        setConnected={setConnected}
                        setRoom={setRoom}
                        setUsername={setUsername}
                    />
                )}
            </div>
        </SocketProvider>
    );
}

export default App;