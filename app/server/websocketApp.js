import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import websocket from 'websocket';
import crypto from 'node:crypto';
import { sessionParser } from './expressApp.mjs';
import User from './User.mjs';
import GameManager from './RoomManager.mjs';

GameManager.addPrivateRoom().maxPlayers = 2;
GameManager.addPrivateRoom().maxPlayers = 2;
GameManager.addPrivateRoom().maxPlayers = 3;
GameManager.addPrivateRoom().maxPlayers = 4;
GameManager.addPrivateRoom();
GameManager.addPrivateRoom();
GameManager.addPrivateRoom();

const connectedUsers = {};
const DISCONNECT_WHEN_LOGGED_FROM_ANOTHER_PLACE = false; // if true, user will be disconnected when another user with same id connects (useful when user has multiple tabs open or logged in from multiple devices)
const ALLOW_ORIGIN = ["https://example.com", "http://localhost", "http://localhost:8888", "http://localhost:3000", "http://localhost:5173", "file://"];

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
        if( !ALLOW_ORIGIN.includes(request.origin) && !ALLOW_ORIGIN.some(allowedOrigin => request.origin.startsWith(allowedOrigin)) ) {
            logInfo("info", `Rejecting connection [${socket.ip}, ${request.origin}] - origin not allowed.`);
            request.reject();
            return;
        }
        
        // get session
        sessionParser(request.httpRequest, {}, function () {
            if (!request.httpRequest.session || !request.httpRequest.session.user) {
                logInfo("info", `Rejecting connection [${request.remoteAddress}, ${request.origin}] - no active session/user (not logged).`);
                request.reject(401, 'Unauthorized');
                return;
            }

            const id = DISCONNECT_WHEN_LOGGED_FROM_ANOTHER_PLACE ? request.httpRequest.session.user.id : crypto.randomUUID();
            
            // sessionParser(request.httpRequest, {}, function () {
            var socket = {
                id: id,
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


            if(DISCONNECT_WHEN_LOGGED_FROM_ANOTHER_PLACE && connectedUsers[socket.id] !== undefined) {
                // logInfo("info", `Kicking client [${socket.id}, ip=${connectedUsers[socket.id].ip}] - logged from another place [ip=${socket.ip}]`);
                connectedUsers[socket.id].send({ type: "disconnect", data: { reason: "loggedFromAnotherPlace" } });
                GameManager.getUserById(socket.id)?.quit();
                connectedUsers[socket.id].close();
            }
            connectedUsers[socket.id] = socket;


            const user = new User(socket, socket.id, request.httpRequest?.session?.user?.username ?? socket.id);
            socket.user = user;
            const room = GameManager.getPlayerRoom(socket.id);
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