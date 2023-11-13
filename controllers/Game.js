const Rooms=require('../models/room')
var Filter = require('bad-words'),
 filter = new Filter();
const leven = require('leven');
class Game {
    constructor(io, socket) 
    {
        this.io = io;
        this.socket = socket;
    }

    async startGame() {
        const { io, socket } = this;
        console.log("yes");
        const players = Array.from(await io.in(socket.roomId).allSockets());
        console.log(players);
        socket.to(socket.roomId).emit('startGame');
    }

   
    async getPlayers() {
        const { io, socket } = this;
        let room=await Rooms.findById(socket.roomId);
        const players=room.players;
        io.in(socket.roomId).emit('getPlayers',{players});
    }

    message(data){
        const{io,socket}=this;
        const roomId=socket.roomId;
        const name=socket.name;

        var message=`${name}: data`;
      //  console.log(typeof(data));
      const currentWord = "codesangam" ;

        const guess = data.message.toLowerCase().trim();
        if (guess === '')
        return;
        const temp= filter.clean(guess);
        var pres= false;
        for(var i=0;i< temp.length ;i++)
        {
            if( temp[i]=== '*')
            {
               socket.emit('profanity', { message: 'You are using wrong language', id: socket.id });
               socket.broadcast.emit('profanity', { message: `${name} is using wrong language`, id: socket.id });
                pres=true;
                break;
            }
        }
        if(pres)
        return ;
        const distance = leven(guess, currentWord);
        console.log(distance);
        if (distance == 0 ) 
        {
            console.log('GUESSED');
            // socket.emit('message', { ...data, name: socket.player.name });
            socket.emit('correctGuess', 
            { message: 'You guessed it right', id: socket.id });
            socket.broadcast.emit('correctGuess', { message: `${name} has guessed the correct answer`, id: socket.id });
        }
         else
         if (distance < 3 && currentWord !== '') 
         {
            // io.in(socket.roomID).emit('message', { ...data, name: socket.player.name });
           // if (games[socket.roomID].drawer !== socket.id && !socket.hasGuessed) 
           io.in(roomId).emit('message',{...data,name});
            socket.emit('closeGuess', { message: 'That was very close!' });
        }
         else 
        {
            io.in(roomId).emit('message',{...data,name});
        }
       //io.in(roomId).emit('message',{...data,name});
    }
}

module.exports = Game;
