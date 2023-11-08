const express = require('express');
const app = express();
const http=require('http').Server(app);
const io = require('socket.io')(http);
const mongoose=require("mongoose");
const bodyParser=require("body-parser");
const routes=require('./routes/authroutes');
const Room=require('./controllers/Room');

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
    socket.on('disconnect',()=>{
        console.log(`disconnected ${socket.id}`);
    })
});



//starting server
http.listen(3001, () => {
    console.log(`Server listening on port 3001`);
});