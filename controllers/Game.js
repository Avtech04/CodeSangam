const Rooms = require("../models/room");
var Filter = require("bad-words"),
  filter = new Filter();
const leven = require("leven");
const { get3Words, wait, returnScore } = require("./wordHelper");
const GraphemeSplitter = require("grapheme-splitter");
const { game } = require("./authController");
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
    if(id=== room.drawer)
    {
      socket.emit("profanity", {
        message: "You are the drawer, Can't Chat !",
        id: socket.id,
      });
      return;
    }
    for(var i=0;i < room.tempBlock.length;i++ )
    {
       if(room.tempBlock[i]=== id)
       {
        socket.emit("correctGuess", {
           message: "You have already guessed it",
           id: socket.id,
         });
          return ;
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
        /// 2 pei chat blocked
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

      room.tempBlock.push(id);

      // add Score
      var score2  = returnScore(room.startTime, room.limitTime);
    //  room.score[id] += score2;
      var ns=5;
      for(var i=0; i< room.players.length ;i++ )
      {
         if(room.players[i].socketId === id)
         {
          console.log(room.players[i].score);
          console.log(score2);
             ns= room.players[i].score + score2;
             room.players[i].score = ns; 
             room = await room.save() ;
            // console.log("ns is "+ ns);
            break;
         }
      }
     // console.log("Current Contri is " + score2);
    //  console.log("UPdated Score is " + ns);
      // emitting in game
      io.in(roomID).emit('updateScore', {
        playerID: socket.id,
        score: ns,
        // drawerID: drawer.id,
        // drawerScore: games[socket.roomID][drawer.id].score,
    });
      //console.log(score2);
    } else
     if (distance <= 3 && currentWord !== "")
     {
      io.in(roomId).emit("message", { ...data, name });
      socket.emit("closeGuess", { message: "That was very close!" });
    } else
     {
      // normal message
      io.in(roomId).emit("message", { ...data, name });
    }
  
   console.log(room);
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
    if (!room) 
    return;
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
    console.log(room.players);
    io.to(socket.roomId).emit("endGame", { stats: room.players });
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
    room.drawer=  player ;
    room.tempBlock={};
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
        

       // io.to(roomID).emit("clearCanvas");
       // drawer.to(roomID).broadcast.emit("hints", getHints(word, roomID));
       // games[roomID].startTime = Date.now() / 1000;
      //  console.log( Date.now()/1000 ) ;
        room.startTime= Date.now()/1000 ;
       console.log("Chosen Word is " + word);
       room= await room.save();
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
    // const players = Array.from(await io.in(roomID).allSockets());
    //    const acc= new Array();
    //    for(var i=0; i< players.length;i++)
    //    {
    //      const pl= players[i];
    //      const drawer = io.of("/").sockets.get(pl);
    //      acc.push(drawer);
    //     //  console.log(pl);
    //     //  console.log(drawer);
    //    }
   
    //    const PlayerData = new Array();
    //    for(var i=0;i<acc.length; i++)
    //    {
    //       var obj= {
    //          id : acc[i].id,
    //          name: acc[i].name
    //       }
    //       PlayerData.push(obj);
    //    }
    // io.in(roomID ).emit('getPlayers',PlayerData ) ;

    let room = await Rooms.findById(roomID);
    const players = room.players;
    for(var i=0;i< players.length;i++)
    {
        if(players[i].isAdmin === true )
        {
          const drawer = io.of("/").sockets.get(players[i].socketId);
          drawer.emit('getplayersA', players);
        }
        else
        {
          const drawer = io.of("/").sockets.get(players[i].socketId);
          drawer.emit('getPlayersO', players);
        }
    }
   }

   async kickPlayers(data){
    const{io,socket}=this;
    const players = Array.from(await io.in(socket.roomID).allSockets());
    const player = io.of("/").sockets.get(data);
    player.emit("endGame", { stats:{} });
   // console.log("kick is working");
    player.leave(socket.roomId);
    const players1 = Array.from(await io.in(socket.roomID).allSockets());
    console.log(players1);
}

}

module.exports = Game;
