const mongoose = require("mongoose");

const validEmail = function(email){
     const regexForEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return regexForEmail.test(email)
}

const validPhone = function(phone){
    const regexForMobile = /^[6-9]\d{9}$/;
    return regexForMobile.test(phone);
}


const userSchema = new mongoose.Schema({
  fname: {
    type: String,
    required: [true, "User First Name is required"],
    trim: true,
  },
  lname: {
    type: String,
    required: [true, "User Last Name is required"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "User Email is required"],
    unique: [true, "Email address already exist"],
    validate: [validEmail, "Please enter a valid Email address"],
    trim: true,
  },
  profileImage: {
    type: String,
    required: [true, "User profile picture is required"], // s3 link
    trim: true,
  },
  phone: {
    type: String,
    required: [true, "User phone number is required"],
    unique: [true, "Phone number already exist"],
    validate: [validPhone, "Please enter a valid phone number"],
    trim: true,
  },
  password: {
    type: String,
    required: [true, "password is required"], // encrypted password
    // minlength: 8,
    // maxlength: 15,
  },
  address: {
    shipping: {
      street: {
        type: String,
        required: [true, "Street name is required"],
        trim: true,
      },
      city: {
        type: String,
        required: [true, "City name is required"],
        trim: true,
      },
      pincode: {
        type: Number,
        required: [true, "Area Pin code is required"],
      },
    },
    billing: {
      street: {
        type: String,
        required: [true, "Street name is required"],
        trim: true,
      },
      city: {
        type: String,
        required: [true, "City name is required"],
        trim: true,
      },
      pincode: {
        type: Number,
        required: [true, "Area Pin code is required"],
       
      },
    },
  },
}, {timestamps : true});

module.exports = mongoose.model('User', userSchema)
