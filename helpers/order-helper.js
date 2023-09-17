const mongoose = require("mongoose");
const connectDB = require("../config/connection");
const Order = require("../models/order");
const Product = require("../models/product");
const Cart = require("../models/cart");
const Wallet = require("../models/wallet");
const userHelper = require("../helpers/user-helpers");
const walletHelper = require("../helpers/wallet-helpers")
const Razorpay = require("razorpay");
const { log } = require("console");
var instance = new Razorpay({
  key_id: 'rzp_test_bzZUpodgXWeMku',
  key_secret: 'OFs9tn09tmXouMXz1ycRsDj8'
})

const placeOrder = async (userName, userId, address, products, total, paymentMode) => {
  return new Promise(async (resolve, reject) => {
    const addressDetails ={
      country: address.country,
      billingAddressName: address.billingAddressName,
      address: address.address,
      townCity: address.townCity,
      zipPostalCode: address.zipPostalCode,
      email: address.email,
      number: address.number,
    }
    let status = 'Order Failed';
    const orderProducts = products.map((products) => {
      return {
        item: products.product._id,
        name: products.product.name,
        quantity: products.quantity,
        price: products.product.price,
        productStatus: status
      };
    });
    let orderObj = {
      user: userId,
      userName: userName,
      orderAddress: addressDetails,
      products: orderProducts,
      subTotal: total,
      paymentMode: paymentMode,
      status: status
    }
    connectDB()
    .then(async () =>{
      await Order.create(orderObj)
      .then(async (response) => {
        let orderId = response._id
        resolve(orderId)
      })
    })
  })
};

const clearCartAndStock = async (userId, orderId) => {
  try {
    await connectDB();
    await Cart.deleteOne({ user: userId });
    const order = await Order.findOne({ _id: orderId }).populate(
      "products.item"
      );
      order.products.map(async (item) => {
        let stock = item.item.stock - item.quantity;
        
        await Product.findByIdAndUpdate(
          item.item._id,
          {
            stock: stock,
        },
        { new: true }
        );
      });
    } catch (error) {
      console.log(error);
    }
  };
  
const changeOrderStatus = async (orderId) => {
  try {
    await connectDB()
    const order = await Order.findById(orderId)
    let status;
    if(order.paymentMode == 'COD'){
      status = 'Pending Approval'
    } else {
      status = 'Order Placed'
    }
    return await Order.findByIdAndUpdate(orderId,{$set: { 'products.$[].productStatus': status },status: status},{new: true})
  } catch (error) {
    console.log(error);
  }
}

const updateProductStatus = async (orderId, productId, productStatus) => {
  try {
    await connectDB();
    console.log(orderId,productId,productStatus,'updateproductstatushelper')
    if(productStatus === "Cancelled" || productStatus ==="Returned") {
      let order = await Order.find({_id: orderId},{products: 1,user: 1})
      const userId = order[0].user.toString()
      const user = await userHelper.findUser(userId)
      order = order[0].products
      for (const orderItem of order) {
        if (orderItem._id.toString() === productId) {
          var refund = orderItem.refund;
          var balance = orderItem.price;
        }
      }
      if (!refund) {
        walletHelper.upsertWallet(userId, user[0].name, balance)
      }
      await Order.updateOne(
        { _id: orderId, "products._id": productId },
        { $set: { "products.$.refund": true, request: false } })
    }
    await Order.updateOne(
      { _id: orderId, "products._id": productId },
      { $set: { "products.$.productStatus": productStatus } }
    );
  } catch (error) {
    console.log(error);
  }
};

const userUpdateProductStatus = async (orderId, productId, productStatus) => {
  try {
    await connectDB();
    await Order.updateOne(
      { _id: orderId, "products.item": productId },
      { $set: { "products.$.productStatus": productStatus, request: true } }
    );
  } catch (error) {
    console.log(error);
  }
};

const getAllOrders = async () => {
  try {
    await connectDB();
    return await Order.find().sort({orderDate:-1});
  } catch (error) {
    console.log(error);
  }
};

const getUser = async (userId) => {
  try {
    await connectDB();
    return await Order.aggregate([
      {
        $match: { user: mongoose.Types.ObjectId.createFromHexString(userId) },
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $project: {
          _id: 0,
          name: 1,
          orders: 1
        },
      },
    ]).exec();
  } catch (error) {
    console.log(error);
  }
};

const getOrderById = async (_id)=> {
  try {
    await connectDB()
    return await Order.findById(_id)
    .populate({ path: "products.item", model: "Product" })
  } catch (error) {
    console.log(error);
  }
}

