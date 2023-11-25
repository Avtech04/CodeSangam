const Rooms = require("../models/room");
const PlayerSchema = require("../models/player");
var Filter = require("bad-words"),
  filter = new Filter();
const leven = require("leven");
const {
  get3Words,
  wait,
  returnScore,
  returnScoreDrawer,
} = require("./wordHelper");
const GraphemeSplitter = require("grapheme-splitter");
const { game } = require("./authController");
const splitter = new GraphemeSplitter();
const cloudinary = require("cloudinary").v2;

// for storing the image to be shared
cloudinary.config({
  cloud_name: "dtj2sixay",
  api_key: "976534766916839",
  api_secret: "EriTFMp-vpP2J6WXl7c9qS_HLv0",
  secure: true,
});

// Defining the class Game

class Game {
  constructor(io, socket, ct = 0) {
    this.io = io;
    this.socket = socket;
    this.ct = ct;
  }

  // function for starting the game

  async startGame() {
    const { io, socket } = this;
    const roomId = socket.roomId;
    let room = await Rooms.findById(roomId);
    const rounds = room.rounds;
    const players = Array.from(await io.in(socket.roomId).allSockets());
    socket.to(socket.roomId).emit("startGame");

    for (let i = 0; i < players.length; i++) {
      await io.to(players[i]).emit("disableCanvas");
    }

    this.getPlayers();

    socket.emit("startGame");

    console.log(rounds);
    for (let j = 0; j < rounds; j++) {
      // console.log(j);
      for (let i = 0; i < players.length; i++) {
        //   console.log('inside');
        io.to(roomId).emit("clearCanvas");
        const player2 = Array.from(await io.in(socket.roomId).allSockets());
        if (player2.length == 1) {
          // if only 1 player is left , just return ;
          console.log(room.players);
          const stats = room.players;
          io.to(roomId).emit("endGame", stats);
          return;
        }
        await this.giveTurnTo(players, i);

        await this.Drawer_update(players[i]);
      }
    }
    let room2 = await Rooms.findById(roomId);
    const stats = room2.players;
    console.log(stats);
    io.to(roomId).emit("endGame", stats);
    // updating score
    for (var i = 0; i < stats.length; i++) {
      if (stats[i].userId == undefined) continue;
      let pla = await PlayerSchema.findOne({ _id: stats[i].userId });
      pla.lastMatches.push(roomId);
      pla.markModified("lastMatches");
      pla = await pla.save();
    }
    if (room2.Type === "Public") {
      for (var i = 0; i < stats.length; i++) {
        if (stats[i].userId == undefined) continue;
        let pla = await PlayerSchema.findOne({ _id: stats[i].userId });
        console.log(pla);
        pla.rating += stats[i].score;
        pla.markModified("rating");
        pla = await pla.save();
      }
    }
  }

  // Function to update the drawer
  async Drawer_update(drawer) {
    const { socket, io } = this;
    const roomId = socket.roomId;
    const players = Array.from(await io.in(socket.roomId).allSockets());
    var room = await Rooms.findById(roomId);
    var ns1 = returnScoreDrawer(players.length - 1, room.tempBlock.length - 1);
    for (var k = 0; k < room.players.length; k++) {
      if (room.players[k].socketId === drawer) {
        room.players[k].score += ns1;
        ns1 = room.players[k].score;
        break;
      }
    }
    room.markModified("tempBlock");
    room.markModified("players");
    await room.save();
    io.in(roomId).emit("updateScore", {
      playerID: drawer,
      score: ns1,
    });
  }

