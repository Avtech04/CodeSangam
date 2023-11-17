const Rooms = require("../models/room");
var Filter = require("bad-words"),
  filter = new Filter();
const leven = require("leven");
const { get3Words, wait } = require("./wordHelper");
const GraphemeSplitter = require("grapheme-splitter");
const splitter = new GraphemeSplitter();
class Game {
  constructor(io, socket) {
    this.io = io;
    this.socket = socket;
  }

  async startGame() {
    const { io, socket } = this;
  //  console.log("yes");
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
  async pushSocket (id)
  {
    const { io, socket } = this;
    const roomId = socket.roomId;
    let room = await Rooms.findById(roomId);
    room.blockedSockets.push(id);
    room= await room.save();
  }

  async message(data) {
    const { io, socket } = this;
    const roomId = socket.roomId;
    const name = socket.name;
    const roomID = socket.roomId;
    const id= socket.id;
    let room = await Rooms.findById(roomID);
    
    for(var i=0; i< room.blockedSockets.length ;i++)
    {
       var x= room.blockedSockets[i];
       if(x=== id)
       { 
           //console.log("User is blocked");
           socket.emit("profanity", {
            message: "You have been chat blocked!",
            id: socket.id,
          });
          return;
        }
    }

    var message = `${name}: data`;
    //  console.log(typeof(data));
    const currentWord = room.currentWord ;
    // console.log(currentWord);
    // console.log("in chat");
    const guess = data.message.toLowerCase().trim();
    if (guess === "") 
      return;
    const temp = filter.clean(guess);
    var pres = false;
    for (var i = 0; i < temp.length; i++) {
      if (temp[i] === "*") 
      {
        socket.emit("profanity", {
          message: "You are using wrong language",
          id: socket.id,
        });
        socket.broadcast.emit("profanity", {
          message: `${name} is using wrong language`,
          id: socket.id,
        });
        // updating the profanity cnt
        /// 3 pei chat blocked
        var found= false;
        for(var i=0; i< room.profanityCount.length ;i++)
        {
          // var x= room.profanityCount[i];
           if(room.profanityCount[i].id === id)
           {
              room.profanityCount[i].cnt +=1 ; 
              this.pushSocket(socket.id);
              found = true;
              break;
            }
        }
        if(found=== false)
        {
           var obj= {
             id: socket.id,
             cnt : 1,
           }
          room.profanityCount.push(obj);
        }
        room= await room.save();
     //  console.log(room.profanityCount );
        pres = true;
        return ;
      }
    }
    if (pres) 
      return;
    const distance = leven(guess, currentWord);
    // console.log(distance);
    if (distance === 0)
     {
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
    } else
     if (distance < 3 && currentWord !== "")
     {
      io.in(roomId).emit("message", { ...data, name });
      socket.emit("closeGuess", { message: "That was very close!" });
    } else
     {
      io.in(roomId).emit("message", { ...data, name });
    }
  }

 
  chosenWord(playerID) 
  {
    const { io } = this;
    return new Promise((resolve, reject) =>
     {
      function rejection(err) 
      {
        reject(err);
      }
      const socket = io.of("/").sockets.get(playerID);
     // console.log(socket);
    //  console.log(socket.roomId);
      socket.on("chooseWord", ({ word }) => {
        socket.to(socket.roomId).emit("hideWord", 
        {
          word: splitter
            .splitGraphemes(word)
            .map((char) => (char !== " " ? "_" : char))
            .join("") ,
        }
        );
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
    // console.log("Players Array IS");
    // console.log(players);
   socket.to(socket.roomId).emit("startGame");
    for (let j = 0; j < rounds; j++) {
      for (let i = 0; i < players.length; i++) {
       await this.giveTurnTo(players, i);
      // console.log("GAME IS RUNNING");
      }
    }
   // console.log("GAME HAS ENDED");
    io.to(socket.roomID).emit("endGame", { stats: room });
    // delete the room

  }
  async giveTurnTo(players, i) 
  {
    const { io, socket } = this;
    const roomID = socket.roomId;
    let room = await Rooms.findById(roomID);
    if (!room)
     return;
    const time = room.limitTime;
    const player = players[i];
    const prevPlayer = players[(i - 1 + players.length) % players.length];
    const drawer = io.of("/").sockets.get(player);

    // console.log("Just Checking"); 
    // console.log(player);
    // console.log(drawer);

    if (!drawer || !room) 
       return;
    // this.resetGuessedFlag(players);
    // games[roomID].totalGuesses = 0;
    // games[roomID].currentWord = "";
  //  console.log(room);
    room.currentWord = "";

    //  games[roomID].drawer = player;
    //  io.to(prevPlayer).emit("disableCanvas");
    // console.log(drawer);
  //  console.log(drawer.name + " is choosing");
    drawer.to(roomID).broadcast.emit("choosing", { name: drawer.name });
    // console.log(room);
  //  io.to(player).emit("chooseWord", get3Words());

     try {
      io.to(player).emit("chooseWord", get3Words());
        const word = await this.chosenWord(player);
        room.currentWord= word ;
         room= await room.save();

       // io.to(roomID).emit("clearCanvas");
       // drawer.to(roomID).broadcast.emit("hints", getHints(word, roomID));
       // games[roomID].startTime = Date.now() / 1000;

       console.log("Chosen Word is " + word);
        io.to(roomID).emit("startTimer", time );

        if (await wait(roomID, drawer, time))
          drawer.to(roomID).broadcast.emit("lastWord", word );

      } catch (error) {
        console.log(error);
      }
   // console.log("DONE");
  }
  async getPlayers()
   {
    // console.log("LUFFY ");
    const { io, socket } = this;
    const roomID = socket.roomId;
    const players = Array.from(await io.in(roomID).allSockets());
  //   players.reduce((acc, id) => {
  //     const { player } = io.of('/').sockets.get(id);
  //     acc.push(player);
  //     console.log();
  // });

  //    io.in(roomID ).emit('getPlayers', "arpit" ) ;
  //    const { pq } = io.of('/').sockets.get(players[0]) ;
  //    console.log("PQ is");
  //    console.log(pq);
  //  console.log("Players Array is ");
  //      console.log(players);

       const acc= new Array();
       for(var i=0; i< players.length;i++)
       {
         const pl= players[i];
         const drawer = io.of("/").sockets.get(pl);
         acc.push(drawer);
        //  console.log(pl);
        //  console.log(drawer);
       }
      // console.log(acc);
       const PlayerData = new Array();
       for(var i=0;i<acc.length; i++)
       {
          var obj= {
             id : acc[i].id,
             name: acc[i].name
          }
          PlayerData.push(obj);
       }
    io.in(roomID ).emit('getPlayers',PlayerData ) ;

   }
}

module.exports = Game;
