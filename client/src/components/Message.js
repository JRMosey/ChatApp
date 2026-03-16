import React from "react";

/*
 Génère une couleur stable à partir du pseudo
 Ainsi chaque utilisateur garde toujours la même couleur
*/
function colorFromUsername(username) {
    let hash = 0;

    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }

    const hue = Math.abs(hash) % 360;

    return `hsl(${hue}, 70%, 50%)`;
}

function Message({ msg, username }) {

    const isOwn = msg.author === username;

    // Messages système (join / leave)
    if (msg.system) {
        return (
            <div className="systemMessage">
                <span>{msg.message}</span>
            </div>
        );
    }

    // Couleur spécifique à l'auteur
    const authorColor = colorFromUsername(msg.author || "");

    return (
        <div className={`message ${isOwn ? "own" : "other"}`}>

            {/* Auteur seulement si ce n'est pas mon message */}
            {!isOwn && (
                <p className="author" style={{ color: authorColor }}>
                    {msg.author}
                </p>
            )}

            {/* Texte du message */}
            <p className="messageText">{msg.message}</p>

            {/* Heure + indicateur Lu */}
            <div className="messageMeta">
                <span className="messageTime">{msg.time}</span>
                {isOwn && <span className="messageRead">✓✓ Lu</span>}
            </div>

        </div>
    );
}

export default Message;