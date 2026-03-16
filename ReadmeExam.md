# Examen - Chat App React

## Question 1 - Analyse du code existant

### App.js
App.js est le composant principal de l'application React. Il gère le routage entre les différentes pages de l'application, comme la page de connexion (Join) et la page du chat (Chat). Il initialise également la structure générale de l'application.

### Chat.js
Chat.js représente la page principale de discussion. Ce composant gère l'affichage des messages, l'envoi de nouveaux messages et la communication avec le serveur via Socket.io pour recevoir et envoyer les messages en temps réel.

### Message.js
Message.js est un composant utilisé pour afficher un message individuel dans la conversation. Il s'occupe de formater et afficher correctement le message ainsi que le nom de l'utilisateur qui l'a envoyé.

### Sidebar.js
Sidebar.js affiche la liste des utilisateurs connectés dans la salle de discussion. Il permet aux utilisateurs de voir qui est présent dans la conversation.

### Join.js
Join.js est la page d'entrée de l'application. Elle permet à l'utilisateur d'entrer son nom et éventuellement une salle de discussion avant de rejoindre le chat.

### server.js
server.js est le serveur backend de l'application. Il utilise Node.js et Socket.io pour gérer les connexions des utilisateurs, recevoir les messages et les diffuser aux autres utilisateurs connectés.

### SocketContext.js
SocketContext.js crée un contexte React pour gérer la connexion Socket.io dans toute l'application. Cela permet aux composants React d'accéder facilement à la connexion socket sans devoir la recréer dans chaque composant.

## Question 2 - Communication frontend / backend

### 1. Création et partage du socket dans React

Le socket est créé dans le fichier `SocketContext.js` à l'aide de la bibliothèque `socket.io-client`.

```javascript
const socket = io(SERVER_URL, {
    autoConnect: false,
    transports: ["websocket"],
});
```

Cette instance est créée **une seule fois au niveau du module**, en dehors des composants React.  
Cela permet d'éviter les connexions multiples et les problèmes causés par React StrictMode.

Ensuite, cette connexion est partagée dans toute l'application grâce au **Context API** de React :

```javascript
const SocketContext = createContext(null);
```

Le `SocketProvider` rend le socket accessible à tous les composants :

```javascript
<SocketContext.Provider value={socket}>
    {children}
</SocketContext.Provider>
```

Les composants peuvent ensuite récupérer le socket grâce au hook personnalisé :

```javascript
const socket = useSocket();
```

Par exemple, les composants `Chat.js` et `Join.js` utilisent ce hook pour communiquer avec le serveur.

---

### 2. Évènement Socket.io lorsqu'un utilisateur rejoint une room

Quand un utilisateur rejoint une room, le frontend émet l'évènement `join_room`.

Dans `Join.js`, on voit :

```javascript
socket.emit("join_room", {
    username: username.trim(),
    room: roomToJoin.trim(),
});
```

Cet évènement envoie au serveur :

- le nom d'utilisateur (`username`)
- le nom de la room (`room`)

Côté serveur, dans `server.js`, l'évènement est reçu ici :

```javascript
socket.on("join_room", ({ username, room }) => {
```

Lorsque cet évènement est reçu, le serveur :

- crée la room si elle n'existe pas ;
- ajoute le socket dans la room avec `socket.join(room)` ;
- enregistre la room et le pseudo dans `socket.currentRoom` et `socket.currentUsername` ;
- ajoute l'utilisateur dans la liste `rooms[room].users` ;
- envoie un message système indiquant que l'utilisateur a rejoint la room ;
- met à jour la liste des utilisateurs avec `room_users` ;
- met à jour la liste globale des rooms avec `rooms_list`.

---

### 3. Diffusion des messages dans une room (emit vs broadcast)

Quand un utilisateur envoie un message dans `Chat.js`, le frontend émet l'évènement :

```javascript
socket.emit("send_message", messageData);
```

Le serveur reçoit ensuite cet évènement dans `server.js` :

```javascript
socket.on("send_message", (data) => {
    io.to(data.room).emit("receive_message", data);
});
```

La méthode :

```javascript
io.to(room).emit(...)
```

