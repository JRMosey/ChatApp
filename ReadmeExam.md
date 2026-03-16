# Examen - Chat App React

## Question 1 - Analyse du code existant

### App.js
`App.js` est le composant principal de l'application React.  
Il gère l'état global de l'application, notamment le pseudo de l'utilisateur, la room sélectionnée et l'état de connexion.

Selon cet état, il affiche soit le composant `Join.js` (écran de connexion), soit le composant `Chat.js` (interface du chat).

---

### Chat.js
`Chat.js` est le composant principal de la discussion.

Il gère :
- l'envoi des messages vers le serveur avec Socket.io ;
- la réception des messages en temps réel ;
- l'affichage de la liste des utilisateurs connectés ;
- l'affichage de l'historique d'activité ;
- le bouton permettant de quitter la salle.

Les messages reçus sont stockés dans un état React et affichés avec le composant `Message.js`.

---

### Message.js
`Message.js` est un composant utilisé pour afficher un message individuel dans la conversation.

Il gère :
- l'affichage du texte du message ;
- l'affichage du nom de l'auteur (si ce n'est pas l'utilisateur courant) ;
- l'heure d'envoi du message ;
- l'indicateur visuel **✓✓ Lu** pour les messages envoyés par l'utilisateur courant.

---

### Sidebar.js
`Sidebar.js` affiche un panneau latéral contenant :

- la liste des utilisateurs connectés dans la room ;
- une section **Activité récente** qui montre les derniers évènements de connexion ou de déconnexion.

Ce composant reçoit les données depuis `Chat.js`.

---

### Join.js
`Join.js` est l'écran d'entrée de l'application.

Il permet à l'utilisateur :

- d'entrer son pseudo ;
- de choisir une room existante ;
- de créer une nouvelle room ;
- de définir un mot de passe optionnel pour une salle privée ;
- d'entrer un mot de passe si la salle sélectionnée est protégée.

---

### server.js
`server.js` est le backend Node.js de l'application.

Il utilise **Express** et **Socket.io** pour :

- gérer les connexions des utilisateurs ;
- gérer les rooms ;
- recevoir et diffuser les messages ;
- maintenir la liste des utilisateurs dans chaque room ;
- envoyer des notifications d'activité ;
- vérifier les mots de passe pour les salles privées.

---

### SocketContext.js
`SocketContext.js` permet de créer **une seule instance du socket Socket.io** pour toute l'application React.

Le socket est stocké dans un **Context React**, ce qui permet à tous les composants (`Chat`, `Join`, etc.) d'utiliser la même connexion avec le serveur grâce au hook :

```js
const socket = useSocket();
```

Cela évite de recréer plusieurs connexions inutiles.

---

# Question 2 - Communication frontend / backend

## Création et partage du socket

Le socket est créé dans `SocketContext.js` :

```javascript
const socket = io(SERVER_URL, {
    autoConnect: false,
    transports: ["websocket"],
});
```

L'option `autoConnect: false` permet de contrôler manuellement la connexion après que l'utilisateur ait choisi son pseudo.

Le socket est ensuite partagé dans toute l'application grâce au **Context API** :

```javascript
<SocketContext.Provider value={socket}>
    {children}
</SocketContext.Provider>
```

Les composants peuvent récupérer cette connexion avec :

```javascript
const socket = useSocket();
```

---

## Évènement lorsqu'un utilisateur rejoint une room

Quand un utilisateur rejoint une room, le frontend envoie l'évènement :

```javascript
socket.emit("join_room", {
    username,
    room,
    password
});
```

Le serveur reçoit cet évènement dans `server.js` :

```javascript
socket.on("join_room", ({ username, room, password }) => {
```

Le serveur :

1. vérifie si la room existe ;
2. vérifie le mot de passe si la room est protégée ;
3. ajoute l'utilisateur dans la room avec `socket.join(room)` ;
4. ajoute l'utilisateur dans la liste `rooms[room].users` ;
5. envoie un message système indiquant que l'utilisateur a rejoint ;
6. met à jour la liste des utilisateurs ;
7. met à jour la liste des rooms.

