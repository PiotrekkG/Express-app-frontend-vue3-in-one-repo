import LobbyRoom from "./LobbyRoom.mjs";
import PrivateRoom from "./PrivateRoom.mjs";
import Log from "./Log.mjs";
import User from "./User.mjs";

export default class GameManager {
    /** @type {Object.<string, User>} */
    static users = {};
    /** @type {LobbyRoom} */
    static lobbyRoom = new LobbyRoom();
    /** @type {Object.<string, PrivateRoom>} */
    static privateRooms = {};

    /** @param {User} user */
    static addUser(user) {
        GameManager.users[user.id] = user;
    }

    /** @returns {User|null} */
    static getUserById(userId) {
        return GameManager.users[userId] ?? null;
    }

    /** @returns {User|null} */
    static getUserByName(userName) {
        return Object.values(GameManager.users).find(user => user.name === userName) ?? null;
    }

    static removeUser(user) {
        delete GameManager.users[user.id];
    }

    /** @param {PrivateRoom} room */
    static addPrivateRoom(room = null) {
        if (room === null) {
            room = new PrivateRoom();
        }
        GameManager.privateRooms[room.id] = room;
        GameManager.lobbyRoom.sendToAll(new Log('newPrivateRoom', { room: room.toLobbySendData() }));

        return room;
    }

    /** @param {PrivateRoom} room */
    static privateRoomChangedStatus(room) {
        GameManager.lobbyRoom.sendToAll(new Log('privateRoomChangedStatus', { room: room.toLobbySendData() }));
    }

    /** @param {string} roomId */
    static getPrivateRoomById(roomId) {
        return GameManager.privateRooms[roomId] ?? null;
    }
    
    static getPrivateRoomsInLobby() {
        return Object.values(GameManager.privateRooms).filter(room => room.users.length < room.maxPlayers);
    }

    static removePrivateRoom(room) {
        delete GameManager.privateRooms[room.id];

        GameManager.lobbyRoom.sendToAll(new Log('removePrivateRoom', { roomId: room.id }));
    }

    static getPlayerRoom(userId) {
        for(const room of Object.values(GameManager.privateRooms)) {
            if(room.hasPlayer(userId)) {
                return room;
            }
        }
        return null;
    }
}