const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  brand: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  color: {
    type: String,
    required: true,
  },
  stock: {
    type: Number,
    default: 0
  },
  description: {
    type: [String],
    default: [],
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  images: [{
    data: Buffer,
    contentType: {
      type: String,
      default: 'image/jpeg',
    }
  }],
  isDeleted:{
    type:Boolean,
    default:false
  },
});

module.exports = mongoose.model('Product', productSchema);




