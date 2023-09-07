const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  categoryName: {
    type: String,
    required: true,
  },
  categoryOffer: {
    type: Number,
  },
  categoryImage: {
    type: Array,
  },
  categoryBlock: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("Category", categorySchema);
