import Room from "./Room.mjs";
import Log from "./Log.mjs";
import GameManager from "./GameManager.mjs";

export default class LobbyRoom extends Room {
    constructor() {
        super('lobby');
    }

    /** @param {User} user */
    addUser(user) {
        super.addUser(user);
        this.sendRoomList(user);
        return true;
    }

    broadcastRoomList() {
        const roomList = GameManager.getGameRoomsInLobby().map(room => room.toLobbySendData());
        const logInfo = new Log('lobbyData', { roomList: roomList });
        // const logInfo = new Log('lobbyData', { roomList: roomList, lobbyUsers: this.users.map(user => user.toSendData()) });
        this.sendToAll(logInfo);
    }

    /** @param {User} user */
    sendRoomList(user) {
        const roomList = GameManager.getGameRoomsInLobby().map(room => room.toLobbySendData());
        const logInfo = new Log('lobbyData', { roomList: roomList });
        // const logInfo = new Log('lobbyData', { roomList: roomList, lobbyUsers: this.users.map(user => user.toSendData()) });
        user.send(logInfo);
    }
}