const express = require('express')
const router = express.Router()
const UserController = require('../controllers/userController')
const Auth = require('../middleWares/auth')

//test-api
router.get('/test-me',  function(req, res){
    res.send({status:true, message : "test-api working fine"})
})

//*********************************USER API************************************************** */
router.post('/register', UserController.userRegistration)
router.post('/login', UserController.userLogin)
router.get('/user/:userId/profile', Auth.authentication, Auth.authorization, UserController.profileDetails)
router.post('/user/:userId/profile', Auth.authentication, Auth.authorization, UserController.userProfileUpdate)

module.exports = router