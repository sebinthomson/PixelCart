const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const connectDB = require("../config/connection");
const User = require("../models/user");
const Cart = require("../models/cart");

module.exports = {
  addUser: async (user, callback) => {
    const userData = {
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      password: user.password,
    };
    userData.password = await bcrypt.hash(user.password, 10);
    connectDB().then(() => {
      User.create(userData)
        .then(() => {
          callback("DONE");
        })
        .catch((e) => {
          console.log(e);
          callback("FAILED");
        });
    });
  },
  
  updateUser: async (user, callback) => {
    const userData = {
      mobile: user.mobile,
      password: user.password,
    };
    userData.password = await bcrypt.hash(user.password, 10);
    connectDB().then(() => {
      User.updateOne(
        { mobile: userData.mobile },
        { $set: { password: userData.password } }
      )
        .then(() => {
          callback("DONE");
        })
        .catch((e) => {
          console.log(e);
          callback("FAILED");
        });
    });
  },

  updateUserBlockedStatus: (userId) => {
    return new Promise((resolve, reject) => {
      connectDB()
        .then(() => {
          User.findByIdAndUpdate(userId, { blocked: true }, { new: true })
            .then((updatedUser) => {
              if (updatedUser) {
                resolve(updatedUser);
              } else {
                resolve(null);
              }
            })
            .catch((error) => {
              console.log("Failed to update user:", error);
              reject(error);
            });
        })
        .catch((error) => {
          console.log("Failed to connect to the database:", error);
          reject(error);
        });
    });
  },

  updateUserUnBlockedStatus: (userId) => {
    return new Promise((resolve, reject) => {
      connectDB()
        .then(() => {
          User.findByIdAndUpdate(userId, { blocked: false }, { new: true })
            .then((updatedUser) => {
              if (updatedUser) {
                resolve(updatedUser);
              } else {
                resolve(null);
              }
            })
            .catch((error) => {
              console.log("Failed to update user:", error);
              reject(error);
            });
        })
        .catch((error) => {
          console.log("Failed to connect to the database:", error);
          reject(error);
        });
    });
  },

  addAddressToUser: async (
    userId,
    country,
    billingAddressName,
    address,
    townCity,
    zipPostalCode,
    email,
    number
  ) => {
    try {
      const addressObj = {
        country: country,
        billingAddressName: billingAddressName,
        address: address,
        townCity: townCity,
        zipPostalCode: zipPostalCode,
        email: email,
        number: number,
      };
      await User.updateOne(
        { _id: userId },
        {
          $push: { address: addressObj },
        }
      );
    } catch (err) {
      console.log(err);
    }
  },

  deleteAddress: async (userId, addressId) => {
    try {
      await User.updateOne(
        { _id: userId },
        {
          $pull: { address: { _id: addressId } },
        }
      );
    } catch (error) {
      console.log(error);
    }
  },

  getAddresses: async (userId) => {
    try {
      return await User.aggregate([
        {
          $match: { _id: mongoose.Types.ObjectId.createFromHexString(userId) },
        },
        {
          $unwind: "$address",
        },
        {
          $project: {
            name: "$address.billingAddressName",
            address: "$address.address",
            number: "$address.number",
            _id: "$address._id",
            email: "$address.email",
            country: "$address.country",
            townCity: "$address.townCity",
            zipPostalCode: "$address.zipPostalCode",
          },
        },
      ]).exec();
    } catch (err) {
      console.log(err);
    }
  },

  getAddress: async (userId, addressId) => {
    try {
      return await User.aggregate([
        {
          $match: { _id: mongoose.Types.ObjectId.createFromHexString(userId) },
        },
        {
          $unwind: "$address",
        },
        {
          $match: {
            "address._id":
              mongoose.Types.ObjectId.createFromHexString(addressId),
          },
        },
        {
          $project: {
            _id: 0,
            address: 1,
          },
        },
      ]).exec();
    } catch (err) {
      console.log(err);
    }
  },

  editAddress: async (userId, addressId, addressDetails) => {
    try {
      await User.updateOne(
        { _id: userId },
        { $pull: { address: { _id: addressId } } }
      );
      const addressObj = {
        country: addressDetails.country,
        billingAddressName: addressDetails.billingAddressName,
        address: addressDetails.address,
        townCity: addressDetails.townCity,
        zipPostalCode: addressDetails.zipPostalCode,
        email: addressDetails.email,
        number: addressDetails.number,
      };
      await User.updateOne(
        { _id: userId },
        {
          $push: { address: addressObj },
        }
      );
    } catch (err) {
      console.log(err);
    }
  },

  editUser: async (userId, userDetails) => {
    try {
      await User.findByIdAndUpdate(
        userId,
        { name: userDetails.name },
        { email: userDetails.email },
        { mobile: userDetails.mobile },
        { new: true }
      );
    } catch (err) {
      console.log(err);
    }
  },

  findUser: async (userId) => {
    try {
      return await User.find({ _id: userId });
    } catch (err) {
      console.log(err);
    }
  },

  getAdminByMail: (email,password) => {
    return new Promise((resolve, reject) => {
      connectDB().then(() => {
        User.findOne({ email: email })
          .then((admin) => {
            if (admin) {
              bcrypt.compare(password, admin.password, (err, result) => {
                if (err) {
                  console.log("Password comparison error:", err);
                  reject(err);
                }
                if (result) {
                  resolve(admin);
                } else {
                  resolve(null);
                }
              });
            } else {
              resolve(null);
            }
          })
          .catch((error) => {
            console.log("Failed to retrieve admin:", error);
            reject(error);
          });
      });
    });
  },

  getUserById: (_id) => {
    return new Promise((resolve, reject) => {
      connectDB().then(() => {
        User.findById(_id)
          .then((user) => {
            if (user) {
              resolve(user);
            } else {
              resolve(null);
            }
          })
          .catch((error) => {
            console.log("Failed to retrieve user:", error);
            reject(error);
          });
      });
    });
  },
};


module.exports.getUsers = (data) => {
  return new Promise((resolve, reject) => {
    connectDB()
      .then(() => {
        User.findOne({ email: data.email })
          .then((user) => {
            if (user) {
              bcrypt
                .compare(data.password, user.password)
                .then((isMatch) => {
                  if (isMatch) {
                    resolve(user);
                  } else {
                    resolve(null);
                  }
                })
                .catch((error) => {
                  console.log("Error comparing passwords:", error);
                  reject(error);
                });
            } else {
              resolve(null);
            }
          })
          .catch((error) => {
            console.log("Failed to retrieve users:", error);
            reject(error);
          });
      })
      .catch((error) => {
        console.log("Failed to connect to the database:", error);
        reject(error);
      });
  });
};

module.exports.getAllUsers = () => {
  return new Promise((resolve, reject) => {
    connectDB()
      .then(() => {
        User.find({})
          .then((user) => {
            resolve(user);
          })
          .catch((error) => {
            console.log("Failed to retrieve users:", error);
            reject(error);
          });
      })
      .catch((error) => {
        console.log("Failed to connect to the database:", error);
        reject(error);
      });
  });
};

module.exports.addToCart = (proId, userId, quantity) => {
  let proObj = {
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
