require('dotenv').config();

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173", 
  }
});

app.use(cors());

const allUsers = {};
const allRooms = [];

io.on("connection", (socket) => {
  console.log("New connection:", socket.id);
  allUsers[socket.id] = {
    socket: socket,
    online: true,
    playing: false,
  };

  socket.on("request_to_play", (data) => {
    const currentUser = allUsers[socket.id];
    currentUser.playername = data.playername;

    let opponentPlayer = null;

    for (const key in allUsers) {
      const user = allUsers[key];
      if (user.online && !user.playing && socket.id !== key) {
        opponentPlayer = user;
        break;
      }
    }

    if (opponentPlayer) {
      currentUser.playing = true;
      opponentPlayer.playing = true;

      allRooms.push({
        player1: currentUser,
        player2: opponentPlayer,
      });

      currentUser.socket.emit("OpponentFound", {
        opponent: opponentPlayer.playername,
        playingAs: "circle",
      });

      opponentPlayer.socket.emit("OpponentFound", {
        opponent: currentUser.playername,
        playingAs: "cross",
      });

      currentUser.socket.on("clientMove", (data) => {
        opponentPlayer.socket.emit("serverMove", {
          ...data,
        });
      });

      opponentPlayer.socket.on("clientMove", (data) => {
        currentUser.socket.emit("serverMove", {
          ...data,
        });
      });

      currentUser.socket.on("chatMessage", (msg) => {
        opponentPlayer.socket.emit("chatMessage", msg);
      });

      opponentPlayer.socket.on("chatMessage", (msg) => {
        currentUser.socket.emit("chatMessage", msg);
      });
    } else {
      currentUser.socket.emit("OpponentNotFound");
    }
  });

  socket.on("disconnect", () => {
    const currentUser = allUsers[socket.id];
    currentUser.online = false;

    for (let index = 0; index < allRooms.length; index++) {
      const { player1, player2 } = allRooms[index];

      if (player1.socket.id === socket.id) {
        player2.socket.emit("opponentLeft");
        player2.playing = false;
        allRooms.splice(index, 1);
        break;
      }

      if (player2.socket.id === socket.id) {
        player1.socket.emit("opponentLeft");
        player1.playing = false;
        allRooms.splice(index, 1);
        break;
      }
    }

    delete allUsers[socket.id];
  });
});

server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});