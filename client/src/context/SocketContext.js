// SocketContext.js
import React, { createContext, useContext } from "react";
import io from "socket.io-client";

const SocketContext = createContext(null);

// 🔑 LA CLÉ DU CORRECTIF :
// Le socket est créé ICI, au niveau du MODULE, complètement en dehors de React.
// Ainsi React StrictMode (qui monte/démonte les composants 2x) ne peut PAS le détruire.
// Chaque onglet du navigateur charge son propre module → chaque onglet a son propre socket.

// 🔹 IMPORTANT 🔹
// Pour le développement sur PC et téléphone sur le même réseau,
// il faut utiliser l'IP du PC accessible sur le réseau local.
// Remplace "10.0.0.40" par l'IP locale réelle de ton PC.
// "localhost" fonctionne uniquement sur le PC.
const SOCKET_URLS = [
    "http://localhost:5000",  // PC
    "http://192.168.2.22:5000",  // téléphone sur le même Wi-Fi changer par son addresse ip du wifi
];

// 🔹 Pour plus de sécurité, on peut choisir dynamiquement la bonne URL
// selon la présence d'une variable d'environnement ou un paramètre.
const DEFAULT_SOCKET_URL = SOCKET_URLS[1]; // utiliser IP réseau pour tests téléphone

const socket = io(DEFAULT_SOCKET_URL, { autoConnect: false });

// ────────────────
// PROVIDER REACT
// ────────────────
export function SocketProvider({ children }) {
    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
}

// ────────────────
// HOOK UTILITAIRE
// ────────────────
export function useSocket() {
    return useContext(SocketContext);
}