const updateOrder = async (orderId, orderStatus) => {
  try {
    await connectDB()
    if(orderStatus.status === "Delivered"){
      orderStatus.deliveredDate = Date.now()
      return await Order.findByIdAndUpdate(orderId, {$set: { 'products.$[].productStatus': orderStatus.status },status: orderStatus.status, deliveredDate: orderStatus.deliveredDate}, { new: true })
    }else {
      return await Order.findByIdAndUpdate(orderId, {$set: { 'products.$[].productStatus': orderStatus.status },status: orderStatus.status}, { new: true })
    }
  } catch (error) {
    console.log(error);
  }
}

const getOrders = async (userId) => {
  try {
    await connectDB()
    return await Order.find({user: userId}).sort({orderDate:-1})
  } catch (error) {
    console.log(error);
  }
}

const generateRazorpay = async (orderId, totalPrice) => {
  return new Promise((resolve, reject) => {
    var options = {
      amount: totalPrice*100,  // amount in the smallest currency unit
      currency: "INR",
      receipt: ""+orderId
    };
    instance.orders.create(options, function(err, order) {
      if(err){
        console.log(err);
      } else {
        resolve(order)
      }
    });
  })
}

const verifyPayment = async (details) => {
  return new Promise(async (resolve, reject) => {
    const secret = "OFs9tn09tmXouMXz1ycRsDj8";
    const crypto = require("crypto");
    let hmac = crypto.createHmac("sha256", secret);
    hmac.update(
      details.payment.razorpay_order_id +
        "|" +
        details.payment.razorpay_payment_id
    );
    hmac = hmac.digest("hex");
    if (hmac == details.payment.razorpay_signature) {
      resolve();
    } else {
      reject();
    }
  });
};

const changePaymentStatus = ((orderId)=>{
  return new Promise ((resolve,reject)=>{
      connectDB().then(()=>{
          Order.findByIdAndUpdate(orderId, {status:'Order Placed'})    
          .then(()=>{
              resolve()
          }).catch((error)=>{
              reject(error)
          })
      })
  })
})

const getOrdertotal = async () => {
  try {
    return new Promise((resolve, reject) => {
      connectDB().then(() => {
        Order.aggregate([
          {
            $match: {
              status: "Delivered", // Consider only completed orders
            },
          },
          {
            $group: {
              _id: null,
              totalPriceSum: { $sum: "$subTotal" },
              count: { $sum: 1 },
            },
          },
        ]).then((data) => {
          resolve(data);
        });
      });
    });
  } catch (error) {
    console.log(error);
  }
};

const getOnlineCount = () => {
  try {
    return new Promise((resolve, reject) => {
      connectDB().then(() => {
        Order.aggregate([
          {
            $match: {
              paymentMode: "ONLINE",
              status: "Delivered",
            },
          },
          {
            $group: {
              _id: null,
              totalPriceSum: { $sum: "$subTotal" },
              count: { $sum: 1 },
            },
          },
        ]).then((data) => {
          resolve(data);
        });
      });
    });
  } catch (error) {
    console.log(error);
  }
};

const getCODCount = () => {
  try {
    return new Promise((resolve, reject) => {
      connectDB().then(() => {
        Order.aggregate([
          {
            $match: {
              paymentMode: "COD",
              status: "Delivered",
            },
          },
          {
            $group: {
              _id: null,
              totalPriceSum: { $sum: "$subTotal" },
              count: { $sum: 1 },
            },
          },
        ]).then((data) => {
          resolve(data);
        });
      });
    });
  } catch (error) {
    console.log(error);
  }
};

const latestorders = () => {
  try {
    return new Promise((resolve, reject) => {
      connectDB().then(() => {
        Order.aggregate([
          {
            $unwind: "$products",
          },
          {
            $sort: {
              date: -1,
            },
          },
          {
            $limit: 5,
          },
        ]).then((data) => {
          resolve(data);
        });
      });
    });
  } catch (error) {
    console.log(error);
  }
};

const salesData = async () => {
  try {
   return new Promise ((resolve,reject)=>{
       connectDB()
        .then(()=>{
           Order.aggregate([
               {
                 $match: {
                   status: "Delivered", // Match only delivered orders
                 },
               },
               {
                 $group: {
                   _id: {
                     $dateToString: {
                       format: "%d-%m-%Y",
                       date: "$orderDate", // Group by the date field
                     },
                   },
                   dailySales: {
                     $sum: "$subTotal", // Calculate the daily sales using totalAmount
                   },
                 },
               },
               {
                 $sort: {
                   _id: 1, // Sort the results by date in ascending order
                 },
               },
             ])
             .then((data)=>{
               resolve(data)
             })
        })
   })
  } catch (error) {
   console.log(error)
  } 
}

