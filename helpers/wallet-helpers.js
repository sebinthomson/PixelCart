const mongoose = require("mongoose");
const connectDB = require("../config/connection");
const Wallet = require("../models/wallet");

const getWallet = async (userId) => {
  try {
    return new Promise((resolve, reject) => {
      connectDB().then(async () => {
        let wallet = await Wallet.findOne({ user: userId });
        if (!wallet) {
          wallet = new Wallet({
            userId: userId,
            balance: 0,
          });
          await wallet.save();
        } else {
          resolve(wallet);
        }
      });
    });
  } catch (error) {}
};

module.exports = {
  getWallet,
};
