const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  orderAddress: {
    country: {
      type: String,
    },
    billingAddressName: {
      type: String,
    },
    address: {
      type: String,
    },
    townCity: {
      type: String,
    },
    zipPostalCode: {
      type: String,
    },
    email: {
      type: String,
    },
    number: {
      type: Number,
    },
  },
  products: [
    {
      item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      name: {
        type: String,
        required: true
      },
      quantity: {
        type: Number,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
    },
  ],
  orderDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  deliveredDate: {
    type: Date,
  },
  discount: {
    type: Number,
  },
  subTotal: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
  },
  paymentMode: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Order", orderSchema);
