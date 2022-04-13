const ProductModel = require("../models/productModel");
const AWS = require("../utilities/aws");
const Validator = require('../utilities/validator')
const getSymbolFromCurrency = require("currency-symbol-map");

//*****************************************VALIDATION FUNCTIONS************************************************* */
const isValid = function (value) {
  if (typeof (value) === "undefined" || value === null) return false;
  if (typeof (value) === "string" && value.trim().length > 0 && Number(value) === NaN) return true;
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
 let regexForPrice = /^\d+(\.\d{1,2})?$/
 return regexForPrice.test(price)
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


    //no data is required from query params
    if (Validator.isValidInputBody(queryParams)) {
      return res.status(404).send({ status: false, message: "Page not found" });
    }

    if (!Validator.isValidInputBody(requestBody)) {
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

    if (!Validator.isValidInputValue(title)) {
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

    if (!Validator.isValidInputValue(description)) {
      return res
        .status(400)
        .send({ status: false, message: "Product description is required" });
    }

    if (!Validator.isValidNumber(price)) {
      return res
        .status(400)
        .send({ status: false, message: "Product price is required" });
    }

    if (!Validator.isValidPrice(price)) {
      return res
        .status(400)
        .send({ status: false, message: "Enter a valid Product price" });
    }

    if (!Validator.isValidInputValue(currencyId)) {
      return res
        .status(400)
        .send({ status: false, message: "currencyId  is required" });
    }

    if (getSymbolFromCurrency(currencyId) === undefined) {
      return res
        .status(400)
        .send({ status: false, message: "currencyId  is not  valid" });
    }

    if (!Validator.isValidInputValue(currencyFormat)) {
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
      if (!Validator.isValidInputValue(style)) {
        return res.status(400).send({
          status: false,
          message: "product style should be in valid format",
        });
      }
    }

    if (!Validator.isValidInputValue(availableSizes)) {
      return res.status(400).send({
        status: false,
        message: "product available sizes are required ",
      });
    }

    availableSizes = JSON.parse(availableSizes);

    if (!Array.isArray(availableSizes) || availableSizes.length === 0) {
          return res
          .status(400)
          .send({ status: false, message: "enter available sizes in valid format : [X, M, L]" });
    }

      for (let i = 0; i < availableSizes.length; i++) {
        const element = availableSizes[i];

        if (!["S", "XS", "M", "X", "L", "XXL", "XL"].includes(element)) {
          return res.status(400).send({
            status: false,
            message: `available sizes should be from:  [S, XS, M, X, L, XXL, XL]`,
          });
        }
      }
   

    if (installments) {
      if (!Validator.isValidNumber(installments)) {
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

    const productImageUrl = await AWS.uploadFile(image[0]);

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

//*****************************************GET ALL & FILTERED PRODUCTS LIST*********************************************** */

const filterProducts = async function (req, res) {
  try {
    const queryParams = req.query;
    const filterConditions = { isDeleted: false, deletedAt: null };
    const sorting = {};

    let { size, name, priceSort, priceGreaterThan, priceLessThan } =
      queryParams;

    if (Validator.isValidInputBody(queryParams)) {
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
        if (!Validator.isValidPrice((priceGreaterThan))) {
          return res
            .status(400)
            .send({ status: false, message: "Enter a valid price" });
        }

        filterConditions["price"] = { $gt: Number(priceGreaterThan) };
      }

      if (queryParams.hasOwnProperty("priceLessThan")) {
        if (!Validator.isValidPrice(priceLessThan)) {
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
        if (!Validator.isValidNumber(priceSort) || ["-1", "1"].includes(priceSort)) {
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
        if (!Validator.isValidInputValue(name)) {
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

//*************************************GET PRODUCT DETAILS*********************************************** */

const getProduct = async function (req, res) {
  try {
    const productId = req.params.productId;
    const queryParams = req.query;

    if (Validator.isValidInputBody(queryParams)) {
      return res.status(404).send({ status: false, message: "Page not found" });
    }

    if (!productId) {
      return res.status(400).send({
        status: false,
        message: "Invalid request, product id is required in path params",
      });
    }

    if (!Validator.isValidObjectId(productId)) {
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

   
    if (Validator.isValidInputBody(queryParams)) {
      return res.status(404).send({ status: false, message: "Page not found" });
    }

     if (!Validator.isValidObjectId(productId)) {
      return res
        .status(400)
        .send({ status: false, message: "invalid product id" });
    }

    const productByProductId = await ProductModel.findOne({_id : productId, isDeleted : false, deletedAt : null})

    if(!productByProductId){
      return res.status(404).send({ status: false, message: "No product found by product id"})
    }

    if (!Validator.isValidInputBody(requestBody)) {
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
      if (!Validator.isValidInputValue(title)) {
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
      if (!Validator.isValidInputValue(description)) {
        return res
          .status(400)
          .send({ status: false, message: "Invalid description" });
      }
      updates["$set"]["description"] = description.trim();
    }

    if (requestBody.hasOwnProperty("price")) {
      if (!Validator.isValidPrice(price)) {
        return res
          .status(400)
          .send({ status: false, message: "Invalid price" });
      }
      updates["$set"]["price"] = price;
    }

    if (requestBody.hasOwnProperty("currencyId")) {
      if (!Validator.isValidInputValue(currencyId) || getSymbolFromCurrency(currencyId) === undefined) {
        return res
          .status(400)
          .send({ status: false, message: "Invalid currencyId" });
      }
       
      updates["$set"]["currencyId"] = currencyId.trim();
      updates["$set"]["currencyFormat"] = getSymbolFromCurrency(currencyId)
    }

  //! here in both cases we have to check 
    // if (requestBody.hasOwnProperty("currencyFormat")) {
    //   if (!Validator.isValidInputValue(currencyFormat)) {
    //     return res
    //       .status(400)
    //       .send({ status: false, message: "Invalid currencyFormat" });
    //   }
    //   updates["$set"]["currencyFormat"] = currencyFormat.trim();
    // }

    if (requestBody.hasOwnProperty("isFreeShipping")) {
      if (!Validator.isValidInputValue(isFreeShipping)) {
        return res
          .status(400)
          .send({ status: false, message: "Invalid FreeShipping" });
      }
      if (isFreeShipping !== "true" && isFreeShipping !== "false") {
        return res
        .status(400)
        .send({ status: false, message: "Invalid FreeShipping" });
      }
      updates["$set"]["isFreeShipping"] = isFreeShipping;
    }

    if (requestBody.hasOwnProperty("style")) {
      if (!Validator.isValidInputValue(style)) {
        return res
          .status(400)
          .send({ status: false, message: "Invalid style" });
      }
      updates["$set"]["style"] = style;
    }

    if (requestBody.hasOwnProperty("availableSizes")) {

      if (!Validator.isValidInputValue(availableSizes)) {
        return res
          .status(400)
          .send({ status: false, message: "Invalid format of availableSizes" });
      }
     
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
      
      if (!Validator.isValidNumber(installments)) {
        return res
          .status(400)
          .send({ status: false, message: "invalid installments" });
      } else {
        updates["$set"]["installments"] = Number(installments);
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

    if (Validator.isValidInputBody(queryParams)) {
      return res.status(404).send({ status: false, message: "Page not found" });
    }

    if (!productId) {
      return res.status(400).send({
        status: false,
        message: "Invalid request, product id is required in path params",
      });
    }

    if (!Validator.isValidObjectId(productId)) {
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
