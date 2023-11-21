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
    .route('/leaderboard')
    .get(authController.leaderBoard)
    .post(authController.leaderBoard)

router
    .route('/game')
    .get(authController.game);
router
    .route('/public')
    .post(authController.publicGame);
module.exports=router;