envoie le message à **tous les utilisateurs présents dans la room**, y compris l'expéditeur.

#### Différence entre `emit` et `broadcast`

- `io.to(room).emit(...)` : envoie l'évènement à tous les utilisateurs de la room, **y compris l'expéditeur**.
- `socket.broadcast.to(room).emit(...)` : envoie l'évènement **à tous les autres utilisateurs sauf l'expéditeur**.

Dans cette application de chat, `io.to(room).emit(...)` est utilisé pour que **tout le monde voie le message**, y compris l'auteur.

---

## Question 3 - Modification de Message.js

J'ai modifié le composant `Message.js` afin d'ajouter un indicateur visuel **"✓✓ Lu"** sous mes propres messages.

Le message appartient à l'utilisateur courant lorsque :

```javascript
const isOwn = msg.author === username;
```

L'indicateur de lecture est affiché seulement si cette condition est vraie.

```javascript
<div className="messageMeta">
    <span className="messageTime">{msg.time}</span>
    {isOwn && <span className="messageRead">✓✓ Lu</span>}
</div>
```

Les styles CSS ont été ajoutés dans `App.css` pour positionner l'heure et l'indicateur en bas à droite de la bulle.

```css
.messageMeta{
    display:flex;
    justify-content:flex-end;
    gap:8px;
}

.messageRead{
    color:#4fc3f7;
    font-size:12px;
}
```

Ainsi, l'indicateur **✓✓ Lu** apparaît uniquement sous les messages ayant la classe `own`.


## Question 4 - Bouton "Quitter la salle" dans Chat.js

J'ai ajouté un bouton **"Quitter la salle"** dans le header du composant `Chat.js`, à droite du nom de la room.

### Fonctionnement
Quand l'utilisateur clique sur ce bouton :
- le frontend émet un évènement Socket.io `leave_room` vers le serveur ;
- le serveur retire l'utilisateur de la room ;
- le serveur envoie un message système pour informer les autres utilisateurs que cette personne a quitté la salle ;
- la liste des participants et la liste des rooms sont mises à jour ;
- le frontend réinitialise l'état local puis remet `connected` à `false` pour réafficher `Join.js`.

### Émission côté client
Dans `Chat.js`, l'évènement est émis ainsi :

```js
socket.emit("leave_room", { username, room });
```

### Traitement côté serveur
Dans `server.js`, le serveur :
- enlève l'utilisateur de `rooms[room].users` ;
- exécute `socket.leave(room)` ;
- diffuse un message système ;
- met à jour `room_users` et `rooms_list`.

### Réinitialisation de l'interface
Après avoir quitté la salle, l'application :
- vide les messages ;
- vide la liste des utilisateurs ;
- réinitialise le pseudo et la room ;
- affiche de nouveau le composant `Join.js`.
## Question 5 - Historique des connexions dans Sidebar.js

J'ai ajouté un historique persistant des évènements de connexion et de déconnexion.

### Côté serveur
Dans `server.js`, j'ai ajouté l'émission d'un évènement Socket.io `activity_log` vers tous les clients avec :

```js
io.emit("activity_log", {
    username,
    action: "a rejoint",
    room,
    time: now(),
});
```

et lors d'une sortie :

```js
io.emit("activity_log", {
    username,
    action: "a quitté",
    room,
    time: now(),
});
```

Cet évènement est envoyé à chaque connexion à une room et à chaque déconnexion ou sortie volontaire.

### Côté client
Dans `Sidebar.js`, je me suis abonné à l'évènement `activity_log` avec un `useEffect`.

Chaque nouvel évènement reçu est ajouté dans un état local `activityLogs`, en conservant uniquement les 5 derniers évènements :

```js
setActivityLogs((prev) => [log, ...prev].slice(0, 5));
```

### Affichage
J'ai ajouté dans la sidebar une nouvelle section intitulée **Activité récente**.

Le format affiché est :

`Alice a rejoint #Generale à 14:30`

### Différence avec la liste des participants
La liste `room_users` montre uniquement les utilisateurs actuellement connectés.

L'historique d'activité, lui, conserve les derniers évènements reçus pendant toute la session, même après déconnexion des utilisateurs.