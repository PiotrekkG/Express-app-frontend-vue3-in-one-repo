# Aplikacja nodejs: express + front (vue3) in one repo



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

    "canvas": "^3.2.1",

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



Attribute in outputBuild `--base ./` you can change to something like: `--base ./app/`, so you don't have to remember add "routers" in expressApp.mjs file - just do this 3 changes:

line 61: const redirectToIndexStarting = \['/app/']; // if user requires /app/ it redirects to /app (so /app/index.html)

line 63: req.url = '/app'; // front app base dir file

line 78: app.use('/app', express.static(path.join(\_\_dirname, '../frontOutput'))); //set front files to /app











