const Rooms = require("../models/room");
var Filter = require("bad-words"),
  filter = new Filter();
const leven = require("leven");
const { get3Words } = require("./wordHelper");
const GraphemeSplitter = require("grapheme-splitter");
const splitter = new GraphemeSplitter();
class Game {
  constructor(io, socket) {
    this.io = io;
    this.socket = socket;
  }

  async startGame() {
    const { io, socket } = this;
    console.log("yes");
    const players = Array.from(await io.in(socket.roomId).allSockets());
    console.log(players);
    socket.to(socket.roomId).emit("startGame");
  }

  async getPlayers() {
    const { io, socket } = this;
    let room = await Rooms.findById(socket.roomId);
    const players = room.players;
    io.in(socket.roomId).emit("getPlayers", { players });
  }

  message(data) {
    const { io, socket } = this;
    const roomId = socket.roomId;
    const name = socket.name;

    var message = `${name}: data`;
    //  console.log(typeof(data));
    const currentWord = "codesangam";

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
        pres = true;
        break;
      }
    }
    if (pres) return;
    const distance = leven(guess, currentWord);
    console.log(distance);
    if (distance === 0) {
      console.log("GUESSED");
      // socket.emit('message', { ...data, name: socket.player.name });
      socket.emit("correctGuess", {
        message: "You guessed it right",
        id: socket.id,
      });
      socket.broadcast.emit("correctGuess", {
        message: `${name} has guessed the correct answer`,
        id: socket.id,
      });
    } else if (distance < 3 && currentWord !== "") {
      io.in(roomId).emit("message", { ...data, name });
      socket.emit("closeGuess", { message: "That was very close!" });
    } else {
      io.in(roomId).emit("message", { ...data, name });
    }
  }

 
  chosenWord(playerID) {
    const { io } = this;
    return new Promise((resolve, reject) =>
     {
      function rejection(err) 
      {
        reject(err);
      }
      const socket = io.of("/").sockets.get(playerID);
      socket.on("chooseWord", ({ word }) => {
        socket.to(socket.roomID).emit("hideWord", {
          word: splitter
            .splitGraphemes(word)
            .map((char) => (char !== " " ? "_" : char))
            .join(""),
        });
        socket.removeListener("disconnect", rejection);
        resolve(word);
      });
      socket.once("disconnect", rejection);
    });
  }

  async startGame() {
    const { io, socket } = this;
    let room = await Rooms.findById(socket.roomId);
    if (!room) return;
    const rounds = room.rounds;
    const players = Array.from(await io.in(socket.roomId).allSockets());
    console.log("Players Array IS");
    console.log(players);
   // socket.to(socket.roomId).emit("startGame");
    for (let j = 0; j < rounds; j++) {
      for (let i = 0; i < players.length; i++) {
       await this.giveTurnTo(players, i);
       console.log("GAME IS RUNNING");
      }
    }
    // io.to(socket.roomID).emit("endGame", { stats: room });
    // delete the room
  }
  async giveTurnTo(players, i) {
    const { io, socket } = this;
    const roomID = socket.roomId;
    let room = await Rooms.findById(roomID);
    if (!room) return;
    const time = room.limitTime;
    const player = players[i];
    const prevPlayer = players[(i - 1 + players.length) % players.length];
    const drawer = io.of("/").sockets.get(player);
    if (!drawer || !room) 
       return;
    // this.resetGuessedFlag(players);
    // games[roomID].totalGuesses = 0;
    // games[roomID].currentWord = "";
    console.log(room);
    room.currentWord = "";

    //  games[roomID].drawer = player;
    //  io.to(prevPlayer).emit("disableCanvas");
    // console.log(drawer);
    console.log(drawer.name + " is choosing");
    drawer.to(roomID).broadcast.emit("choosing", { name: drawer.name });
    // console.log(room);
  //  io.to(player).emit("chooseWord", get3Words());

     try {
      io.to(player).emit("chooseWord", get3Words());
        const word = await this.chosenWord(player);
        room.currentWord= word ;
       // room= await room.save();
       // io.to(roomID).emit("clearCanvas");
       // drawer.to(roomID).broadcast.emit("hints", getHints(word, roomID));
       // games[roomID].startTime = Date.now() / 1000;
        console.log("Chosen Word is " + word);
        io.to(roomID).emit("startTimer", time );
        // if (await wait(roomID, drawer, time))
        //   drawer.to(roomID).broadcast.emit("lastWord", { word });
      } catch (error) {
        console.log(error);
      }
  }
}

module.exports = Game;
