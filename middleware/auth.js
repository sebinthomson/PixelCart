const userHelpers = require("../helpers/user-helpers");

const isBlocked = async (req, res, next) => {
  try {
    const user = await userHelpers.getUserById(req.session.user._id);
    const check = user.blocked;
    if (check) {
      res.render('error-404',{title: "You are blocked by the admin"})
    } else {
      next();
    }
  } catch (error) {
    console.log(error);
  }
};
const isLogin = (req, res, next) => {
  try {
    if (!req.session.user) {
      res.redirect("/login");
    } else {
      next();
    }
  } catch (error) {
    console.log(error);
  } 
};

module.exports = {
  isLogin,
  isBlocked,
};
