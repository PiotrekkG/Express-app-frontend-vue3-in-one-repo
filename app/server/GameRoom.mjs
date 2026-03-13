import Room from "./Room.mjs";
import User from "./User.mjs";
import Log from "./Log.mjs";
import GameManager from "./GameManager.mjs";

export default class GameRoom extends Room {
    maxPlayers = 5;

    constructor(id) {
        super(id);
        this.logChat = true;

        // this.canvasCtx = this.canvasObj.getContext('2d', { willReadFrequently: true });
    }

    /** @param {User} user */
    addUser(user) {
        if (this.users.length < this.maxPlayers) {
            super.addUser(user, true);
            user.send(new Log('roomData', { room: this.toSendData() }));

            GameManager.gameRoomChangedStatus(this);
            return true;
        } else {
            user.send({ type: 'error', data: { message: 'Room is full' } });
            return false;
        }
    }

    /** @param {User} user */
    removeUser(user) {
        super.removeUser(user);
        GameManager.gameRoomChangedStatus(this);
    }

    // rebuild function to allow only props needed for client and remove others that are not allowed/required to be sent to client
    handleMessage(user, message) {
        if (super.handleMessage(user, message)) return true;
        // handle room specific messages here, for example:
        // if (message.type === 'moveTimeout') {
        //     if (user.id !== this.playerTurns[this.currentTurnIndex]) return null; // only current player can send moveTimeout
        //     this.nextPlayer();
        //     return true;
        // }
    }

    toLobbySendData() {
        return {
            id: this.id,
            players: this.users.length,
            maxPlayers: this.maxPlayers,
        };
    }

    toSendData() {
        return {
            ...super.toSendData(),
            maxPlayers: this.maxPlayers,
        };
    }

}