require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');

const expect = require('chai');
const socketIo = require('socket.io');


const cors = require('cors');

const helmet = require("helmet");
const nocache = require('nocache');

const fccTestingRoutes = require('./routes/fcctesting.js');

const runner = require('./test-runner.js');

const { platform } = require('os');

const { default: Player } = require('./public/Player.mjs');

const Collectible = require('./public/Collectible.mjs');


const app = express();
const server = http.createServer(app);
var players = [];
var token = null;

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}


function verifyToken() {
  if (token == null) {
    let xPos = Math.round(getRandomArbitrary(5, 5 + 630 - 30));
    xPos -= xPos % 10;
    let yPos = Math.round(getRandomArbitrary(50, 50 + 425 - 20));
    yPos -= yPos % 10;
    token = new Collectible({ "x": xPos, "y": yPos, "value": Math.round(getRandomArbitrary(1, 3)), "id": (new Date()).getTime() });
  }
}



app.use('/public', express.static(process.cwd() + '/public'));
app.use('/assets', express.static(process.cwd() + '/assets'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//For FCC testing purposes and enables user to connect from outside the hosting platform
app.use(cors({ origin: '*' }));

app.use(helmet());

// Prevent cross-site scripting (XSS) attacks
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"]
    }
  },
  xssFilter: true
}));

app.use(nocache());

app.use((req, res, next) => {
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('pragma', 'no-cache');
  res.setHeader('x-powered-by', 'PHP 7.4.3');
  next();
});
// Prevent client-side caching
const io = socketIo(server, {
  cors: {
    methods: ["GET", "POST"]
  }
});

// Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  });

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.emit('client ID', socket.id);

  socket.on('disconnect', () => {
    console.log("disconnect", socket.id);
    players = players.filter((player) => player.id != socket.id);
    verifyToken();
    io.emit('send changes', { "players": players, "collectible": token , "done": false });
  });

  socket.on("change coordinates", ({ player, flag }) => {
    let index = players.findIndex((e) => e.id == player.id);
    players[index] = player;
    if (flag)
      token = null;
    verifyToken();
    io.emit('send changes', { "players": players, "collectible": token ,"done": false });
  });


  socket.on("i win", ({ player }) => {
    let index = players.findIndex((e) => e.id == player.id);
    players[index] = player;
    token = null;
    verifyToken();
    io.emit('send changes', { "players": players, "collectible": token, "done": true });
  });

  socket.on("new player", (player) => {
    console.log(player);
    players.push(JSON.parse(player));

    verifyToken();


    io.emit('send changes', { "players": players, "collectible": token, "done":false });
  });

});

//For FCC testing purposes
fccTestingRoutes(app);

// 404 Not Found Middleware
app.use(function (req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

const portNum = process.env.PORT || 3000;

// Set up server and tests
server.listen(portNum, () => {
  console.log(`Listening on port ${portNum}`);
  if (process.env.NODE_ENV === 'test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch (error) {
        console.log('Tests are not valid:');
        console.error(error);
      }
    }, 1500);
  }
});

module.exports = app; // For testing
