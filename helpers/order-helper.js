const mongoose = require("mongoose");
const connectDB = require("../config/connection");
const Order = require("../models/order");
const Cart = require("../models/cart");
const Wallet = require("../models/wallet");
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
    const orderProducts = products.map((products) => {
      return {
        item: products.product._id,
        name: products.product.name,
        quantity: products.quantity,
        price: products.product.price,
      };
    });
    let status;
    if(paymentMode === 'COD'){
      status = 'Pending Approval'
    } else if (paymentMode === 'ONLINE') {
      status = 'Order Placed'
    }
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
      let createdOrder = await Order.create(orderObj)
      .then(async (response) => {
        let cartId = response._id
        await Cart.deleteOne({user: userId})
        resolve(cartId)
      }).then(async (response) => {
        const Products = await Order
          .findOne({_id: createdOrder._id})
          .populate("products.item")

        Products.products.map(async (item) => {
          let stock = item.item.stock - item.quantity

          await Products.findByIdAndUpdate(
            item.item._id,
            {
              stock: stock
            },
            { new: true }
          )
        })
      }).catch((error) => {
        console.log(error);
        reject(error)
      })
    })
  })
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
    if(orderStatus.status === "Cancelled") {
      let orderDetails = await Order.findOne({ _id: orderId }, { _id: 0, subTotal: 1, user: 1 });
      let userId = orderDetails.user
      let balance = orderDetails.subTotal
      await Wallet.updateOne({user: userId}, {balance: balance}, { upsert: true })
    }
    if(orderStatus.status === "Delivered"){
      orderStatus.deliveredDate = Date.now()
    }
    console.log(orderStatus,"orderStatus")
    return await Order.findByIdAndUpdate(orderId, orderStatus, { new: true })
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
