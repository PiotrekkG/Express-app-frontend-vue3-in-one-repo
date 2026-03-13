import Room from "./Room.mjs";
import User from "./User.mjs";
import GameMissile from "./GameMissile.mjs";
import Log from "./Log.mjs";
import { Canvas, createCanvas } from "canvas";
import GameManager from "./GameManager.mjs";

import fs from "fs";

export default class GameRoom extends Room {
    /** @type {GameMissile[]} */
    missiles = [];

    /** @type {Canvas|null} */
    canvasObj = createCanvas(1000, 600);
    /** @type {CanvasRenderingContext2D|null} */
    canvasCtx = this.canvasObj.getContext('2d', { willReadFrequently: true, alpha: false });
    terrainSeedData = null;

    maxPlayers = 1;

    /** @type {Object.<string, {index: number, x: number, y: number, rocket2: number, rocket3: number}>} */
    playerData = {};
    playerTurns = [];
    currentTurnIndex = -1; // will be set to 0 in nextPlayer()
    turnTimeoutDuration = 20000; // seconds
    turnTimeoutId = -1;

    gameStatus = "waiting"; // "waiting", "starting", "playing", "ended"
    gameWinner = null;
    currentWind = 0;
    gravity = 0.05;
    velocityMultiplier = 6;

    sendAimingDataEveryMs = 100; // send aiming data at most every 100ms

    constructor(id) {
        super(id);
        this.logChat = true;

        // this.canvasCtx = this.canvasObj.getContext('2d', { willReadFrequently: true });
    }

    gameStart() {
        if (this.gameStatus !== "starting") return;

        this.gameStatus = "playing";
        GameManager.gameRoomChangedStatus(this);

        const defRocket2 = 4;
        const defRocket3 = 2;

        this.terrainSeedData = this.generateTerrain(this.canvasObj.width, this.canvasObj.height, 15, this.canvasObj.height / 2 - 40, this.canvasObj.height / 2 + 80);
        this.drawTerrain(this.terrainSeedData, this.canvasObj.height / 2 - 40);

        // default values for users
        const playerCount = this.users.length;
        for (let i = 0; i < playerCount; i++) {
            const user = this.users[i];
            const x = (this.canvasObj.width / (playerCount + 1)) * (i + 1);
            this.playerTurns.push(user.id);
            this.playerData[user.id] = {
                index: i,
                // user: user,
                id: user.id,
                x: x,
                y: 250,
                rocket2: defRocket2,
                rocket3: defRocket3,
                health: 100,
            };
            this.checkPlayerPosition(user.id);
        }

        this.savePng();

        let logInfo = new Log('gameStart', {
            turnTimeoutDuration: this.turnTimeoutDuration,
            sendAimingDataEveryMs: this.sendAimingDataEveryMs,
            terrainSeedData: this.terrainSeedData,
            gravity: this.gravity,
            velocityMultiplier: this.velocityMultiplier,
            playerData: Object.values(this.playerData).map(player => ({ id: player.id, x: player.x, y: player.y, health: player.health })),
            rocketsInfo: { rocket2: defRocket2, rocket3: defRocket3 },
            // currentPlayerId: this.currentPlayer.id,
            // wind: this.currentWind,
        });
        this.sendToAll(logInfo, null, true);

        setTimeout(() => {
            this.nextPlayer();
        }, 1500);

    }

    savePng() {
        // save canvas terrain as png
        const out = fs.createWriteStream('./terrain_' + this.id + '.png');
        const stream = this.canvasObj.createPNGStream();
        stream.pipe(out);
        out.on('finish', () => console.log('The PNG file was created.'));
    }

    getCurrentPlayer() {
        return {
            id: this.playerTurns[this.currentTurnIndex],
            playerData: this.playerData[this.playerTurns[this.currentTurnIndex]],
            // user: this.users.find(user => user.id === this.playerTurns[this.currentTurnIndex]),
        };
    }

    getPosition(x, y) {
        return {
            x: x,
            y: y,
            aimX: x + 2,
            aimY: y - 49,
        };
    }

