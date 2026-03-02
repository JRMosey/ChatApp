// SocketContext.js

import React, { createContext, useContext } from "react";
import io from "socket.io-client";

const SocketContext = createContext(null);

/*
────────────────────────────────────────────
 OBJECTIF
Créer UNE SEULE instance du socket pour toute l'application.

Le socket est créé au niveau du module (en dehors du composant React).
➡Cela évite les doubles connexions causées par React StrictMode.
➡Chaque onglet du navigateur aura sa propre connexion.
────────────────────────────────────────────
*/

/*
────────────────────────────────────────────
 URL DU SERVEUR

En production (Vercel) :
→ on utilise la variable d'environnement REACT_APP_SERVER_URL

En développement local :
→ fallback automatique vers http://localhost:5000
────────────────────────────────────────────
*/

const SERVER_URL =
    process.env.REACT_APP_SERVER_URL || "http://localhost:5000";

/*
────────────────────────────────────────────
🔌 Création du socket

autoConnect: false
→ Le socket ne se connecte PAS automatiquement.
→ Tu dois appeler socket.connect() manuellement après login par exemple.

transports: ["websocket"]
→ Force l'utilisation de WebSocket uniquement
→ Évite certains problèmes sur Render
────────────────────────────────────────────
*/

const socket = io(SERVER_URL, {
    autoConnect: false,
    transports: ["websocket"],
});

/*
────────────────────────────────────────────
PROVIDER
Permet de rendre le socket accessible
dans toute l'application via le Context.
────────────────────────────────────────────
*/

export function SocketProvider({ children }) {
    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
}

/*
────────────────────────────────────────────
 HOOK PERSONNALISÉ
Permet d'utiliser facilement le socket :

const socket = useSocket();
────────────────────────────────────────────
*/

export function useSocket() {
    return useContext(SocketContext);
}
