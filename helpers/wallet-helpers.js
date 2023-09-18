const connectDB = require("../config/connection");
const Wallet = require("../models/wallet");
const userHelper = require("../helpers/user-helpers");

const getWallet = async (userId) => {
  try {
    const user = await userHelper.findUser(userId);
    const userName = user[0].name
    return new Promise((resolve, reject) => {
      connectDB().then(async () => {
        try {
          let wallet = await Wallet.findOne({ user: userId });
          if (!wallet) {
            wallet = new Wallet({
              user: userId,
              userName: userName,
              balance: 0,
            });
            await wallet.save();
          } else {
            resolve(wallet);
          }
        } catch (error) {
          reject(error); // Reject the Promise on error
        }
      });
    });
  } catch (error) {
    console.log(error);
  }
};

const upsertWallet = async (userId, userName, balance) => {
  try {
    return await Wallet.updateOne(
      { user: userId },
      { $set: { userName: userName, balance: balance } },
      { upsert: true }
    );
  } catch (error) {
    console.log(error)
  }
}

module.exports = {
  getWallet,
  upsertWallet
};