  // Function to  change the turn
  async giveTurnTo(players, i) {
    const { io, socket } = this;
    const roomId = socket.roomId;

    const curp = Array.from(await io.in(roomId).allSockets());
    var pres = false;
    for (var ii = 0; ii < curp.length; ii++) {
      if (curp[ii] == players[i]) {
        pres = true;
      }
    }
    if (pres === false) return;

    let room = await Rooms.findById(roomId);

    const time = room.limitTime;
    const player = players[i];
    const prevPlayer = players[(i - 1 + players.length) % players.length];
    const drawer = io.of("/").sockets.get(player);
    room.drawer = player;
    room.tempBlock = {};

    if (!drawer || !room) return;
    io.to(prevPlayer).emit("disableCanvas");
    drawer.to(roomId).broadcast.emit("choosing", { name: drawer.name });

    io.to(player).emit("chooseWord", await get3Words(roomId));
    try {
      const word = await this.chosenWord(player);
      io.to(player).emit("enableCanvas");
      room.currentWord = word;
      const startTime = Date.now() / 1000;
      room.startTime = startTime;
      await room.save();
      io.to(roomId).emit("startTimer", time);
      if (await wait(startTime, drawer, time)) {
        drawer.to(roomId).broadcast.emit("lastWord", word);
      }
    } catch (error) {
      console.log(error);
    }
  }

  chosenWord(socketId) {
    const { io } = this;
    return new Promise((resolve, reject) => {
      function rejection(err) {
        reject(err);
      }
      const socket = io.of("/").sockets.get(socketId);
      socket.on("chooseWord", ({ word }) => {
        socket.to(socket.roomId).emit("hideWord", {
          word: splitter
            .splitGraphemes(word)
            .map((char) => (char !== " " ? "_" : char))
            .join(""),
        });
        resolve(word);
      });
    });
  }

  // function to push the socket

  async pushSocket(id) {
    const { io, socket } = this;
    const roomId = socket.roomId;
    let room = await Rooms.findById(roomId);
    room.blockedSockets.push(id);
    room = await room.save();
  }

  // function to detect the chats
  async message(data) {
    const { io, socket } = this;
    const roomId = socket.roomId;
    const name = socket.name;
    const roomID = socket.roomId;
    const id = socket.id;
    let room = await Rooms.findById(roomID);

    for (var i = 0; i < room.blockedSockets.length; i++) {
      var x = room.blockedSockets[i];
      if (x === id) {
        //console.log("User is blocked");
        socket.emit("profanity", {
          message: "You have been chat blocked!",
          id: socket.id,
        });
        return;
      }
    }
    if (id === room.drawer) {
      socket.emit("profanity", {
        message: "You are the drawer, Can't Chat !",
        id: socket.id,
      });
      return;
    }

    for (var i = 0; i < room.tempBlock.length; i++) {
      if (room.tempBlock[i] === id) {
        socket.emit("correctGuess", {
          message: "You have already guessed it",
          id: socket.id,
        });
        return;
      }
    }

    var message = `${name}: data`;
    const currentWord = room.currentWord;

    const guess = data.message.toLowerCase().trim();
    if (guess === "") return;
    const temp = filter.clean(guess);
    var pres = false;
    for (var i = 0; i < temp.length; i++) {
      if (temp[i] === "*") {
        socket.emit("profanity", {
          message: "You are using wrong language",
          id: socket.id,
        });
        socket.broadcast.emit("profanity", {
          message: `${name} is using wrong language`,
          id: socket.id,
        });
        // updating the profanity cnt
        /// 2 pei chat blocked
        var found = false;
        for (var i = 0; i < room.profanityCount.length; i++) {
          // var x= room.profanityCount[i];
          if (room.profanityCount[i].id === id) {
            // console.log(room.profanityCount[i].cnt) ;
            room.profanityCount[i].cnt += 1;
            if (room.profanityCount[i].cnt === 3) this.pushSocket(socket.id);
            found = true;
            break;
          }
        }
        if (found === false) {
          var obj = {
            id: socket.id,
            cnt: 1,
          };
          room.profanityCount.push(obj);
        }
        room.markModified("profanityCount");
        room = await room.save();
        pres = true;
        return;
      }
    }
    if (pres) return;
    const distance = leven(guess, currentWord);
    // console.log(distance);
    if (distance === 0) {
      console.log("GUESSED");
      // socket.emit('message', { ...data, name: socket.player.name });
      socket.emit("correctGuess", {
        message: "You guessed it right",
        id: socket.id,
        guess: true,
      });
      socket.broadcast.emit("correctGuess", {
        message: `${name} has guessed the correct answer`,
        id: socket.id,
        guess: false,
      });

      room.tempBlock.push(id);
      socket.emit("displayWord", { word: guess });
      // add Score
      console.log(returnScore(room.startTime, room.limitTime));
      var score2 = returnScore(room.startTime, room.limitTime);
      //  room.score[id] += score2;
      var ns = 5;

      for (var i = 0; i < room.players.length; i++) {
        if (room.players[i].socketId === id) {
          //  console.log(room.players[i].score);
          //  console.log(score2);

          room.players[i].score += score2;
          ns = room.players[i].score;
          break;
        }
      }
      room.markModified("tempBlock");
      room.markModified("players");
      room = await room.save();

      // console.log("Current Contri is " + score2);
      //  console.log("UPdated Score is " + ns);
      // emitting in game
      io.in(roomID).emit("updateScore", {
        playerID: socket.id,
        score: ns,
        // drawerID: drawer.id,
        // drawerScore: games[socket.roomID][drawer.id].score,
      });
      //console.log(score2);
      const curp = Array.from(await io.in(roomId).allSockets());

      // console.log(room.profanityCount );
      // console.log(room.tempBlock.length);
      // console.log(curp.length);
      if (room.tempBlock.length >= curp.length) {
        // ct=1;
        // await this.Drawer_update(room.drawer);
        io.in(roomId).emit("startTimer", 0);
        round.emit("everybodyGuessed", { roomID: roomID });
      }
    } else if (distance <= 3 && currentWord !== "") {
      io.in(roomId).emit("message", { ...data, name });
      socket.emit("closeGuess", { message: "That was very close!" });
    } else {
      // normal message
      io.in(roomId).emit("message", { ...data, name });
    }
    // let room2 = await Rooms.findById(roomID);
    // console.log(room2.players);
    //  console.log(room.players);
  }