    nextPlayer() {
        if (this.gameStatus !== "playing") return;

        clearTimeout(this.turnTimeoutId);

        if (this.users.length === 0) {
            console.log("No players left, ending game");
            this.gameStatus = "ended";
            // GameManager.gameRoomChangedStatus(this);

            // remove room if no players
            GameManager.removeGameRoom(this);
            return;
        }

        this.currentTurnIndex = (this.currentTurnIndex + 1) % this.playerTurns.length;

        this.currentWind = (Math.random() * 20) - 10; // random wind between -10 and 10

        this.turnTimeoutId = setTimeout(() => {
            this.nextPlayer();
        }, 21000);

        const logInfo = new Log('playerTurn', { playerId: this.playerTurns[this.currentTurnIndex], wind: this.currentWind });
        this.sendToAll(logInfo, null, true);
    }

    /** @param {User} user */
    addUser(user) {
        if (this.users.length < this.maxPlayers && (this.gameStatus === "waiting" || this.gameStatus === "starting" || (this.gameStatus === "playing" && this.hasPlayer(user.id)))) {
            super.addUser(user, true);
            user.send(new Log('roomData', { room: this.toSendData() }));

            if (this.gameStatus === "playing") {
                // send user all logs since game start
                for(const log of this.log) {
                    user.send(log);
                }
            }
            if (this.gameStatus === "waiting") {
                this.gameStatus = "starting";
                if (this.maxPlayers <= this.users.length) {
                    this.gameStart();
                }
                else if (this.users.length >= 2) {
                    this.sendToAll(new Log('gameStarting', { countdown: 20000 }), null, false);
                    setTimeout(() => {
                        this.gameStart();
                    }, 20000);
                }
            }
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
        // delete this.playerData[user.id];
        GameManager.gameRoomChangedStatus(this);
    }

    hasPlayer(userId) {
        return this.playerData[userId] !== undefined;
    }

    // getUserByPlayerData(index) {
    //     if(this.users[this.playerData[index].id].id === this.playerData[index].id) {
    //     const currentIndex = this.users.findIndex(user => user.id === this.currentPlayerId);

    //     const currentIndex = this.users.findIndex(user => user.id === this.currentPlayerId);
    //     // const playerIndex = (currentIndex + index) % this.users.length;
    //     return this.users[playerIndex];
    // }

    playerVisualMove(user, moveData) {
        if (this.gameStatus !== "playing" || !this.sendAimingDataEveryMs) return;

        const logInfo = new Log('playerVisualMove', { playerId: user.id, angle: moveData.angle });
        this.sendToAll(logInfo, user, false);
    }

    playerShot(user, moveData) {
        if (this.gameStatus !== "playing") return;

        const playerData = this.playerData[user.id];

        if (moveData.missileType == 2 && playerData.rocket2 > 0) {
            playerData.rocket2--;
        }
        else if (moveData.missileType == 3 && playerData.rocket3 > 0) {
            playerData.rocket3--;
        } else {
            moveData.missileType = 1; // default missile type
        }

        const logInfo = new Log('playerMove', { playerId: user.id, moveData });
        this.sendToAll(logInfo, user, false);

        const position = this.getPosition(playerData.x, playerData.y);

        this.addMissile(position.aimX, position.aimY, moveData.shotAngle, moveData.shotStrength, user.id, moveData.missileType);
    }

    addMissile(x, y, shotAngle, shotStrength, ownerId, missileType) {
        const missile = new GameMissile(this, ownerId, this.missiles.length, x, y, shotAngle, shotStrength, missileType, this.currentWind, this.gravity, this.velocityMultiplier);
        this.missiles.push(missile);
        this.sendToAll(new Log('missileShot', { missile: missile.toSendData() }), null, true);
        clearTimeout(this.turnTimeoutId);
        setTimeout(() => {
            this.nextPlayer();
        }, 3000);

        this.savePng();
    }

    generateTerrain(width, height, segments, fromHeight, toHeight) {
        const segmentLength = Math.ceil(width / segments);
        const points = [];
        for (let x = 0; ; x += segmentLength) {
            const y = fromHeight + (Math.random() * (toHeight - fromHeight));
            const type = Math.random() < 0.5 ? 'curve' : 'bezier';
            const directionType = Math.random() < 0.2 ? 1 : Math.random() < 0.5 ? 2 : 3;

            points.push({ x, y, type, directionType });

            if (x >= width) {
                break;
            }
        }
        return points;
    }

    drawTerrain(points, fromHeight) {
        // rysuj maskę terenu (pełne wypełnienie)
        // this.canvasCtx.clearRect(0, 0, this.canvasObj.width, this.canvasObj.height);
        this.canvasCtx.fillStyle = '#777777';
        this.canvasCtx.fillRect(0, 0, this.canvasObj.width, this.canvasObj.height);

        function returnPoint(x1, y1, x2, y2, fromFirst) {
            let x = (x2 + x1) / 2;
            let y = fromFirst ? y1 : y2;
            return { x, y };
        }

        this.canvasCtx.beginPath();
        this.canvasCtx.moveTo(0, this.canvasObj.height);
        this.canvasCtx.lineTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length; i++) {
            if (points[i - 1].type === 'bezier') {
                const directionType = points[i - 1].directionType;
                let cp1x, cp1y, cp2x, cp2y;
                if (directionType == 1) {
                    cp1x = (points[i - 1].x + points[i].x) / 2;
                    cp1y = points[i - 1].y;
                    cp2x = (points[i - 1].x + points[i].x) / 2;
                    cp2y = points[i].y;
                } else {
                    let dir = directionType == 2;
                    cp1x = returnPoint(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y, dir).x;
                    cp1y = returnPoint(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y, dir).y;
                    cp2x = returnPoint(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y, dir).x;
                    cp2y = returnPoint(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y, dir).y;
                }
                this.canvasCtx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, points[i].x, points[i].y);
            } else if (points[i - 1].type === 'curve') {
                const directionType = points[i - 1].directionType;
                let cp1x, cp1y;
                if (directionType == 1) {
                    cp1x = (points[i - 1].x + points[i].x) / 2;
                    cp1y = points[i - 1].y;
                } else {
                    let dir = directionType == 2;
                    cp1x = returnPoint(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y, dir).x;
                    cp1y = returnPoint(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y, dir).y;
                }
                this.canvasCtx.quadraticCurveTo(cp1x, cp1y, points[i].x, points[i].y);
            } else {
                this.canvasCtx.lineTo(points[i].x, points[i].y);
            }
        }

