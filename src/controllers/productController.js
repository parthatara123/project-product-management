const ProductModel = require("../models/productModel");
const Utility = require("../utilities/aws");
const mongoose = require("mongoose");

//*****************************************VALIDATION FUNCTIONS************************************************* */
const isValid = function (value) {
  if (typeof value === "undefined" || value === null) return false;
  if (typeof value === "string" && value.trim().length > 0) return true;
  return false;
};

const isValidInput = function (object) {
  return Object.keys(object).length > 0;
};

const isValidNumber = function (value) {
  if (typeof value === "undefined" || value === null) return false;
  if (typeof value === "string" && Number(value) !== NaN) return true;
  if(typeof value === "number") return true
  return false;
};

const isValidPrice = function (price) {
  return price - 0 == price && (" " + price).trim().length > 0;
};

const isValidIdType = function (productId) {
  return mongoose.Types.ObjectId.isValid(productId);
};

//************************************************************************** */

const registerProduct = async function (req, res) {
  try {
    const requestBody = { ...req.body };
    const queryParams = req.query;
    const image = req.files;
    console.log(requestBody);

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

    let {
      title,
      description,
      price,
      currencyId,
      currencyFormat,
      isFreeShipping,
      style,
      availableSizes,
      installments,
    } = requestBody;

    if (!isValid(title)) {
      return res
        .status(400)
        .send({ status: false, message: "Product title is required" });
    }

    const productByTitle = await ProductModel.findOne({
      title: title,
      isDeleted: false,
      deletedAt: null,
    });
    if (productByTitle) {
      return res
        .status(400)
        .send({ status: false, message: "Product title already exist" });
    }

    if (!isValid(description)) {
      return res
        .status(400)
        .send({ status: false, message: "Product description is required" });
    }

    // if(!isValidNumber(price)) {
    //     return res
    //       .status(400)
    //       .send({ status: false, message: "Product price is required" });
    // }

    if (!isValidPrice(Number(price))) {
      return res
        .status(400)
        .send({ status: false, message: "Enter a valid Product price" });
    }

    if (!isValid(currencyId)) {
      return res
        .status(400)
        .send({ status: false, message: "currencyId  is required" });
    }

    if (!isValid(currencyFormat)) {
      return res
        .status(400)
        .send({ status: false, message: "currencyFormat is required" });
    }

    if (isFreeShipping) {
      if (typeof isFreeShipping !== "boolean") {
        return res
          .status(400)
          .send({ status: false, message: "isFreeShipping should be boolean" });
      }
    }

    if (!image && image.length === 0) {
      return res
        .status(400)
        .send({ status: false, message: "product image is required" });
    }

    const productImageUrl = await Utility.uploadFile(image[0]);

    if (style) {
      if (!isValid(style)) {
        return res
          .status(400)
          .send({
            status: false,
            message: "product style should be in valid format",
          });
      }
    }
    availableSizes = JSON.parse(availableSizes);
    if (availableSizes) {
      if (Array.isArray(availableSizes)) {
        if (availableSizes.length === 0) {
          return res
            .status(400)
            .send({ status: false, message: "enter valid available sizes" });
        }

        for (let i = 0; i < availableSizes.length; i++) {
          const element = availableSizes[i];
          if (!isValid(element)) {
            return res
              .status(400)
              .send({
                status: false,
                message: "available sizes should be in valid format",
              });
          }

          if (!["S", "XS", "M", "X", "L", "XXL", "XL"].includes(element)) {
            return res
              .status(400)
              .send({
                status: false,
                message: `available sizes should be from:  S, XS, M, X, L, XXL, XL`,
              });
          }
        }
      } else {
        if (!isValid(availableSizes)) {
          return res
            .status(400)
            .send({
              status: false,
              message: "available sizes should be in valid format",
            });
        }

        if (!["S", "XS", "M", "X", "L", "XXL", "XL"].includes(availableSizes)) {
          return res
            .status(400)
            .send({
              status: false,
              message: `available sizes should be from:  S, XS, M, X, L, XXL, XL`,
            });
        }
      }
    }

    if (installments) {
      if (!isValidNumber(installments)) {
        return res
          .status(400)
          .send({
            status: false,
            message: "Product installments should be in valid format",
          });
      }
    }

    const productData = {
      title: title.trim(),
      description: description.trim(),
      price: price,
      currencyId: currencyId.trim(),
      currencyFormat: currencyFormat.trim(),
      isFreeShipping: isFreeShipping ? isFreeShipping : false,
      productImage: productImageUrl,
      style: style,
      availableSizes: availableSizes,
      installments: installments,
      deletedAt: null,
      isDeleted: false,
    };

    const newProduct = await ProductModel.create(productData);

    res
      .status(201)
      .send({
        status: true,
        message: "new product added successfully",
        data: newProduct,
      });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

//************************************************************************************************* */

const filterProducts = async function (req, res) {
  try {
    const queryParams = req.query;
    const filterConditions = { isDeleted: false, deletedAt: null };
    const sorting = {};
    console.log(queryParams);

    let { size, name, priceSort, priceGreaterThan, priceLessThan } =
      queryParams;

    if (queryParams.hasOwnProperty("size")) {
      size = JSON.parse(size);

      for (let i = 0; i < size.length; i++) {
        const element = size[i];
        if (!isValid(element)) {
          return res
            .status(400)
            .send({
              status: false,
              message: "filtered sizes should be in valid format",
            });
        }

        if (!["S", "XS", "M", "X", "L", "XXL", "XL"].includes(element)) {
          return res
            .status(400)
            .send({
              status: false,
              message: `available sizes should be from:  S, XS, M, X, L, XXL, XL`,
            });
        }
      }

      filterConditions["availableSizes"] = { $in: size };
    }

    if (queryParams.hasOwnProperty("priceGreaterThan")) {
      if (!isValidPrice(Number(priceGreaterThan))) {
        return res
          .status(400)
          .send({ status: false, message: "Enter a valid price" });
      }

      filterConditions["price"] = { $gt: Number(priceGreaterThan) };
    }

    if (queryParams.hasOwnProperty("priceLessThan")) {
      if (!isValidPrice(Number(priceLessThan))) {
        return res
          .status(400)
          .send({ status: false, message: "Enter a valid price" });
      }
      if (queryParams.hasOwnProperty("priceGreaterThan")) {
        filterConditions["price"] = {
          $gt: Number(priceGreaterThan),
          $lt: Number(priceLessThan),
        };
      } else {
        filterConditions["price"] = { $lt: Number(priceLessThan) };
      }
    }

    if (queryParams.hasOwnProperty("priceSort")) {
      sorting["price"] = Number(priceSort);
    }

    if (queryParams.hasOwnProperty("name")) {
      if (!isValid(name)) {
        return res
          .status(400)
          .send({
            status: false,
            message: "product name should be in valid format",
          });
      }

      const regexForName = new RegExp(name, "i");

      filterConditions["title"] = { $regex: regexForName };
    }

    const filteredProducts = await ProductModel.find(filterConditions).sort(
      sorting
    );

    if (filteredProducts.length == 0) {
      return res
        .status(404)
        .send({ status: false, message: "no product found" });
    }

    res
      .status(200)
      .send({
        status: true,
        message: "Filtered product list",
        data: filteredProducts,
      });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

//************************************************************************************ */

const getProduct = async function (req, res) {
  try {
    const productId = req.params.productId;
    const queryParams = req.query;

    if (isValidInput(queryParams)) {
      return res.status(404).send({ status: false, message: "Page not found" });
    }

    if (!productId) {
      return res
        .status(400)
        .send({
          status: false,
          message: "Invalid request, product id is required in path params",
        });
    }

    if (!isValidIdType(productId)) {
      return res
        .status(400)
        .send({ status: false, message: "Invalid product id" });
    }

    const productById = await ProductModel.findById(productId);

    res
      .status(200)
      .send({ status: true, message: "success", data: productById });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

//****************************************************************************************** */

const updateProductDetails = async function (req, res) {
  try {
    const queryParams = req.query;
    const requestBody = { ...req.body };
    console.log(requestBody)
    const productId = req.params.productId;
    if (!isValidIdType(productId)) {
      return res
        .status(400)
        .send({ status: false, message: "invalid product id" });
    }

    if (isValidInput(queryParams)) {
      return res.status(404).send({ status: false, message: "Page not found" });
    }

    if (!isValidInput(requestBody)) {
      return res.status(400).send({ status: false, message: "Update data required" });
    }

    let {
      title,
      description,
      price,
      currencyId,
      currencyFormat,
      isFreeShipping,
      style,
      availableSizes,
      installments,
    } = requestBody;

    const updates = { $set: {}, $addToSet: {} };

    if (requestBody.hasOwnProperty("title")) {
      if (!isValid(title)) {
        return res
          .status(400)
          .send({ status: false, message: "Invalid title" });
      }

      const productByTitle = await ProductModel.findOne({
        title: title,
        isDeleted: false,
        deletedAt: null,
      });


      if (productByTitle) {
        return res
          .status(400)
          .send({ status: false, message: "Product title already exist" });
      }

      updates["$set"]["title"] = title.trim();
    }

    if (requestBody.hasOwnProperty("description")) {
      if (!isValid(description)) {
        return res
          .status(400)
          .send({ status: false, message: "Invalid description" });
      }
      updates["$set"]["description"] = description.trim();
    }
    console.log(price)
    if (requestBody.hasOwnProperty("price")) {
      
        if (!isValidNumber(price)) {
        return res
          .status(400)
          .send({ status: false, message: "Invalid price" });
      }
      updates["$set"]["price"] = price;
    }

    if (requestBody.hasOwnProperty("currencyId")) {
      if (!isValid(currencyId)) {
        return res
          .status(400)
          .send({ status: false, message: "Invalid currencyId" });
      }
      updates["$set"]["currencyId"] = currencyId.trim();
    }

    //CURRENCY ID VALIDATION IS PENDING

    if (requestBody.hasOwnProperty("currencyFormat")) {
      if (!isValid(currencyFormat)) {
        return res
          .status(400)
          .send({ status: false, message: "Invalid currencyFormat" });
      }
      updates["$set"]["currencyFormat"] = currencyFormat.trim();
    }

    res.send({message: "sucess"})

  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};


module.exports = {
  registerProduct,
  filterProducts,
  getProduct,
  updateProductDetails,
};
