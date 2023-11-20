const mongoose=require("mongoose");

const playerSchema= new mongoose.Schema({
    username:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    rating:{
        type:Number,
        required:true,
        default:0
    },
    socketId:{
        type:String,
    },
    lastMatches:[],
},
{timestamps:true});

module.exports=mongoose.model('Player',playerSchema);