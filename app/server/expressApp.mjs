#!/usr/bin/env node

import sessionsdbConfig from '../config/sessionsdb.config.js';

import createError from 'http-errors';
import express from 'express';
import session from "express-session";
import expressMysqlSession from 'express-mysql-session';
// import SQLiteStore from 'connect-sqlite3';
import multer from 'multer';

import { fileURLToPath } from 'url';
import path from 'path';
// import { dirname } from 'path';
import { readdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

var app = express();

export let sessionParser = null;

try {
    if(!sessionsdbConfig.useMySQL) {
        throw new Error('MySQL session store is disabled by configuration.');
    }

    const MySQLStore = expressMysqlSession(session);
    const sessionStore = new MySQLStore(sessionsdbConfig, undefined);
    sessionParser = session({
        key: 'plsid',
        store: sessionStore,
        secret: sessionsdbConfig.secret,
        resave: sessionsdbConfig.resave,
        saveUninitialized: sessionsdbConfig.saveUninitialized
    });
    app.use(sessionParser);
} catch (error) {
    console.error('MySQL session store not initialized:', error);
    // const SQLiteStoreInstance = SQLiteStore(session);
    // sessionParser = session({
    //     key: 'plsid',
    //     store: new SQLiteStoreInstance({ table: 'sessions', dir: path.join(__dirname, 'config') }),
    //     cookie: { maxAge: sessionsdbConfig.expiration },
    //     secret: sessionsdbConfig.secret,
    //     saveUninitialized: sessionsdbConfig.saveUninitialized,
    //     resave: sessionsdbConfig.resave,
    // });
    sessionParser = session({
        key: 'plsid',
        cookie: { maxAge: sessionsdbConfig.expiration },
        secret: sessionsdbConfig.secret,
        saveUninitialized: sessionsdbConfig.saveUninitialized,
        resave: sessionsdbConfig.resave,
    });
    app.use(sessionParser);
}

const redirectToIndexStarting = ['/game', '/guest', '/login', '/register', '/change-password', '/profile', '/leaderboard'];
app.use(function (req, res, next) {
    if (redirectToIndexStarting.some(path => req.url == path || req.url.startsWith(path + '/'))) {
        req.url = '/';
    }
    next();
});

// app.use(bodyParser.json()); // to support JSON-encoded bodies
// app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
//     extended: !true
// }));

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

app.use(multer().none()); // to support multipart/form-data (for forms without file uploads)

app.use(express.static(path.join(__dirname, '../frontOutput')));
app.use(express.static(path.join(__dirname, '../public')));

var apiRouter = express.Router();
app.use('/api', apiRouter);

const routePath = path.join(__dirname, 'routes/');
for(const file of readdirSync(routePath)) {
    // var route = './routes/' + file.substring(0, file.indexOf('.'));
    var route = './routes/' + file;
    console.log('Adding route: ' + file);
    try {
        const module = await import(route);
        if (module.default) {
            module.default(apiRouter);
        } else {
            console.warn(`Route ${route} does not have a default export!`);
        }
    } catch (error) {
        console.error(`Error loading route ${route}:`, error);
    }
}

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    res.status(err.status || 500);

    // render the error page
    if (err.status != 404) {
        console.error(`Błąd ${err.status} - ${err.message}`);
        console.error(err.stack);
        res.send({ status: err.status, error: 'error' });
    } else {
        res.send({ status: err.status, error: 'not found' });
    }
    // res.send({ error: err.message });
});

export default app;