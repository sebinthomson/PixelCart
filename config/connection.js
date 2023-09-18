const mongoose = require('mongoose');

const connectDB = () => {
  return mongoose.connect('mongodb+srv://sebinthomson:jhNpEObjQX1je85G@cluster0.t2myoxd.mongodb.net/', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
    .then(() => {
    })
    .catch((err) => {
      console.log("MongoDB connection error:", err);
    });
};

module.exports = connectDB;