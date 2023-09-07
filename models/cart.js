const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  products: [
    {
      item: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      name: {
        type: String,
      },
      quantity: {
        type: Number,
        default: 0
      },
      price: {
        type: Number
      },
      total: {
        type: Number,
        default: 0
      },
    },
  ],
});

module.exports = mongoose.model("Cart", cartSchema);



