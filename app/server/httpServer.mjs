import config from '../config/site.config.js';

import http from 'http';

import expressApp from './expressApp.mjs';
import websocketApp from './websocketApp.js';

/**
 * Get port from environment and store in Express.
 */
var port = normalizePort(process.env.PORT || config.port || '80');
expressApp.set('port', port);

/**
 * Create HTTP server.
 */

var httpServer = http.createServer(expressApp);

/**
 * Setup WebSocket server - attach to HTTP server.
 */

websocketApp(httpServer);

/**
 * Listen on provided port, on all network interfaces.
 */

httpServer.listen(port);
httpServer.on('error', onError);
httpServer.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
    var addr = httpServer.address();
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    // debug('Listening on ' + bind);

    var environment = process.env.NODE_ENV;
    var isNotProduction = environment !== 'production';

    if (isNotProduction)
        console.log('Listening on ' + bind);
}

export default httpServer;