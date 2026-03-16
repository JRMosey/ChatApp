import React from "react";

function Sidebar({ users, room, show, onClose, activityLogs }) {
    return (
        <>
            {show && <div className="sidebarOverlay" onClick={onClose} />}

            <div className={`sidebar ${show ? "open" : ""}`}>
                <div className="sidebarHeader">
                    <h4>#{room}</h4>
                    <button className="closeSidebar" onClick={onClose}>✕</button>
                </div>

                <div className="sidebarSection">
                    <p className="sidebarLabel">
                        PARTICIPANTS ({users.length})
                    </p>

                    {users.length > 0 ? (
                        users.map((u) => (
                            <div className="userItem" key={u.socketId}>
                                <div className="userAvatar">
                                    {u.username.charAt(0).toUpperCase()}
                                </div>
                                <span>{u.username}</span>
                                <span className="onlineDot" />
                            </div>
                        ))
                    ) : (
                        <p className="noUsers">Aucun utilisateur</p>
                    )}
                </div>

                <div className="sidebarSection">
                    <p className="sidebarLabel">ACTIVITÉ RÉCENTE</p>

                    {activityLogs.length > 0 ? (
                        activityLogs.map((log, index) => (
                            <div className="activityItem" key={index}>
                                {log.username} {log.action} #{log.room} à {log.time}
                            </div>
                        ))
                    ) : (
                        <p className="noUsers">Aucune activité récente</p>
                    )}
                </div>
            </div>
        </>
    );
}

export default Sidebar;