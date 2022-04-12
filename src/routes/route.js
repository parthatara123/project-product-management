const express = require('express')
const router = express.Router()
const UserController = require('../controllers/userController')
const Auth = require('../middleWares/auth')
const ProductController = require('../controllers/productController')

//test-api
router.get('/test-me',  function(req, res){
    res.send({status:true, message : "test-api working fine"})
})

//*********************************USER API************************************************** */
router.post('/register', UserController.userRegistration)
router.post('/login', UserController.userLogin)
router.get('/user/:userId/profile', Auth.authentication, Auth.authorization, UserController.profileDetails)
router.post('/user/:userId/profile', Auth.authentication, Auth.authorization, UserController.userProfileUpdate)


//*************************************************************************************** */
router.post('/products', ProductController.registerProduct )
router.get('/products', ProductController.filterProducts)
router.get('/products/:productId', ProductController.getProduct)
router.put('/products/:productId', ProductController.updateProductDetails)
router.delete('/products/:productId', ProductController.deleteProduct)

module.exports = router