import LobbyRoom from "./LobbyRoom.mjs";
import GameRoom from "./GameRoom.mjs";
import Log from "./Log.mjs";

export default class GameManager {
    /** @type {Object.<string, User>} */
    static users = {};
    /** @type {LobbyRoom} */
    static lobbyRoom = new LobbyRoom();
    /** @type {Object.<string, GameRoom>} */
    static gameRooms = {};

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

    /** @param {GameRoom} room */
    static addGameRoom(room = null) {
        if (room === null) {
            room = new GameRoom();
        }
        GameManager.gameRooms[room.id] = room;
        GameManager.lobbyRoom.sendToAll(new Log('newGameRoom', { room: room.toLobbySendData() }));

        return room;
    }

    /** @param {GameRoom} room */
    static gameRoomChangedStatus(room) {
        GameManager.lobbyRoom.sendToAll(new Log('gameRoomChangedStatus', { room: room.toLobbySendData() }));
    }

    /** @param {string} roomId */
    static getGameRoomById(roomId) {
        return GameManager.gameRooms[roomId] ?? null;
    }
    
    static getGameRoomsInLobby() {
        return Object.values(GameManager.gameRooms).filter(room => room.users.length < room.maxPlayers);
    }

    static removeGameRoom(room) {
        delete GameManager.gameRooms[room.id];

        GameManager.lobbyRoom.sendToAll(new Log('removeGameRoom', { roomId: room.id }));
    }

    static getPlayerRoom(userId) {
        for(const room of Object.values(GameManager.gameRooms)) {
            if(room.hasPlayer(userId)) {
                return room;
            }
        }
        return null;
    }
}