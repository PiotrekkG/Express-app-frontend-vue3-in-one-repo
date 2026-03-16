# Dev with nodejs express app + frontend (vue3) in one repo

## Prepare

If working with git - use `npm ci` (during installation on each instance).

**package.json:**
`{
  ...,
  "type": "module",
  "main": "index.js",
  "scripts": {
    "start": "nodemon ./index.js --watch ./server",
    "dev": "vite serve ./front --config ./front/vite.config.js --port 5173",
    "serverTest": "node ./server/server.js",
    "outputBuild": "vite build ./front --config ./front/vite.config.js --outDir ../frontOutput --base ./"
  },
  "dependencies": {
    "bootstrap": "^5.3.8",
    "bootstrap-icons": "^1.13.1",
    "express": "^5.2.1",
    "express-mysql-session": "^3.0.3",
    "express-session": "^1.19.0",
    "http-errors": "^2.0.1",
    "multer": "^2.1.0",
    "mysql2": "^3.18.1",
    "pinia": "^3.0.4",
    "vue": "^3.5.29",
    "vue-router": "^5.0.3",
    "websocket": "^1.0.35"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^6.0.4",
    "nodemon": "^3.1.14",
    "vite": "^7.3.1",
    "vite-plugin-vue-devtools": "^8.0.6"
  },
  "engines": {
    "node": "^20.19.0 || >=22.12.0"
  }
}`

## Making changes

#### Change base path for frontend app
Attribute in outputBuild `--base ./` you can change to something like: `--base ./app/`, so you don't have to remember add "routers" in expressApp.mjs file - just do this 3 changes in that file:
line 61: const redirectToIndexStarting = \['/app/']; // if user requires /app/ it redirects to /app (so /app/index.html)
line 63: req.url = '/app'; // front app base dir file
line 78: app.use('/app', express.static(path.join(\_\_dirname, '../frontOutput'))); //set front files to /app

#### Change base path for backend app
By default routes is available in app/server/expressApp.mjs
line 82: app.use('/api', apiRouter);

#### Remove websocket support from app
Go to file httoServer.mjs and remove:
line 6: import websocketApp from './websocketApp.js';
line 24: websocketApp(httpServer);

#### Install Bootstrap with icons to Vue3 (*)
(*) it is already in this repo, so you don't have to install it manually:
go to app\front\src\main.js file and add imports at very top:
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'bootstrap/dist/css/bootstrap.min.css'
// import 'bootstrap/dist/js/bootstrap.bundle.min.js' - remember: do not use it - import modals and other functions directly in components code!
import 'bootstrap'

#### Use for sessions SqliteSQL instead of MySQL
Go to file app\server\expressApp.mjs and swap comments in lines 8-9 and lines 28-46.
Remember to install dependency: connect-sqlite3 (`npm install connect-sqlite3`)

