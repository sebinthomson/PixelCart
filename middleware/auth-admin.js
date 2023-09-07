const isLogin = (req, res, next) => {
  try {
    if (!req.session.admin) {
      res.redirect("/admin/");
    } else {
      next();
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  isLogin,
};
