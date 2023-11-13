const Rooms=require('../models/room')

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
        io.in(roomId).emit('message',{...data,name});
    }
}

module.exports = Game;
