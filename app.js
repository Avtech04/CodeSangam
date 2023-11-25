const express = require("express");
const app = express();
const path = require("path");
const cloudinary = require("cloudinary").v2;
const http = require("http").Server(app);
const io = require("socket.io")(http);
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const { EventEmitter } = require("events");
const routes = require("./routes/authroutes");
const Room = require("./controllers/Room");
const Game = require("./controllers/Game");
const DisconnectHelper = require("./controllers/DisconnectHelper");
const Canvas = require("./controllers/Canvas");
global.round = new EventEmitter();

//database connection
const connecttomongo = () => {
  mongoose.connect("mongodb://127.0.0.1:27017/codesangam", {
    useNewUrlParser: true,
  });
};
connecttomongo();

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

//routes
app.use("/", routes);

cloudinary.config({
  cloud_name: "dtj2sixay",
  api_key: "976534766916839",
  api_secret: "EriTFMp-vpP2J6WXl7c9qS_HLv0",
  secure: true,
});

// sockets connection
io.on("connection", (socket) => 
{
  console.log(`connected user ${socket.id}`);
  socket.on("create-private-room", async (player) =>
    new Room(io, socket).createPrivateRoom(player)
  );
  socket.on("joinRoom", async (data) => new Room(io, socket).joinRoom(data));
  socket.on("drawing", async (data) => new Canvas(io, socket).broadcastDrawing(data));
  socket.on('drawRect',(data)=>new Canvas(io,socket).drawRectangle(data));
  socket.on('stopRect',(data)=>new Canvas(io,socket).stopRectangle(data));
  socket.on('drawCircle',(data)=>new Canvas(io,socket).drawCircle(data));
  socket.on('stopCircle',(data)=>new Canvas(io,socket).stopCircle(data));
  socket.on('drawLine',(data)=>new Canvas(io,socket).drawLine(data));
  socket.on('stopLine',(data)=>new Canvas(io,socket).stopLine(data));
  socket.on('bucketFill',(data)=> new Canvas(io,socket).bucketFill(data));
  socket.on('eraser',(data)=>new Canvas(io,socket).eraser(data));
  socket.on('stopEraser',()=>new Canvas(io,socket).stopEraser());
  socket.on("stopdrawing", (data) => new Canvas(io, socket).stopDrawing());
  socket.on("clearCanvas", () => new Canvas(io, socket).clearCanvas());
  socket.on("joinPublic", async (player) =>
    new Room(io, socket).joinPublic(player)
  );
  socket.on("undodo", () => new Canvas(io, socket).undoDo());

  socket.on("getPlayers", async () => {
    await new Game(io, socket).getPlayers();
  });

  socket.on("redoDo", () => new Canvas(io, socket).redoDo());
  socket.on("message", (data) => new Game(io, socket).message(data));
  socket.on("startGame", async () => {
    await new Game(io, socket).startGame();
  });
  socket.on("chatBlock", async (id) => {
    await new Game(io, socket).pushSocket(id);
  });
  socket.on("disconnect", async () => {
    await new DisconnectHelper(io, socket).onDisconnect();
    console.log(`disconnected ${socket.id}`);
  });
  socket.on("settingsUpdate", (data) =>{
    console.log(data);
    new Room(io, socket).updateSettings(data);

  }
    
  );
  socket.on("KickPlayer", async (data) => {
    await new Game(io, socket).kickPlayers(data);
  });

  socket.on("shareSocials", async () => {
    const filePath = path.join(__dirname + "/canvas_images/filename.png");
    console.log(filePath);
    cloudinary.uploader
      .upload(filePath)
      .then((result) => {
        console.log("hi");
        console.log(result.url);
        socket.emit("shareSocials", result.url);
      })
      .catch((error) => console.log(error));
  });
});

//starting server
http.listen(3001, () => {
  console.log(`Server listening on port 3001`);
});
