const UserModel = require("../models/userModel");
const utility = require("../utilities/aws");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

//*****************************************VALIDATION FUNCTIONS************************************************* */
const isValid = function (value) {
  if (typeof value === "undefined" || value === null) return false;
  if (typeof value === "string" && value.trim().length > 0) return true;
  return false;
};

const isValidInput = function (object) {
  return Object.keys(object).length > 0;
};

const isValidAddress = function (value) {
  if (typeof value === "undefined" || value === null) return false;
  if (typeof value === "object" && Array.isArray(value) === false && Object.keys(value).length > 0) return true;
  return false;
};

const isValidEmail = function (email) {
  const regexForEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return regexForEmail.test(email);
};

const isValidPhone = function (phone) {
  const regexForMobile = /^[6-9]\d{9}$/;
  return regexForMobile.test(phone);
};

const isValidPassword = function (password) {
  const regexForPass = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,15}$/;
  return regexForPass.test(password);
};

const isValidPincode = function (value) {
  if (typeof value === "undefined" || value === null) return false;
  if (typeof value === "number" && value.length === 6) return true;
  return false;
};

//*********************************************USER REGISTRATION******************************************** */

const userRegistration = async function (req, res) {
  try {
    const requestBody = {...req.body};
    const queryParams = req.query;
    const image = req.files;
    console.log(requestBody);
    console.log(image)

    //no data is required from query params
    if (isValidInput(queryParams)) {
      return res.status(404).send({ status: false, message: "Page not found" });
    }

    if (!isValidInput(requestBody)) {
      return res.status(400).send({
        status: false,
        message: "User data is required for registration",
      });
    }

    //using destructuring
    const { fname, lname, email, phone, password } = requestBody;

    // each key validation starts here
    if (!isValid(fname)) {
      return res
        .status(400)
        .send({ status: false, message: "first name is required like: JOHN" });
    }

    // if(!isNaN(parseFloat(fname))) return res.status(400).send({ status: false, message: "First name is number" })

    if (!isValid(lname)) {
      return res
        .status(400)
        .send({ status: false, message: "last name is required like: DOE" });
    }

    if (!isValid(email)) {
      return res
        .status(400)
        .send({ status: false, message: "email address is required" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).send({
        status: false,
        message: "Please enter a valid email address like : xyz@gmail.com",
      });
    }

    const isUniqueEmail = await UserModel.findOne({ email });

    if (isUniqueEmail) {
      return res
        .status(400)
        .send({ status: false, message: "Email address already exist" });
    }

    if (!image || image.length == 0) {
      return res
        .status(400)
        .send({ status: false, message: "no profile image found" });
    }

    const uploadedProfilePictureUrl = await utility.uploadFile(image[0]);

    if (!isValid(phone)) {
      return res
        .status(400)
        .send({ status: false, message: "Phone number is required" });
    }

    if (!isValidPhone(phone)) {
      return res.status(400).send({
        status: false,
        message: "Please enter a valid phone number like : 9638527410",
      });
    }

    const isUniquePhone = await UserModel.findOne({ phone });

    if (isUniquePhone) {
      return res
        .status(400)
        .send({ status: false, message: "phone number already exist" });
    }

    if (!isValid(password)) {
      return res
        .status(400)
        .send({ status: false, message: "password is required" });
    }

    if (!isValidPassword(password)) {
      return res.status(400).send({
        status: false,
        message:
          "Password should be of 8 to 15 characters and  must have 1 letter and 1 number",
      });
    }

    const address = JSON.parse(requestBody.address);

    if (!isValidAddress(address)) {
      return res
        .status(400)
        .send({ status: false, message: "address is required" });
    } else {
      const { shipping, billing } = address;

      if (!isValidAddress(shipping)) {
        return res
          .status(400)
          .send({ status: false, message: "Shipping address is required" });
      } else {
        const { street, city, pincode } = shipping;

        if (!isValid(street)) {
          return res.status(400).send({
            status: false,
            message: "Shipping address: street name is required ",
          });
        }

        if (!isValid(city)) {
          return res.status(400).send({
            status: false,
            message: "Shipping address: city name is required ",
          });
        }

        if (!/\d{6}/.test(pincode)) {
          return res.status(400).send({
            status: false,
            message: "Shipping address: pin code should be valid like: 335659 ",
          });
        }
      }

      if (!isValidAddress(billing)) {
        return res
          .status(400)
          .send({ status: false, message: "Billing address is required" });
      } else {
        const { street, city, pincode } = billing;

        if (!isValid(street)) { 
          return res.status(400).send({
            status: false,
            message: "Billing address: street name is required ",
          });
        }

        if (!isValid(city)) {
          return res.status(400).send({
            status: false,
            message: "Billing address: city name is required ",
          });
        }

        if (!/\d{6}/.test(pincode)) {
          return res.status(400).send({
            status: false,
            message: "Billing address: pin code should be valid like: 335659 ",
          });
        }
      }
    }

    // password encryption
    const salt = await bcrypt.genSalt(10);
    const encryptedPassword = await bcrypt.hash(password, salt);

    const userData = {
      fname: fname.trim(),
      lname: lname.trim(),
      email: email.trim(),
      profileImage: uploadedProfilePictureUrl,
      phone: phone.trim(),
      password: encryptedPassword,
      address: address,
    };

    const newUser = await UserModel.create(userData);

    res.status(201).send({
      status: true,
      message: "User successfully registered",
      data: newUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: error.message });
  }
};

//**********************************************USER LOGIN*************************************************** */

const userLogin = async function (req, res) {
  try {
    const queryParams = req.query;
    const requestBody = req.body;

    //no data is required from query params
    if (isValidInput(queryParams)) {
      return res.status(404).send({ status: false, message: "Page not found" });
    }

    if (!isValidInput(requestBody)) {
      return res.status(400).send({
        status: false,
        message: "User data is required for login",
      });
    }

    const userName = requestBody.email;
    const password = requestBody.password;

    if (!isValid(userName)) {
      return res
        .status(400)
        .send({ status: false, message: "email is required" });
    }

    if (!isValidEmail(userName)) {
      return res
        .status(400)
        .send({ status: false, message: "Enter a valid email " });
    }

    if (!isValid(password)) {
      return res
        .status(400)
        .send({ status: false, message: "password is required" });
    }

    if (!isValidPassword(password)) {
      return res.status(400).send({
        status: false,
        message:
          "Enter password of 8 to 15 characters and must contain one letter and digit ",
      });
    }
    // finding user by given email
    const userDetails = await UserModel.findOne({ email: userName });

    if (!userDetails) {
      return res
        .status(404)
        .send({ status: false, message: "No user found by email" });
    }
    // comparing hashed password and login password
    const isPasswordMatching = bcrypt.compare(password, userDetails.password);

    if (!isPasswordMatching) {
      return res
        .status(400)
        .send({ status: false, message: "incorrect password" });
    }
    // creating JWT token
    const payload = { userId: userDetails._id };
    const expiry = { expiresIn: "1800s" };
    const secretKey = "123451214654132466ASDFGwnweruhkwerbjhiHJKL!@#$%^&";

    const token = jwt.sign(payload, secretKey, expiry);

    // setting bearer token in response header
    res.header("authorization", "Bearer " + token);

    const data = { userId: userDetails._id, token: token };

    res
      .status(200)
      .send({ status: true, message: "login successful", data: data });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

//********************************************USER PROFILE DETAILS***************************************** */

const profileDetails = async function (req, res) {
  try {
    const queryParams = req.query;
    const requestBody = req.body;
    const userId = req.params.userId;

    //no data is required from query params
    if (isValidInput(queryParams)) {
      return res.status(404).send({ status: false, message: "Page not found" });
    }

    if (isValidInput(requestBody)) {
      return res.status(400).send({
        status: false,
        message: "User data is not required",
      });
    }

    const userProfile = await UserModel.findById(userId);

    res.status(200).send({
      status: true,
      message: "user profile details",
      data: userProfile,
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

//*******************************************************USER PROFILE UPDATE******************************************************/

const userProfileUpdate = async function (req, res) {
  try {
    const queryParams = req.query;

    // creating deep copy of request body as [object: null-prototype]
    const requestBody = JSON.parse(JSON.stringify(req.body));
    const userId = req.params.userId;
    const image = req.files;

    //no data is required from query params
    if (isValidInput(queryParams)) {
      return res.status(404).send({ status: false, message: "Page not found" });
    }

    // created an empty object. now will add properties that needs to be updated
    const updates = {};

    if (image && image.length > 0) {
      const updatedProfileImageUrl = await utility.uploadFile(image[0]);
      updates["profileImage"] = updatedProfileImageUrl;
    }

    // using destructuring then validating keys which are present in request body then adding them to updates object
    const { fname, lname, email, phone, address, password } = requestBody;

    if (requestBody.hasOwnProperty("fname")) {
      if (isValid(fname)) {
        updates["fname"] = fname.trim();
      } else {
        return res.status(400).send({
          status: false,
          message: "first name is required like: JOHN",
        });
      }
    }

    if (requestBody.hasOwnProperty("lname")) {
      if (isValid(lname)) {
        updates["lname"] = lname.trim();
      } else {
        return res
          .status(400)
          .send({ status: false, message: "last name is required like: doe" });
      }
    }

    if (requestBody.hasOwnProperty("email")) {
      if (isValid(email)) {
        if (isValidEmail(email)) {
          const isUniqueEmail = await UserModel.findOne({ email });

          if (isUniqueEmail) {
            return res
              .status(400)
              .send({ status: false, message: "Email address already exist" });
          }
          updates["email"] = email.trim();
        } else {
          return res
            .status(400)
            .send({ status: false, message: "invalid email" });
        }
      } else {
        return res
          .status(400)
          .send({ status: false, message: "email should be in valid format" });
      }
    }

    if (requestBody.hasOwnProperty("phone")) {
      if (isValid(phone)) {
        if (isValidPhone(phone)) {
          const isUniquePhone = await UserModel.findOne({ phone });

          if (isUniquePhone) {
            return res
              .status(400)
              .send({ status: false, message: "phone number already exist" });
          }
          updates["phone"] = phone.trim();
        } else {
          return res
            .status(400)
            .send({ status: false, message: "invalid phone" });
        }
      } else {
        return res
          .status(400)
          .send({ status: false, message: "phone should be in valid format" });
      }
    }

    if (requestBody.hasOwnProperty("password")) {
      if (isValid(password)) {
        if (isValidPassword(password)) {
          const salt = await bcrypt.genSalt(10);
          const encryptedPassword = await bcrypt.hash(password, salt);

          updates["password"] = encryptedPassword;
        } else {
          return res.status(400).send({
            status: false,
            message:
              "Password should be of 8 to 15 characters and  must have 1 letter and 1 number",
          });
        }
      } else {
        return res
          .status(400)
          .send({ status: false, message: "password is required" });
      }
    }

    if (requestBody.hasOwnProperty("address")) {
      const { shipping, billing } = JSON.parse(address);

      if (JSON.parse(address).hasOwnProperty("shipping")) {
        const { street, city, pincode } = shipping;

        if (shipping.hasOwnProperty("street")) {
          if (!isValid(street)) {
            return res.status(400).send({
              status: false,
              message:
                "shipping address: street name should be in valid format ",
            });
          } else {
            updates["address.shipping.street"] = street.trim();
          }
        }

        if (shipping.hasOwnProperty("city")) {
          if (!isValid(city)) {
            return res.status(400).send({
              status: false,
              message: "shipping address: city name should be in valid format ",
            });
          } else {
            updates["address.shipping.city"] = city.trim();
          }
        }

        if (shipping.hasOwnProperty("pincode")) {
          if (!/\d{6}/.test(pincode)) {
            return res.status(400).send({
              status: false,
              message:
                "Shipping address: pin code should be valid like: 335659 ",
            });
          }
          updates["address.shipping.pincode"] = pincode.trim();
        }
      }

      if (JSON.parse(address).hasOwnProperty("billing")) {
        const { street, city, pincode } = billing;

        if (billing.hasOwnProperty("street")) {
          if (!isValid(street)) {
            return res.status(400).send({
              status: false,
              message:
                "billing address: street name should be in valid format ",
            });
          } else {
            updates["address.billing.street"] = street.trim();
          }
        }

        if (billing.hasOwnProperty("city")) {
          if (!isValid(city)) {
            return res.status(400).send({
              status: false,
              message: "billing address: city name should be in valid format ",
            });
          } else {
            updates["address.billing.city"] = city.trim();
          }
        }

        if (billing.hasOwnProperty("pincode")) {
          if (!/\d{6}/.test(pincode)) {
            return res.status(400).send({
              status: false,
              message:
                "Billing address: pin code should be valid like: 335659 ",
            });
          }

          updates["address.billing.pincode"] = pincode.trim();
        }
      }
    }

    const updatedProfile = await UserModel.findByIdAndUpdate(
      { _id: userId },
      { $set: updates },
      { new: true }
    );

    res.status(200).send({
      status: true,
      message: "user profile updated",
      data: updatedProfile,
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};
module.exports = {
  userRegistration,
  userLogin,
  profileDetails,
  userProfileUpdate,
};
