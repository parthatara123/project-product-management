const mongoose = require('mongoose')


const isValidInputBody = function(object){
return Object.keys(object).length > 0
}


const isValidInputValue = function(value){
    value = value.trim()
    if(typeof (value) === 'undefined' || value === null) return false
    if(typeof (value) === 'string' && value.trim().length > 0 && Number(value) === NaN) return true
    return false
}

const isValidOnlyCharacters = function(value){
    value = value.trim()
    return /^[A-Za-z]+$/.test(value)
}
  
const isValidAddress = function (value) {
    if (typeof (value) === "undefined" || value === null) return false;
    if (typeof (value) === "object" && Array.isArray(value) === false && Object.keys(value).length > 0) return true;
    return false;
  };
  
  const isValidEmail = function (email) {
    email = email.trim()
    const regexForEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return regexForEmail.test(email);
  };
  
  const isValidPhone = function (phone) {
    phone = phone.trim()
    const regexForMobile = /^[6-9]\d{9}$/;
    return regexForMobile.test(phone);
  };
  
  const isValidPassword = function (password) {
    const regexForPass = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,15}$/;
    return regexForPass.test(password);
  };
  
  const isValidNumber = function (value) {
      if (typeof (value) === "undefined" || value === null) return false;
      if (typeof (value) === "string" && value.trim().length > 0 && Number(value) !== NaN) return true
      if (typeof (value) === "number") return true;
      return false;
    };
    
    const isValidPincode = function (pincode) {
      const regexForPass = /^[1-9][0-9]{5}$/
      return regexForPass.test(pincode);
    };

    const isValidPrice = function (price) {
        let regexForPrice = /^\d+(\.\d{1,2})?$/
        return regexForPrice.test(price)
    };

    const isValidObjectId = function (objectId) {
    return mongoose.Types.ObjectId.isValid(objectId);
    };

module.exports = {
    isValidInputBody,
    isValidInputValue,
    isValidOnlyCharacters,
    isValidAddress,
    isValidEmail,
    isValidPhone,
    isValidPassword,
    isValidNumber,
    isValidPincode,
    isValidPrice,
    isValidObjectId
}