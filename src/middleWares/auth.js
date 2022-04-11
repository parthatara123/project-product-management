const jwt = require('jsonwebtoken')
const UserModel = require('../models/userModel')
const mongoose = require('mongoose')

//********************************AUTHENTICATION********************************** */

const authentication = async function(req, res,next){

    const bearerToken = req.headers["authorization"]
    const token = bearerToken.split(" ")[1]
    console.log(token)

    const secretKey = '123451214654132466ASDFGwnweruhkwerbjhiHJKL!@#$%^&'

    if(!token){
        return res.status(401).send({status : false, message : "authentication failed : token not found"})
    }

    try{
        const decodedToken = jwt.verify(token, secretKey, {ignoreExpiration: true})

        if(Date.now() > decodedToken.exp * 1000){
            return res.status(401).send({status : false, message : "authentication failed : Session expired"})
        }

        req.decodedToken = decodedToken

        next()

    }catch{
        res.status(401).send({status : false, message : "authentication failed"})
    }


}

const authorization = async function(req, res, next){
    const userId = req.params.userId
    const decodedToken = req.decodedToken

    if(!mongoose.Types.ObjectId.isValid(userId)){
        return res.status(400).send({status :false , message : " enter a valid userId"})
    }

    const userByUserId = await UserModel.findById(userId)
    console.log(userId)
    console.log(decodedToken.userId)

    if(!userByUserId){
        return res.status(404).send({status :false , message : " user not found"}) 
    }

    if(userId !== decodedToken.userId){
        return res.status(403).send({status :false , message : "unauthorized access"})  
    }

    next()
}

module.exports = {authentication, authorization}