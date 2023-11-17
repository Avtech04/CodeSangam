const express = require('express');
const app = express();
const http=require('http').Server(app);
const io = require('socket.io')(http);
const mongoose=require("mongoose");
const bodyParser=require("body-parser");
const { EventEmitter } = require('events');
const routes=require('./routes/authroutes');
const Room=require('./controllers/Room');
const Game=require('./controllers/Game');
const Canvas=require('./controllers/Canvas');
global.round = new EventEmitter();
global.blockedSockets = new Array() ;
//database connection
const connecttomongo=()=>{
    mongoose.connect("mongodb://127.0.0.1:27017/codesangam", { useNewUrlParser: true });
}
connecttomongo();


app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

//routes
app.use('/',routes)

// sockets connection
io.on('connection', (socket) => {
    console.log(`connected user ${socket.id}`);
    socket.on('create-private-room',async (player) => new Room(io, socket).createPrivateRoom(player))
    socket.on('joinRoom',async (data) => new Room(io, socket).joinRoom(data));
    socket.on('drawing',  (data) =>  new Canvas(io, socket).broadcastDrawing(data));
    socket.on('stopdrawing',  (data) =>  new Canvas(io, socket).stopDrawing());
    socket.on('clearCanvas',()=> new Canvas(io,socket).clearCanvas());
    socket.on('joinPublic', async(player)=> new Room(io,socket).joinPublic(player));
    socket.on('undodo',  () =>  new Canvas(io, socket).undoDo());

    socket.on('getPlayers', async () => { await new Game(io, socket).getPlayers(); });
    
    socket.on('redoDo',  () =>  new Canvas(io, socket).redoDo());
    socket.on('message',(data)=> new Game(io,socket).message(data));
    socket.on('startGame', async () => { await new Game(io, socket).startGame(); });
    socket.on('chatBlock', async(id)=> {await new Game(io, socket).pushSocket(id);} )
    socket.on('disconnect',()=>{
        console.log(`disconnected ${socket.id}`);
    })
    // socket.on('chooseWord', (word) =>{
    //     new Game(io, socket).startGame();
    // })
    socket.on('settingsUpdate', (data) => new Room(io, socket).updateSettings(data));
});



//starting server
http.listen(3001, () => {
    console.log(`Server listening on port 3001`);
});