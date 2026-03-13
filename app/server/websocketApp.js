import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import websocket from 'websocket';
import crypto from 'node:crypto';
import { sessionParser } from './expressApp.mjs';
import User from './User.mjs';
import GameManager from './GameManager.mjs';

GameManager.addGameRoom().maxPlayers = 2;
GameManager.addGameRoom().maxPlayers = 2;
GameManager.addGameRoom().maxPlayers = 3;
GameManager.addGameRoom().maxPlayers = 4;
GameManager.addGameRoom();
GameManager.addGameRoom();
GameManager.addGameRoom();

const connectedUsers = {};

export function disconnectUserById(userId, reason = "unknown") {
    const socket = connectedUsers[userId];
    if (socket) {
        socket.send({ type: "disconnect", data: { reason } });
        connectedUsers[userId]?.quit();
        // GameManager.getUserById(socket.id)?.quit();
        socket.close();
    }
}

export default function websocketApp(httpServer) {

    var wsServer = new websocket.server({
        // WebSocket server is tied to a HTTP server. WebSocket
        // request is just an enhanced HTTP request. For more info 
        // http://tools.ietf.org/html/rfc6455#page-6
        httpServer: httpServer,
        autoAcceptConnections: false
    });

    wsServer.on('request', onWsRequest);

    function tryParseJSON(jsonString) {
        try {
            var o = JSON.parse(jsonString);
            if (o && typeof o === "object") {
                return o;
            }
        } catch (e) { }
        return undefined;
    }

    function logInfo(type, ...args) {
        console.log(type, ...args);
    }

    function onWsRequest(/** @type {websocket.request} */ request) {

        // accept connection - you should check 'request.origin' to
        // make sure that client is connecting from your website
        // (http://en.wikipedia.org/wiki/Same_origin_policy)
        // if(request.origin !== "https://tremle.pl" && request.origin !== null && request.origin !== "file://"){

        // if (!(request.origin == "https://km2023.pl" || request.origin == "http://localhost:3000")) {
        //     logInfo("info", `Rejecting connection [${socket.ip}, ${request.origin}].`);

        //     request.reject();
        //     totalConnections.fails++;

        //     //socket.connection = request.reject();

        //     return;
        // }
        
        // get session
        sessionParser(request.httpRequest, {}, function () {
            // const user = request.httpRequest.session.user;
            // const userId = user.id;
            // console.log('Received WebSocket request from origin ' + request.origin, 'session: ', (request.httpRequest.session ?? 'brak!'));
            if (!request.httpRequest.session || !request.httpRequest.session.user) {
                logInfo("info", `Rejecting connection [${request.remoteAddress}, ${request.origin}] - no session or user.`);
                request.reject(401, 'Unauthorized');
                return;
            }
            
            // sessionParser(request.httpRequest, {}, function () {
            var socket = {
                id: request.httpRequest?.session?.user?.id ?? crypto.randomUUID(),
                connection: request.accept(null, request.origin),
                ip: request.remoteAddress,
                send: (/** @type {string|object} */ message) => {
                    if (typeof message === "object")
                        message = JSON.stringify(message);

                    socket.connection.sendUTF(message);
                },
                close: () => {
                    socket.connection.close();
                },
                /** @type {User|null} */
                user: null,
            };

            if(connectedUsers[socket.id] !== undefined) {
                // logInfo("info", `Kicking client [${socket.id}, ip=${connectedUsers[socket.id].ip}] - logged from another place [ip=${socket.ip}]`);
                connectedUsers[socket.id].send({ type: "disconnect", data: { reason: "loggedFromAnotherPlace" } });
                GameManager.getUserById(socket.id)?.quit();
                connectedUsers[socket.id].close();
            }
            connectedUsers[socket.id] = socket;


            const user = new User(socket, socket.id, request.httpRequest?.session?.user?.username ?? socket.id, request.httpRequest?.session?.user?.skinId ?? 0);
            socket.user = user;
            const room = GameManager.getPlayerRoom(user.id);
            if(room) {
                user.joinRoom(room);
            } else {
                user.joinRoom(GameManager.lobbyRoom);
            }

            // if (connectedUsers[user.id] !== undefined) {
            //     logInfo("info", `Kicking client [${user.nick}, ip=${connectedUsers[user.id].socket.ip}] - logged from another place [ip=${socket.ip}]`);

            //     socket.sendMessage({ type: "disconnect", reason: "loggedFromAnotherPlace" });
            //     socket.close();

            //     if (connectedUsers[user.id] !== undefined)
            //         delete connectedUsers[user.id];
            // }

            // when user disconnected
            socket.connection.on('close', onWsClose);

            // when user sent some message
            socket.connection.on('message', onWsMessage);

            function onWsClose(_connection) {
                if (socket.user != null) {

                    if (socket.user) socket.user.quit();
                    // var id = socket.user.id;
                    // if (connectedUsers[id].socket === socket) {
                    //     socket.user = null;
                    //     delete connectedUsers[id];
                    // }
                    socket.close();
                }
                if(connectedUsers[socket.id] === socket) {
                    delete connectedUsers[socket.id];
                }
            }

            /**
             * @param {{ type: string; utf8Data: any; }} message
             */
            function onWsMessage(message) {
                if (message.type === 'utf8') { // accept only text
                    if (socket.user != null) {

                        var data = tryParseJSON(message.utf8Data);

                        if (data === undefined || data.type === undefined) {
                            logInfo("info", "Can't handle message:", data ?? message.utf8Data);
                            // logInfo("info", "Disconnecting user due received undefined data:", data);
                            // socket.close();
                            return;
                        }

                        if (socket.user.handleMessage(data)) return;

                        logInfo("info", `Received unhandled message from [${socket.user.name}, ip=${socket.ip}]:`, data);
                    }
                }
            }
        });
    }
}