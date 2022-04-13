const CartModel = require('../models/cartModel')
const UserModel = require('../models/userModel')
const ProductModel = require('../models/productModel')
const  mongoose = require('mongoose')

//*********************************************VALIDATION FUNCTIONS******************************************* */

const isValid = function(value){
    if(typeof (value) === 'undefined' || value === null) return false
    if(typeof (value) === 'string' && value.trim().length > 0 && Number(value) === NaN) return true
    return false
}

const isValidObjectId = function(objectId){
    return mongoose.Types.ObjectId.isValid(objectId)
}

const isValidInput = function (object) {
    return Object.keys(object).length > 0;
  };


//*********************************************CREATE CART***************************************************** */

const createCart = async function(req, res){
    try{
        const requestBody = req.body
        const queryParams = req.query
        const userId = req.params.userId

        if(isValidInput(queryParams)){
            return res.status(404).send({status : false, message :" page not found"})
        }

        if(!isValidInput(requestBody)){
            return res.status(404).send({status : false, message :"data is required to add products in cart"})
        }

        const {productId, quantity} = requestBody

       const cartForUserId = await CartModel.findOne({userId : userId })

       if(cartForUserId){

        

       }else{

        const cartData = {
            userId : userId,

        }        
       }


    }catch(error){
        res.status(500).send({error : error.message})
    }
}
