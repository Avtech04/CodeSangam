const Rooms=require('../models/room');
const Game=require('./Game');
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
            score: 0 ,
            socketId:socket.id,
            userId:player._id,
            isAdmin: true ,
        }
        var room= new Rooms();
        room.Type='Private';
        room.admin=player._id;
        room.players.push(user);
        room= await room.save();
        var roo=String(room._id);
        socket.roomId=roo;
        socket.name=player.username;
        socket.join(roo);
        socket.to(roo).emit('joinRoom', user);
        socket.emit('newPrivateRoom', { gameID: roo ,user});
    }

    async joinRoom(data)
     {
        const { io, socket } = this; 
        console.log(data);
        const roomID = data.roomId;
        let user={
            name:data.user.username,
            score: 0 ,
            socketId:socket.id,
            userId:data.user._id,
            isAdmin : false,
        }
        let room=await Rooms.findById(roomID);
        room.players.push(user);
        room=await room.save();
        socket.roomId=roomID;
        socket.name=data.user.username;
        socket.join(roomID);
        socket.to(roomID).emit('joinRoom', user);
        const players=room.players;
        socket.emit('otherPlayers',{players});
    }

    async joinPublic(player){
        const { io, socket } = this; 
        let room =await Rooms.find({Type:'Public',capacity:{$lt:4}});
        console.log(player);
        console.log(room);
        var room_id;
        let user={
            name:player.username,
            score:0,
            socketId:socket.id,
            userId:player._id
        }
        if(room.length==0){
            room= new Rooms();
            room.Type='Public';
            room.players.push(user);
            room.capacity=1;
            room= await room.save();
            
        }else{
            console.log("yes");
            room=room[0];
            
            room.players.push(user);
            room.capacity+=1;
            room= await room.save();
        }
        room_id=String(room._id);
        socket.join(room_id);
        socket.roomId=room_id;
        socket.name=player.username;
        socket.to(room_id).emit('joinPublicRoom', user);
        const players=room.players;
        socket.emit('otherPublicPlayers',{players});
        if(room.capacity==4){
            console.log("yes");
            await new Game(io,socket).startGame();
        }
    }
    async updateSettings(data)
    {
        const { socket } = this;
        const { customWords, ...rest } = data;
        let room=await Rooms.findById(socket.roomId);
        room.limitTime= Number(data.time) * 1000;
        room.rounds= Number(data.rounds);
        room=await room.save();
        socket.to(socket.roomId).emit('settingsUpdate', rest);
        // console.log("SETTINGS UPDATED");
    }
   


    
}

module.exports = Room;