const salesCount = async () => {
  try {
    return new Promise((resolve, reject) => {
      connectDB().then(() => {
        Order.aggregate([
          {
            $match: {
              status: "Delivered", // Match orders with "delivered" status
            },
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: "%d-%m-%Y",
                  date: "$orderDate", // Group by the "date" field
                },
              },
              orderCount: { $sum: 1 }, // Calculate the count of orders per date
            },
          },
          {
            $sort: {
              _id: 1, // Sort the results by date in ascending order
            },
          },
        ]).then((data) => {
          resolve(data);
        });
      });
    });
  } catch (error) {
    console.log(error);
  }
};

const categorySales = async () => {
  try {
    return new Promise((resolve, reject) => {
      connectDB().then(() => {
        Order.aggregate([
          {
            $unwind: "$products",
          },
          {
            $lookup: {
              from: "products",
              localField: "products.item",
              foreignField: "_id",
              as: "productDetails",
            },
          },
          {
            $unwind: "$productDetails",
          },
          {
            $match: {
              status: "Delivered",
            },
          },
          {
            $lookup: {
              from: "categories",
              localField: "productDetails.category",
              foreignField: "categoryName",
              as: "categoryDetails",
            },
          },
          {
            $unwind: "$categoryDetails",
          },
          {
            $project: {
              categoryId: "$categoryDetails._id",
              categoryName: "$categoryDetails.categoryName",
              totalPrice: {
                $multiply: [
                  { $toDouble: "$productDetails.price" },
                  "$products.quantity",
                ],
              },
            },
          },
          {
            $group: {
              _id: "$categoryId",
              categoryName: { $first: "$categoryName" },
              priceSum: { $sum: "$totalPrice" },
            },
          },
          {
            $project: {
              categoryName: 1,
              priceSum: 1,
              _id: 0,
            },
          },
        ]).then((data) => {
          resolve(data);
        });
      });
    });
  } catch (error) {
    console.log(error);
  }
};

const totalSaleToday = ()=>{
  try {
    const currentDate = new Date();
    console.log(currentDate)
    const yesterday = new Date(currentDate);
    yesterday.setDate(currentDate.getDate() - 1);
    return new Promise ((resolve , reject)=>{
      Order.aggregate([
        {
          $match: {
            "deliveredDate": {
              $gte: yesterday,
              $lte: currentDate
            }
          }
        }
      ]).then((data)=>{
        resolve(data)
      })
    })
  } catch (error) {
    console.log(error)
  }
}

const findOrdersDelivered = ()=>{
  try {
    return new Promise ((resolve,reject)=>{
      connectDB()
      .then(()=>{
        Order.find({status:"Delivered"}).then((data)=>{
          resolve(data)
        })
      })
    })
  } catch (error) {
    console.log(error)
  }
}

const findOrdersDelivered_populated = () => {
  try {
    return new Promise((resolve, reject) => {
      connectDB().then(() => {
        Order.find({ status: "Delivered" })
          .populate({ path: "user", model: "User" })
          .populate({ path: "products.item", model: "Product" })
          .exec()
          .then((data) => {
            resolve(data);
          });
      });
    });
  } catch (error) {
    console.log(error);
  }
};

const findOrderByDate = (startDate, endDate) => {
  try {
    return new Promise((resolve, reject) => {
      connectDB().then(() => {
        Order.find({
          status: "Delivered",
          deliveredDate: {
            $gte: startDate,
            $lte: endDate,
          },
        })
          .populate({ path: "user", model: "User" })
          .populate({ path: "products.item", model: "Product"})
          .exec()
          .then((data) => {
            resolve(data);
          });
      });
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  placeOrder,
  clearCartAndStock,
  changeOrderStatus,
  updateProductStatus,
  userUpdateProductStatus,
  getAllOrders,
  getUser,
  getOrderById,
  updateOrder,
  getOrders,
  generateRazorpay,
  verifyPayment,
  changePaymentStatus,
  getOrdertotal,
  getOnlineCount,
  getCODCount,
  latestorders,
  salesData,
  salesCount,
  categorySales,
  totalSaleToday,
  findOrdersDelivered,
  findOrdersDelivered_populated,
  findOrderByDate
};
