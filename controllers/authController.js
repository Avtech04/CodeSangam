const path=require('path');
const Player=require('../models/player');
var filePath=path.join(__dirname, '..')
var roomID;

exports.homepage=(req,res)=>{
    res.sendFile(filePath+ '/Home.html');
    roomID=undefined;
}

exports.loginPage=(req,res)=>{
    res.sendFile(filePath+'/login.html');
}
exports.signupPage=(req,res)=>{
    res.sendFile(filePath+'/signup.html');
}
exports.signup=async (req,res)=>{
    var {first_name,email,password,confirm_password}=req.body;
    try{
        var user=await Player.findOne({email});
        console.log(user);
        if(!user){
            user=await Player({
                username:first_name,
                email,
                password
            });
            await user.save({ validateBeforeSave: false });
            console.log(user);
            res.render('index',{user,roomID});
        }
 
    }catch(error){
        res.status(400).json({
            message:error,
            status:'fail'
        })
    }
}
exports.login=async (req,res)=>{
    var {email,password}=req.body;
    try{
        var user=await Player.findOne({email});
        if(user&&(user.password==password)){
            res.render('index',{user,roomID});
        }

    }catch(err){
        res.status(400).json({
            message:error,
            status:'fail'
        })
    }
}
exports.game=(req,res)=>{
    roomID=req.query.id;
    res.redirect('/login');
}