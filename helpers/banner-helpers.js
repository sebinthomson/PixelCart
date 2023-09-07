const connectDB = require("../config/connection");
const Banner = require("../models/banner");

const adminGetAllBanners = async () => {
    try {
        await connectDB();
        return await Banner.find().sort({ _id: -1 });
    } catch (error) {
        console.log(error)
    }
}

const getBannerById = async (id) => {
    try {
        await connectDB();
        return await Banner.findById(id);
    } catch (error) {
        console.log(error)
    }
}

const addBanner = async (bannerDetails) => {
    try {
        await connectDB();
        return await Banner.create(bannerDetails);
    } catch (err) {
        console.log(err);
    }
};

const userGetBanners = async () => {
    try {
        await connectDB();
        return await Banner.find({isDeleted: false});
    } catch (error) {
        console.log(error)
    }
}

const updateBanner = (bannerId, bannerDetails) => {
  return new Promise((resolve, reject) => {
    connectDB()
      .then(() => {
        Banner.findByIdAndUpdate(bannerId, bannerDetails, { new: true })
          .then((updatedBanner) => {
            if (updatedBanner) {
              resolve(updatedBanner);
            } else {
              resolve(null);
            }
          })
          .catch((error) => {
            console.log("Failed to update banner:", error);
            reject(error);
          });
      })
      .catch((error) => {
        console.log("Failed to connect to the database:", error);
        reject(error);
      });
  });
};

const softDeleteBanner = (bannerId) => {
  return new Promise((resolve, reject) => {
    connectDB()
      .then(() => {
        Banner.findByIdAndUpdate(bannerId, { isDeleted: true }, { new: true })
          .then((updatedBanner) => {
            if (updatedBanner) {
              resolve(updatedBanner);
            } else {
              resolve(null);
            }
          })
          .catch((error) => {
            console.log("Failed to update banner:", error);
            reject(error);
          });
      })
      .catch((error) => {
        console.log("Failed to connect to the database:", error);
        reject(error);
      });
  });
};

const softRecoverBanner = (bannerId) => {
  return new Promise((resolve, reject) => {
    connectDB()
      .then(() => {
        Banner.findByIdAndUpdate(bannerId, { isDeleted: false }, { new: true })
          .then((updatedBanner) => {
            if (updatedBanner) {
              resolve(updatedBanner);
            } else {
              resolve(null);
            }
          })
          .catch((error) => {
            console.log("Failed to update banner:", error);
            reject(error);
          });
      })
      .catch((error) => {
        console.log("Failed to connect to the database:", error);
        reject(error);
      });
  });
};

module.exports = {
    adminGetAllBanners,
    addBanner,
    userGetBanners,
    getBannerById,
    updateBanner,
    softDeleteBanner,
    softRecoverBanner
}