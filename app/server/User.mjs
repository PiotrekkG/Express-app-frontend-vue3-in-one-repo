import SimpleSendData from "./SimpleSendData.mjs";
import Log from "./Log.mjs";
import GameManager from "./GameManager.mjs";

export default class User extends SimpleSendData {
    constructor(socket, id, name, skinId) {
        super();
        this.socket = socket;

        this.id = id;
        this.name = name;

        /** @type {Room|null} */
        this.room = null;

        this.lastActionTime = Date.now();
    }

    /** @param {Log} data */
    send(data) {
        // if (this.socket.readyState === WebSocket.OPEN) {

            Object.keys(data.data).forEach(key => {
                if(data.data[key] instanceof Array) {
                    data.data[key] = data.data[key].map(item => {
                        if(item instanceof SimpleSendData) {
                            return item.toSendData();
                        }
                        return item;
                    });
                } else if(data.data[key] instanceof SimpleSendData) {
                    data.data[key] = data.data[key].toSendData();
                // } else {
                    // data.data[key] = String(data.data[key]);
                }
            });

            // if(data instanceof SimpleSendData) {
            //     data = data.toSendData();
            //     // data = data.toString();
            // }
            data = JSON.stringify(data);

            this.socket.send(data);
        // }
    }

    isAlive() {
        return this.socket.readyState === this.socket.OPEN && (Date.now() - this.lastActionTime < 120000); // consider user disconnected if no action for 2 minutes
    }

    joinRoom(room) {
        this.leaveRoom();
        this.room = room;
        if(room.addUser(this)) {
            return true;
        } else {
            this.room = null;
            return false;
        }
    }

    leaveRoom() {
        if (this.room) {
            const oldRoom = this.room;
            this.room = null;
            oldRoom.removeUser(this);
        }
    }

    quit() {
        this.leaveRoom();
    }

    changeName(newName) {
        this.name = newName;
    }

    handleMessage(message) {
        this.lastActionTime = Date.now();

        if(this.room?.handleMessage(this, message)) return true;

        if(message.type === 'leaveRoom') {
            // this.leaveRoom();
            this.joinRoom(GameManager.lobbyRoom);
            return true;
        }
        if(message.type === 'joinRoom') {
            if(this.room?.id !== 'lobby') return true; // cannot join another room from a non-lobby room
            if(this.room?.id === message.data.roomId) return true; // already in this room

            const room = GameManager.getGameRoomById(message.data.roomId);
            if(room) {
                if(this.joinRoom(room)) {
                    return true;
                } else {
                    this.joinRoom(GameManager.lobbyRoom);
                    return true;
                }
            }
            return true;
        }
    }

    toSendData() {
        return {
            id: this.id,
            name: this.name,
        }
    }
}