        this.canvasCtx.lineTo(this.canvasObj.width, this.canvasObj.height);
        this.canvasCtx.closePath();
        this.canvasCtx.fillStyle = '#000000';
        this.canvasCtx.fill();


        // draw holes in terrain for players
        this.canvasCtx.fillStyle = '#777777';
        const playerCount = this.users.length;
        for (let i = 1; i <= playerCount; i++) {
            const x = (this.canvasObj.width / (playerCount + 1)) * i;
            const y = this.getTerrainYOverPoint(x, fromHeight);
            this.canvasCtx.beginPath();
            this.canvasCtx.moveTo(x - 23, y + 10);
            this.canvasCtx.lineTo(x - 55, y - 190);
            this.canvasCtx.lineTo(x + 55, y - 190);
            this.canvasCtx.lineTo(x + 23, y + 10);
            this.canvasCtx.closePath();
            this.canvasCtx.fill();
        }
    }

    terrainHit(x, y, radius) {
        this.canvasCtx.save();
        // this.canvasCtx.globalCompositeOperation = 'destination-out';
        this.canvasCtx.fillStyle = '#777777';
        // this.canvasCtx.fillStyle = 'rgb(1, 1, 1)';
        this.canvasCtx.beginPath();
        this.canvasCtx.arc(x, y, radius, 0, 2 * Math.PI);
        this.canvasCtx.fill();
        this.canvasCtx.restore();
    }

    getDistanceFromPlayer(x, y, playerId) {
        const playerData = this.playerData[playerId];
        if (!playerData) return false;
        const playerX = playerData.x;
        const playerY = playerData.y;
        const dx = playerX - x;
        const dy = playerY - y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    checkCollision(playerId, x, y) {
        const playerData = this.playerData[playerId];
        if (!playerData) return false;
        const playerX = playerData.x;
        const playerY = playerData.y;
        // const dx = playerX - x;
        // const dy = playerY - y;
        // return (dx * dx + dy * dy <= 30 * 30); // okrąg r=30
        return x >= playerX - 25 && x <= playerX + 25 && y >= playerY - 40 && y <= playerY; // prostokąt 50x40
    }

    checkPlayerPosition(playerId) {
        const playerData = this.playerData[playerId];
        if (!playerData) return;
        const x = playerData.x;
        const y = playerData.y;
        playerData.y = this.getTerrainYOverPoint(x, y);

        // debug - draw player position on terrain canvas
        // this.canvasCtx.beginPath();
        // this.canvasCtx.arc(x, playerData.y - 3, 3, 0, 2 * Math.PI);
        // this.canvasCtx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        // this.canvasCtx.fill();

        return { x: playerData.x, y: playerData.y };
    }

    getTerrainYOverPoint(x, y, maxSearchDistance = -1) {
        if(maxSearchDistance < 0 || maxSearchDistance > this.canvasObj.height - y)
            maxSearchDistance = this.canvasObj.height - y;
        const pixelData = this.canvasCtx.getImageData(x, y, 1, maxSearchDistance).data;
        // console.log('Checking terrain collision at', x, y, 'pixelData:', pixelData);
        for(let i = 0; i < pixelData.length / 4; i++) {
            // zakładamy, że teren jest czarny (0, 0, 0, 255) a niebo jest inne
            // if(pixelData[i * 4 + 3] > 0) {
            //     return y + i;
            // }
            if(pixelData[i * 4 + 0] === 0 && pixelData[i * 4 + 1] === 0 && pixelData[i * 4 + 2] === 0 && pixelData[i * 4 + 3] > 0) {
                return y + i;
            }
        }
        return null;
    }

    isPointInTerrain(x, y) {
        const pixelData = this.canvasCtx.getImageData(x, y, 1, 1).data;
        // console.log('Checking terrain collision at', x, y, 'pixelData:', pixelData);
        // zakładamy, że teren jest czarny (0, 0, 0) a niebo jest inne
        // return pixelData[3] > 0;
        return pixelData[0] === 0 && pixelData[1] === 0 && pixelData[2] === 0 && pixelData[3] > 0;
    }

    damagePlayer(playerId, damage) {
        this.playerData[playerId].health -= Math.round(damage);

        if (this.playerData[playerId].health <= 0) {
            this.playerData[playerId].health = 0;
            this.playerTurns.splice(this.playerTurns.indexOf(playerId), 1);
        }

        return { playerId: playerId, health: this.playerData[playerId].health, damage };
        // const logInfo = new Log('updatePlayerData', { user: playerId, health: this.playerData[playerId].health, damage });
        // this.sendToAll(logInfo);
    }

    checkPlayerAlive(playerId) {
        return this.playerData[playerId].health > 0;
    }

    // rebuild function to allow only props needed for client and remove others that are not allowed/required to be sent to client
    handleMessage(user, message) {
        if (super.handleMessage(user, message)) return true;
        if (message.type === 'playerShot' && typeof message.data === 'object') {
            if (user.id !== this.playerTurns[this.currentTurnIndex]) return null; // only current player can send move
            const reqProps = ['aimPointX', 'aimPointY', 'shotAngle', 'shotStrength', 'missileType'];
            for (const key in message.data) {
                if (!reqProps.includes(key)) {
                    delete message.data[key];
                }
            }
            for (const prop of reqProps) {
                if (message.data[prop] === undefined) {
                    return null;
                }
            }
            this.playerShot(user, message.data);
            return true;
        } else if (message.type === 'visualMove' && typeof message.data === 'object') {
            if (user.id !== this.playerTurns[this.currentTurnIndex]) return null; // only current player can send visualMove
            const reqProps = ['angle'];
            for (const key in message.data) {
                if (!reqProps.includes(key)) {
                    delete message.data[key];
                }
            }
            for (const prop of reqProps) {
                if (message.data[prop] === undefined) {
                    return null;
                }
            }
            this.playerVisualMove(user, message.data);
            return true;
        } else if (message.type === 'moveTimeout') {
            if (user.id !== this.playerTurns[this.currentTurnIndex]) return null; // only current player can send moveTimeout
            this.nextPlayer();
            return true;
        }
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
            missiles: this.missiles.map(missile => missile.toSendData()),
        };
    }

}