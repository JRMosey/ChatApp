import React from "react";

function Message({ msg, username }) {

    const isOwn = msg.author === username;

    if (msg.system) {
        return (
            <div className="systemMessage">
                <span>{msg.message}</span>
            </div>
        );
    }

    return (
        <div className={`message ${isOwn ? "own" : "other"}`}>
            {!isOwn && <p className="author">{msg.author}</p>}

            <p className="messageText">{msg.message}</p>

            <div className="messageMeta">
                <span className="messageTime">{msg.time}</span>
                {isOwn && <span className="messageRead">✓✓ Lu</span>}
            </div>
        </div>
    );
}

export default Message;