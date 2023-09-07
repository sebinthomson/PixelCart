const connectDB = require("../config/connection");
const Coupon = require("../models/coupon");

const adminGetAllCoupons = async (req, res) => {
  try {
    await connectDB();
    return await Coupon.find();
  } catch (err) {
    console.log(err);
  }
};

const userGetCoupons = async (req, res) => {
  try {
    await connectDB();
    return await Coupon.find({ isDeleted: false });
  } catch (err) {
    console.log(err);
  }
};

const addCoupon = async (couponDetails) => {
  try {
    await connectDB();
    return await Coupon.create(couponDetails);
  } catch (err) {
    console.log(err);
  }
};

const getCouponById = (_id)=> {
  return new Promise((resolve, reject) => {
    connectDB().then(() => {
    Coupon.findById(_id)
      .then((coupon) => {
        if (coupon) {
          resolve(coupon);
        } else {
          resolve(null);
        }
      })
      .catch((error) => {
        console.log('Failed to retrieve coupon:', error);
        reject(error);
      });
    });
  });
}

const softDeleteCoupon = (couponId) => {
  return new Promise((resolve, reject) => {
    connectDB()
      .then(() => {
        Coupon.findByIdAndUpdate(couponId, { isDeleted:true }, { new: true })
          .then((updatedCoupon) => {
            if (updatedCoupon) {
              resolve(updatedCoupon);
            } else {
              resolve(null);
            }
          })
          .catch((error) => {
            console.log('Failed to update coupon:', error);
            reject(error);
          });
      })
      .catch((error) => {
        console.log('Failed to connect to the database:', error);
        reject(error);
      });
  });
}

const softRecoverCoupon = (couponId) => {
  return new Promise((resolve, reject) => {
    connectDB()
      .then(() => {
        Coupon.findByIdAndUpdate(couponId, { isDeleted: false }, { new: true })
          .then((updatedCoupon) => {
            if (updatedCoupon) {
              resolve(updatedCoupon);
            } else {
              resolve(null);
            }
          })
          .catch((error) => {
            console.log('Failed to update coupon:', error);
            reject(error);
          });
      })
      .catch((error) => {
        console.log('Failed to connect to the database:', error);
        reject(error);
      });
  });
}

const updateCoupon = (couponId, couponDetails) => {
  return new Promise((resolve, reject) => {
    connectDB()
      .then(() => {
        Coupon.findByIdAndUpdate(couponId, couponDetails, { new: true })
          .then((updatedCoupon) => {
            if (updatedCoupon) {
              resolve(updatedCoupon);
            } else {
              resolve(null);
            }
          })
          .catch((error) => {
            console.log('Failed to update coupon:', error);
            reject(error);
          });
      })
      .catch((error) => {
        console.log('Failed to connect to the database:', error);
        reject(error);
      });
  });
}

const getCouponByCode = async (couponCode) => {
try {
  await connectDB()
  return await Coupon.find({couponCode: couponCode})
} catch (error) {
  console.log(error);
}
}

module.exports = {
  adminGetAllCoupons,
  addCoupon,
  getCouponById,
  softDeleteCoupon,
  softRecoverCoupon,
  updateCoupon,
  userGetCoupons,
  getCouponByCode
};