  // function to get the players
  async getPlayers() {
    const { io, socket } = this;
    const roomID = socket.roomId;
    // console.log("INSDE GET PLAYERS ");
    let room = await Rooms.findById(roomID);
    if (room.Type === "Public") {
      console.log("I am here in public ");
      const players = room.players;
      console.log(players);
      for (let i = 0; i < players.length; i++) {
        const drawer = io.of("/").sockets.get(players[i].socketId);
        drawer.emit("getPlayersO", players);
      }
      return;
    }

    const players = room.players;
    for (var i = 0; i < players.length; i++) {
      if (players[i].isAdmin === true) {
        const drawer = io.of("/").sockets.get(players[i].socketId);
        drawer.emit("getplayersA", players);
      } else {
        const drawer = io.of("/").sockets.get(players[i].socketId);
        drawer.emit("getPlayersO", players);
      }
    }
  }

  //  function to kick the player
  async kickPlayers(data) {
    const { io, socket } = this;
    //  const players = Array.from(await io.in(socket.roomID).allSockets());
    const player = io.of("/").sockets.get(data);
    const roomID = socket.roomId;
    let room = await Rooms.findById(roomID);
    var stats = room.players;
    player.emit("endGame", stats);
    this.kickEffect(player);
    // console.log("kick is working");
    player.leave(socket.roomId);
    const players1 = Array.from(await io.in(socket.roomID).allSockets());
    //console.log(players1);
    //this.getPlayers();
  }
  async kickEffect(pSocket) {
    //remove it from DB ;
    // and from the score Board
    const { io, socket } = this;
    const roomID = socket.roomId;

    let room = await Rooms.findById(roomID);
    const curSocket = pSocket.id;
    const players = room.players;
    //remove item with socketID = curSocket
    const itemToBeRemoved = { socketId: curSocket };
    io.to(roomID).emit("updateScoreBoard", curSocket);
    players.splice(
      players.findIndex((a) => a.socketId === itemToBeRemoved.socketId),
      1
    );
    room.players = players;
    room.markModified("players");
    room = await room.save();
  }
}

module.exports = Game;
