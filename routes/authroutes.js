const express=require('express');
const router=express.Router();
const authController=require('../controllers/authController');

router
    .route('/')
    .get(authController.homepage)

router
    .route('/login')
    .get(authController.loginPage)
    .post(authController.login)

router
    .route('/signup')
    .get(authController.signupPage)
    .post(authController.signup)

router
    .route('/game')
    .get(authController.game);

module.exports=router;