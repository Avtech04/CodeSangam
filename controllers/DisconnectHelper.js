const Rooms = require("../models/room");
class DisconnectHelper
{
    constructor(io, socket) {
        this.io = io;
        this.socket = socket;
    }

    async onDisconnect() {
        const { io, socket } = this;
        socket.emit('removeID' , socket.id );
        const roomID = socket.roomId;

        let room = await Rooms.findById(roomID);
        const curSocket = socket.id;
        io.to(roomID).emit('updateScoreBoard', curSocket );

        if(!room)
        return ;

        const players = room.players; 
        //remove item with socketID = curSocket
        const itemToBeRemoved = {socketId: curSocket };
     
        players.splice(players.findIndex(a => a.socketId === itemToBeRemoved.socketId) , 1);
        room.players= players;
        room.markModified('players');
        room= await room.save();
    }
}

module.exports = DisconnectHelper;