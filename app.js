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



//starting server
http.listen(3001, () => {
    console.log(`Server listening on port 3001`);
});