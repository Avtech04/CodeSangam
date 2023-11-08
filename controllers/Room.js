const Rooms=require('../models/room')
class Room {
    constructor(io, socket) {
        this.io = io;
        this.socket = socket;
    }

    async createPrivateRoom(player) {
        console.log(player);
        const { io,socket } = this;
        let user={
            name:player.username,
            score:0,
            socketId:socket.id,
            userId:player._id
        }
        var room= new Rooms();
        room.Type='Private';
        room.admin=player._id;
        room.players.push(user);
        room= await room.save();
        var roo=String(room._id);
        socket.join(roo);
        socket.to(roo).emit('joinRoom', user);
        socket.emit('newPrivateRoom', { gameID: roo ,user});
    }

    async joinRoom(data) {
        const { io, socket } = this; 
        console.log(data);
        const roomID = data.roomId;
        let user={
            name:data.user.username,
            score:0,
            socketId:socket.id,
            userId:data.user._id
        }
        let room=await Rooms.findById(roomID);
        room.players.push(user);
        room=await room.save();

        socket.join(roomID);
        socket.to(roomID).emit('joinRoom', user);
        const players=room.players;
        socket.emit('otherPlayers',{players})
    }

    updateSettings(data) {
        const { socket } = this;
        const { customWords, ...rest } = data;
        games[socket.roomID].time = Number(data.time) * 1000;
        games[socket.roomID].rounds = Number(data.rounds);
        games[socket.roomID].probability = Number(data.probability);
        games[socket.roomID].customWords = customWords;
        games[socket.roomID].language = data.language;
        socket.to(socket.roomID).emit('settingsUpdate', rest);
        console.log(games[socket.roomID]);
    }
}

module.exports = Room;
