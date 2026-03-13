import SimpleSendData from "./SimpleSendData.mjs";
import Log from "./Log.mjs";
import User from "./User.mjs";
import cryko from 'node:crypto';

export default class Room extends SimpleSendData {
    /** @type {User[]} */
    users = [];
    /** @type {Log[]} */
    log = [];

    logJoinLeave = true;
    logChat = false;

    constructor(id) {
        super();

        if(id === undefined || id === null) {
            id = crypto.randomUUID();
        }
        this.id = id;
    }

    /** @param {User} user */
    addUser(user, skipSendToUser = false) {
        if (this.logJoinLeave) {
            const logInfo = new Log('userJoin', { user: user.toSendData() });
            this.sendToAll(logInfo);
        }
        this.users.push(user);
        if(!skipSendToUser)
            user.send(new Log('roomData', { room: this.toSendData() }));
        return true;
    }

    /** @param {User} user */
    removeUser(user) {
        const index = this.users.indexOf(user);
        if (index !== -1) {
            this.users.splice(index, 1);
        }
        if (this.logJoinLeave) {
            const logInfo = new Log('userLeave', { userId: user.id });
            this.sendToAll(logInfo);
        }
    }

    currentUsers() {
        return this.users;
    }

    userChanged(user) {
        const logInfo = new Log('userChanged', { user: user.toSendData() });
        this.sendToAll(logInfo, null, false);
    }

    sendUserLogFromId(user, lastId) {
        for (let i = lastId + 1; i < this.log.length; i++) {
            user.send(this.log[i]);
        }
    }

    /** @param {User} user @param {string} message */
    userChat(user, message) {
        message = message.trim();
        if(message.length == 0) return;
        const logInfo = new Log('chat', { user: user.name, message });
        this.sendToAll(logInfo, null, this.logChat);
    }

    sendToAll(sendData, excludeUser = null, includeInLog = true) {
        if (includeInLog) {
            this.log.push(sendData);
        }
        for (const user of this.users) {
            if (user === excludeUser) continue;
            user.send(sendData);
        }
    }

    handleMessage(user, message) {
        if (message.type === 'chat' && typeof message.data === 'object') {
            const reqProps = ['message'];
            for (const prop of reqProps) {
                if (message.data[prop] === undefined) {
                    return null;
                }
            }
            this.userChat(user, String(message.data.message));
            return true;
        }
    }

    toSendData() {
        return {
            id: this.id,
            users: this.users.map(user => user.toSendData()),
        }
    }

    // toString() {
    //     return JSON.stringify(this.toSendData());
    // }
}