---

## Diffusion des messages

Quand un utilisateur envoie un message dans `Chat.js` :

```javascript
socket.emit("send_message", messageData);
```

Le serveur reçoit ce message puis le diffuse avec :

```javascript
io.to(data.room).emit("receive_message", data);
```

Cela envoie le message **à tous les utilisateurs de la room**, y compris l'expéditeur.

### Différence entre emit et broadcast

- `io.to(room).emit()` → envoie le message à tous les utilisateurs de la room.
- `socket.broadcast.to(room).emit()` → envoie le message à tous les autres utilisateurs sauf l'expéditeur.

Dans cette application, `io.to(room).emit()` est utilisé pour que l'expéditeur voie aussi son message apparaître.

---

# Question 3 - Modification de Message.js

J'ai ajouté un indicateur visuel **✓✓ Lu** sous les messages envoyés par l'utilisateur courant.

Dans `Message.js`, on détermine si le message appartient à l'utilisateur :

```javascript
const isOwn = msg.author === username;
```

Ensuite, l'indicateur est affiché uniquement pour ces messages :

```javascript
<div className="messageMeta">
    <span className="messageTime">{msg.time}</span>
    {isOwn && <span className="messageRead">✓✓ Lu</span>}
</div>
```

Le style CSS ajouté dans `App.css` permet de placer cet indicateur à droite :

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

Ainsi, seuls mes messages affichent **✓✓ Lu**.

---

# Question 4 - Bouton "Quitter la salle"

Un bouton **Quitter la salle** a été ajouté dans `Chat.js`.

Quand l'utilisateur clique dessus :

1. le client émet l'évènement :

```js
socket.emit("leave_room", { username, room });
```

2. le serveur retire l'utilisateur de la room ;
3. un message système est envoyé aux autres utilisateurs ;
4. la liste des participants est mise à jour ;
5. le frontend réinitialise l'état et retourne à `Join.js`.

---

# Question 5 - Historique d'activité

Un historique des connexions et déconnexions a été ajouté.

## Côté serveur

Le serveur conserve les 5 derniers évènements dans :

```js
let activityHistory = [];
```

À chaque connexion ou déconnexion :

```js
io.emit("activity_log", log);
```

Les nouveaux clients reçoivent aussi l'historique avec :

```js
socket.emit("activity_history", activityHistory);
```

---

## Côté client

Dans `Chat.js`, les évènements sont reçus :

```js
socket.on("activity_log", handleActivityLog);
socket.on("activity_history", handleActivityHistory);
```

Les évènements sont stockés dans un état React :

```js
setActivityLogs((prev) => [log, ...prev].slice(0, 5));
```

Puis affichés dans `Sidebar.js` dans une section **Activité récente**.

Exemple :

```
Alice a rejoint #Generale à 14:30
```

---

# Question 6 - Bonus : salles privées

J'ai ajouté la possibilité de créer des salles protégées par mot de passe.

## Côté client

Dans `Join.js` :

- un champ **mot de passe optionnel** lors de la création d'une room ;
- un cadenas 🔒 pour indiquer qu'une room est protégée ;
- un champ de saisie du mot de passe avant de rejoindre.

---

## Côté serveur

Chaque room contient maintenant :

```js
{
 users: [],
 password: ""
}
```

Lors de `join_room`, le serveur vérifie le mot de passe.

Si le mot de passe est incorrect :

```js
socket.emit("join_error", { message: "Mot de passe incorrect" });
```

---



---

# Instructions pour lancer en local

Backend :

```bash
cd server
node server.js
```

Frontend :

```bash
cd client
npm start
```

Puis ouvrir :

```
http://localhost:3000
```

---

# Amélioration possible

Si j'avais plus de temps, j'ajouterais la **persistance des messages dans une base de données** (MongoDB ou PostgreSQL).

Cela permettrait de conserver l'historique des conversations même si le serveur redémarre.