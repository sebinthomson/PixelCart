const mongoose = require("mongoose");
const Cart = require("../models/cart");
const Product = require("../models/product");

module.exports.addToCart = (proId, userId, quantity) => {
  const proObj = {
    item: proId,
    quantity: quantity,
  };
  return new Promise(async (resolve, reject) => {
    try {
      let userCart = await Cart.findOne({ user: userId });
      if (userCart) {
        try {
          const proExist = userCart.products.some(
            (product) => product.item.toString() === proId.toString()
          );
          if (proExist) {
            await Cart.updateOne(
              { user: userId, "products.item": proId },
              {
                $inc: { "products.$.quantity": quantity },
              }
            )
              .then(() => {
                resolve();
              })
              .catch((err) => {
                console.error(err);
              });
          } else {
            await Cart.updateOne(
              { user: userId },
              {
                $push: { products: proObj },
              }
            )
              .then(() => {
                resolve();
              })
              .catch((err) => {
                console.error(err);
              });
          }
        } catch (error) {
          console.log("Failed to update cart:", error);
          reject(error);
        }
      } else {
        let cartObj = {
          user: userId,
          products: [proObj],
        };
        let newCart = new Cart(cartObj);
        await newCart.save();
        resolve();
      }
    } catch (error) {
      console.log("Failed to add to cart:", error);
      reject(error);
    }
  });
};

module.exports.getCartProducts = (userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const cartItems = await Cart.aggregate([
        {
          $match: { user: mongoose.Types.ObjectId.createFromHexString(userId) },
        },
        {
          $unwind: "$products",
        },
        {
          $project: {
            item: "$products.item",
            quantity: "$products.quantity",
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "item",
            foreignField: "_id",
            as: "product",
          },
        },
        {
          $project: {
            item: 1,
            quantity: 1,
            product: { $arrayElemAt: ["$product", 0] },
          },
        },
      ]).exec();
      resolve(cartItems);
    } catch (error) {
      reject(error);
    }
  });
};

module.exports.changeProductQuantity = (details) => {
  quantity = parseInt(details.quantity);
  count = parseInt(details.count);
  return new Promise(async (resolve, reject) => {
    if (count === -1 && quantity === 1) {
      await Cart.updateOne(
        { _id: details.cart },
        {
          $pull: { products: { item: details.product } },
        }
      ).then((response) => {
        resolve({ removeProduct: true });
      });
    } else {
      await Cart.updateOne(
        { _id: details.cart, "products.item": details.product },
        {
          $inc: { "products.$.quantity": count },
        }
      )
        .then((response) => {
          resolve(response);
        })
        .catch((err) => {
          console.error(err);
          reject(err);
        });
    }
  });
};

module.exports.clearCartProducts = async (userId) => {
  try {
    await Cart.updateOne(
      { user: userId },
      {
        $pull: { products: {} },
      }
    )
  } catch (error) {
    console.log(error);
  }
};

module.exports.getTotal = (userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const total = await Cart.aggregate([
        {
          $match: { user: mongoose.Types.ObjectId.createFromHexString(userId) },
        },
        {
          $unwind: "$products",
        },
        {
          $project: {
            item: "$products.item",
            quantity: "$products.quantity",
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "item",
            foreignField: "_id",
            as: "product",
          },
        },
        {
          $project: {
            item: 1,
            quantity: 1,
            product: { $arrayElemAt: ["$product", 0] },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $multiply: ["$quantity", "$product.price"] } },
          },
        },
      ]).exec();
      resolve(total);
    } catch (error) {
      reject(error);
    }
  });
};
