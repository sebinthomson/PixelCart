const connectDB = require("../config/connection");
const Product = require('../models/product');

module.exports = {
  addProduct: async (productDetails) => {
    try {
      await connectDB();
      return await Product.create(productDetails);
    } catch (err) {
      console.log(err);
    }
  },

  getAllColors: async () => {
    try {
      await connectDB();
      return await Product.distinct("color");
    } catch (err) {
      console.log(err);
    }
  },

  getAllBrands: async () => {
    try {
      await connectDB();
      return await Product.distinct("brand");
    } catch (err) {
      console.log(err);
    }
  },

  getAllProductsEvenDeleted: async () => {
    try {
      await connectDB();
      return await Product.find().sort({ date: -1 });
    } catch (err) {
      console.log(err);
    }
  },

  getAllProducts: async () => {
    try {
      await connectDB();
      return await Product.find({ isDeleted: false, stock: { $gt: 0 } }).sort({ date: -1 });
    } catch (err) {
      console.log(err);
    }
  },

  getFilterBrand: async (filter,sort) => {
    return new Promise((resolve, reject) => {
      connectDB().then(() => {
        Product.find(filter).sort(sort)
          .then((products) => {
            resolve(products);
          })
          .catch((error) => {
            console.error(error);
            reject(error);
          });
      });
    });
  },

  getProductById: (_id) => {
    return new Promise((resolve, reject) => {
      connectDB().then(() => {
        Product.findById(_id)
          .then((product) => {
            if (product) {
              resolve(product);
            } else {
              resolve(null);
            }
          })
          .catch((error) => {
            console.log("Failed to retrieve product:", error);
            reject(error);
          });
      });
    });
  },

  updateProduct: (proId, proDetails) => {
    return new Promise((resolve, reject) => {
      connectDB()
        .then(() => {
          Product.findByIdAndUpdate(proId, proDetails, { new: true })
            .then((updatedProduct) => {
              if (updatedProduct) {
                resolve(updatedProduct);
              } else {
                resolve(null);
              }
            })
            .catch((error) => {
              console.log("Failed to update product:", error);
              reject(error);
            });
        })
        .catch((error) => {
          console.log("Failed to connect to the database:", error);
          reject(error);
        });
    });
  },

  softDeleteBlockedCategoryProducts: async (categoryName) => {
    try {
      await connectDB();
      await Product.updateMany(
        { category: categoryName },
        { $set: { isDeleted: true } }
      );
    } catch (error) {
      console.log(error);
    }
  },

  softRecoverBlockedCategoryProducts: async (categoryName) => {
    try {
      await connectDB();
      await Product.updateMany(
        { category: categoryName },
        { $set: { isDeleted: false } }
      );
    } catch (error) {
      console.log(error);
    }
  },

  softDeleteProduct: (proId) => {
    return new Promise((resolve, reject) => {
      connectDB()
        .then(() => {
          Product.findByIdAndUpdate(proId, { isDeleted: true }, { new: true })
            .then((updatedProduct) => {
              if (updatedProduct) {
                resolve(updatedProduct);
              } else {
                resolve(null);
              }
            })
            .catch((error) => {
              console.log("Failed to update product:", error);
              reject(error);
            });
        })
        .catch((error) => {
          console.log("Failed to connect to the database:", error);
          reject(error);
        });
    });
  },

  softRecoverProduct: (proId) => {
    return new Promise((resolve, reject) => {
      connectDB()
        .then(() => {
          Product.findByIdAndUpdate(proId, { isDeleted: false }, { new: true })
            .then((updatedProduct) => {
              if (updatedProduct) {
                resolve(updatedProduct);
              } else {
                resolve(null);
              }
            })
            .catch((error) => {
              console.log("Failed to update product:", error);
              reject(error);
            });
        })
        .catch((error) => {
          console.log("Failed to connect to the database:", error);
          reject(error);
        });
    });
  },

  productsCount:()=>{
    return new Promise ((resolve , reject )=>{
      connectDB()
      .then(()=>{
        Product.find({}).count().then ((data)=>{
          resolve(data)
        })
      })
    })
  },
};

