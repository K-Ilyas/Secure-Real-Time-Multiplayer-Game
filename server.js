require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');

const expect = require('chai');
const socketIo = require('socket.io');

const cors = require('cors');

const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner.js');
const { platform } = require('os');
const { default: Player } = require('./public/Player.mjs');

const app = express();
const server = http.createServer(app);
var palyers = [];


app.use('/public', express.static(process.cwd() + '/public'));
app.use('/assets', express.static(process.cwd() + '/assets'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//For FCC testing purposes and enables user to connect from outside the hosting platform
app.use(cors({ origin: '*' }));

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
    palyers = palyers.filter((player) => player.id != socket.id);
    io.emit('send changes', palyers);
  });

  socket.on("change coordinates", (player) => {
    let palyerUpdate = JSON.parse(player);
    let index = palyers.findIndex((e) => e.id == palyerUpdate.id);
    palyers[index] = palyerUpdate;
    io.emit('send changes', palyers);
  });

  socket.on("new player", (player) => {
    console.log(player);
    palyers.push(JSON.parse(player));
    io.emit('send changes', palyers);
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
