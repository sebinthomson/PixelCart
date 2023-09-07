const connectDB = require("../config/connection");
const Category = require("../models/category");
const Products = require("../models/product");

module.exports = {
  addCategory: (category, callback) => {
    connectDB().then(() => {
      Category.create(category)
        .then((data) => {
          callback(data._id);
        })
        .catch((error) => {
          console.log("Failed to add category:", error);
          callback(false);
        });
    });
  },

  getAllCategories: async () => {
    try {
      await connectDB();
      return await Category.find().sort({ _id: -1 });
    } catch (err) {
      console.log(err);
    }
  },

  getCategoryName: async (id) => {
    try {
      await connectDB();
      const categoryDetails = await Category.find({ _id: id });
      return categoryDetails[0].categoryName;
    } catch (error) {
      console.log(error);
    }
  },

  getCategoryById: (_id) => {
    return new Promise((resolve, reject) => {
      connectDB().then(() => {
        Category.findById(_id)
          .then((category) => {
            if (category) {
              resolve(category);
            } else {
              resolve(null);
            }
          })
          .catch((error) => {
            console.log("Failed to retrieve category:", error);
            reject(error);
          });
      });
    });
  },

  updateCategory: (catId, catDetails) => {
    return new Promise((resolve, reject) => {
      connectDB()
        .then(() => {
          Category.findByIdAndUpdate(catId, catDetails, { new: true })
            .then((updatedCategory) => {
              if (updatedCategory) {
                resolve(updatedCategory);
              } else {
                resolve(null);
              }
            })
            .catch((error) => {
              console.log("Failed to update category:", error);
              reject(error);
            });
        })
        .catch((error) => {
          console.log("Failed to connect to the database:", error);
          reject(error);
        });
    });
  },

  softDeleteCategory: (catId) => {
    return new Promise((resolve, reject) => {
      connectDB()
        .then(() => {
          Category.findByIdAndUpdate(
            catId,
            { categoryBlock: true },
            { new: true }
          )
            .then((updateCategory) => {
              if (updateCategory) {
                resolve(updateCategory);
              } else {
                resolve(null);
              }
            })
            .catch((error) => {
              console.log("Failed to update category:", error);
              reject(error);
            });
        })
        .catch((error) => {
          console.log("Failed to connect to the database:", error);
          reject(error);
        });
    });
  },

  softRecoverCategory: (catId) => {
    return new Promise((resolve, reject) => {
      connectDB()
        .then(() => {
          Category.findByIdAndUpdate(
            catId,
            { categoryBlock: false },
            { new: true }
          )
            .then((updatedCategory) => {
              if (updatedCategory) {
                resolve(updatedCategory);
              } else {
                resolve(null);
              }
            })
            .catch((error) => {
              console.log("Failed to update category:", error);
              reject(error);
            });
        })
        .catch((error) => {
          console.log("Failed to connect to the database:", error);
          reject(error);
        });
    });
  },

  categoryCount: async () => {
    return new Promise((resolve, reject) => {
      connectDB().then(() => {
        Category.find({ categoryBlock: false })
          .count()
          .then((data) => {
            resolve(data);
          });
      });
    });
  },
};
