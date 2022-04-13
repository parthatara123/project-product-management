const ProductModel = require("../models/productModel");
const Utility = require("../utilities/aws");
const mongoose = require("mongoose");
const getSymbolFromCurrency = require("currency-symbol-map");

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
  if (typeof value === "number") return true;
  return false;
};

const isValidPrice = function (price) {
  return price - 0 == price && (" " + price).trim().length > 0;
};

const isValidIdType = function (productId) {
  return mongoose.Types.ObjectId.isValid(productId);
};

//********************************REGISTERING NEW PRODUCT****************************************** */

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

    if (!isValidNumber(price)) {
      return res
        .status(400)
        .send({ status: false, message: "Product price is required" });
    }

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

    if (getSymbolFromCurrency(currencyId) === undefined) {
      return res
        .status(400)
        .send({ status: false, message: "currencyId  is not  valid" });
    }

    if (!isValid(currencyFormat)) {
      return res
        .status(400)
        .send({ status: false, message: "currencyFormat is required" });
    }

    if (getSymbolFromCurrency(currencyId) !== currencyFormat) {
      return res
        .status(400)
        .send({
          status: false,
          message: "currencyFormat is not matching with currencyId",
        });
    }

    if (isFreeShipping) {
      if (isFreeShipping !== "true" || isFreeShipping !== "false") {
        return res
          .status(400)
          .send({ status: false, message: "isFreeShipping should be boolean" });
      }
    }

 

    if (style) {
      if (!isValid(style)) {
        return res.status(400).send({
          status: false,
          message: "product style should be in valid format",
        });
      }
    }

    if (!isValid(availableSizes)) {
      return res.status(400).send({
        status: false,
        message: "product available sizes are required ",
      });
    }

    availableSizes = JSON.parse(availableSizes);

    if (Array.isArray(availableSizes)) {
      if (availableSizes.length === 0) {
        return res
          .status(400)
          .send({ status: false, message: "enter valid available sizes" });
      }

      for (let i = 0; i < availableSizes.length; i++) {
        const element = availableSizes[i];

        if (!["S", "XS", "M", "X", "L", "XXL", "XL"].includes(element)) {
          return res.status(400).send({
            status: false,
            message: `available sizes should be from:  S, XS, M, X, L, XXL, XL`,
          });
        }
      }
    } else {
      return res
        .status(400)
        .send({
          status: false,
          message: "enter available sizes in valid format : [X, M, L]",
        });
    }

    if (installments) {
      if (!isValidNumber(installments)) {
        return res.status(400).send({
          status: false,
          message: "Product installments should be in valid format",
        });
      }
    }
    
    if (!image || image.length === 0) {
      return res
        .status(400)
        .send({ status: false, message: "product image is required" });
    }

    const productImageUrl = await Utility.uploadFile(image[0]);

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

    res.status(201).send({
      status: true,
      message: "new product added successfully",
      data: newProduct,
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

//*****************************************FILTERED PRODUCT LIST*********************************************** */

const filterProducts = async function (req, res) {
  try {
    const queryParams = req.query;
    const filterConditions = { isDeleted: false, deletedAt: null };
    const sorting = {};

    let { size, name, priceSort, priceGreaterThan, priceLessThan } =
      queryParams;

    if (isValidInput(queryParams)) {
      if (queryParams.hasOwnProperty("size")) {
        size = JSON.parse(size);
        if (Array.isArray(size) && size.length > 0) {
          for (let i = 0; i < size.length; i++) {
            const element = size[i];

            if (!["S", "XS", "M", "X", "L", "XXL", "XL"].includes(element)) {
              return res.status(400).send({
                status: false,
                message: `available sizes should be from:  S, XS, M, X, L, XXL, XL`,
              });
            }
          }

          filterConditions["availableSizes"] = { $in: size };
        } else {
          return res
            .status(400)
            .send({
              status: false,
              message: "size should be in array format: [X, M,L]",
            });
        }
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
        if (!isValidNumber(priceSort)) {
          return res
            .status(400)
            .send({
              status: false,
              message: "price sort should be a number:  -1 or 1",
            });
        }
        sorting["price"] = Number(priceSort);
      }

      if (queryParams.hasOwnProperty("name")) {
        if (!isValid(name)) {
          return res.status(400).send({
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

      res.status(200).send({
        status: true,
        message: "Filtered product list is here",
        productCount: filteredProducts.length,
        data: filteredProducts,
      });
    } else {
      const allProducts = await ProductModel.find(filterConditions);

      if (allProducts.length == 0) {
        return res
          .status(404)
          .send({ status: false, message: "no products found" });
      }

      res.status(200).send({
        status: true,
        message: " Product list is here",
        productCount: allProducts.length,
        data: allProducts,
      });
    }
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
      return res.status(400).send({
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

//*************************************UPDATE A PRODUCT DETAILS***************************************************** */

const updateProductDetails = async function (req, res) {
  try {
    const queryParams = req.query;
    const requestBody = { ...req.body };
    const productId = req.params.productId;

   
    if (isValidInput(queryParams)) {
      return res.status(404).send({ status: false, message: "Page not found" });
    }

     if (!isValidIdType(productId)) {
      return res
        .status(400)
        .send({ status: false, message: "invalid product id" });
    }

    const productByProductId = await ProductModel.findOne({_id : productId, isDeleted : false, deletedAt : null})

    if(!productByProductId){
      return res.status(404).send({ status: false, message: "No product found by product id"})
    }

    if (!isValidInput(requestBody)) {
      return res
        .status(400)
        .send({ status: false, message: "Update data required" });
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

    const updates = { $set: {} };

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

    if (requestBody.hasOwnProperty("price")) {
      if (!isValidNumber(price)) {
        return res
          .status(400)
          .send({ status: false, message: "Invalid price" });
      }
      updates["$set"]["price"] = price;
    }

    if (requestBody.hasOwnProperty("currencyId")) {
      if (!isValid(currencyId) && getSymbolFromCurrency(currencyId) === undefined) {
        return res
          .status(400)
          .send({ status: false, message: "Invalid currencyId" });
      }
      
      updates["$set"]["currencyId"] = currencyId.trim();
    }

  
    if (requestBody.hasOwnProperty("currencyFormat")) {
      if (!isValid(currencyFormat)) {
        return res
          .status(400)
          .send({ status: false, message: "Invalid currencyFormat" });
      }
      updates["$set"]["currencyFormat"] = currencyFormat.trim();
    }

    if (requestBody.hasOwnProperty("isFreeShipping")) {
      if (!isValid(isFreeShipping)) {
        return res
          .status(400)
          .send({ status: false, message: "Invalid FreeShipping" });
      }
      if (isFreeShipping == "true" || isFreeShipping == "false") {
        updates["$set"]["isFreeShipping"] = isFreeShipping;
      } else {
        return res
          .status(400)
          .send({ status: false, message: "Invalid FreeShipping" });
      }
    }

    if (requestBody.hasOwnProperty("style")) {
      if (!isValid(style)) {
        return res
          .status(400)
          .send({ status: false, message: "Invalid style" });
      }
      updates["$set"]["style"] = style;
    }

    if (requestBody.hasOwnProperty("availableSizes")) {
      availableSizes = JSON.parse(availableSizes);

      if (Array.isArray(availableSizes) && availableSizes.length > 0) {
        for (let i = 0; i < availableSizes.length; i++) {
          const element = availableSizes[i];

          if (!["S", "XS", "M", "X", "L", "XXL", "XL"].includes(element)) {
            return res.status(400).send({
              status: false,
              message: `available sizes should be from:  S, XS, M, X, L, XXL, XL`,
            });
          }
        }

        updates["$set"]["availableSizes"] = availableSizes;
      } else {
        return res
          .status(400)
          .send({ status: false, message: "Invalid availableSizes" });
      }
    }

    if (requestBody.hasOwnProperty("installments")) {
      installments = Number(installments);
      if (!isValidNumber(installments)) {
        return res
          .status(400)
          .send({ status: false, message: "invalid installments" });
      } else {
        updates["$set"]["installments"] = installments;
      }
    }

    const updatedProduct = await ProductModel.findOneAndUpdate(
      { _id: productId },
      updates,
      { new: true }
    );

    res.status(200).send({
      status: true,
      message: "Product data updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

//*************************************DELETE PRODUCT************************************************** */

const deleteProduct = async function (req, res) {
  try {
    const productId = req.params.productId;
    const queryParams = req.query;

    if (isValidInput(queryParams)) {
      return res.status(404).send({ status: false, message: "Page not found" });
    }

    if (!productId) {
      return res.status(400).send({
        status: false,
        message: "Invalid request, product id is required in path params",
      });
    }

    if (!isValidIdType(productId)) {
      return res
        .status(400)
        .send({ status: false, message: "Invalid product id" });
    }

    const productById = await ProductModel.findOne({
      _id: productId,
      isDeleted: false,
      deletedAt: null,
    });

    if (!productById) {
      return res.status(404).send({
        status: false,
        message: "No product found by this product id",
      });
    }

    const markDirty = await ProductModel.findOneAndUpdate(
      { _id: productId },
      { $set: { isDeleted: true, deletedAt: Date.now() } }
    );

    res
      .status(200)
      .send({ status: true, message: "Product successfully deleted" });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

//**********************************EXPORTING PRODUCT RELATED HANDLER FUNCTION******************************* */
module.exports = {
  registerProduct,
  filterProducts,
  getProduct,
  updateProductDetails,
  deleteProduct,
};
