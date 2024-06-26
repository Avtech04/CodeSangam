const mongoose=require('mongoose');

const roomSchema= new mongoose.Schema({
    Type:{
        type:String,
        required:true,
        default:'Public'
    },
    rounds:{
        type:Number,
        required:true,
        default:'2' ,
    },
    currentWord:{
      type:String,
      default:"codesangam",  
    },
    limitTime:{
        type:Number,
        required:true,
        default: 10000, 
    },
    admin:{
        type:String
    },
    drawer:{
        type:String
    },
    roomID:{
        type:String
    },
    players:{
        type:Array 
    },
    blockedSockets:[] , // consists of socketID of blocked sockets
    profanityCount:[], // key value pair DS to store blocked warnings
    tempBlock:[],
    capacity:{
        type:Number
    },
    startTime :{
        type:Number,
    },
},
{timestamps:true});


module.exports=mongoose.model('Room',roomSchema);