const cartHelper = require("../helpers/cart-helpers");
const categoryHelpers = require("../helpers/category-helpers");
const couponHelper = require("../helpers/coupon-helpers");

const addToCart = async (req, res) => {
  try {
    const proId = req.query.id;
    const userId = req.session.user._id;
    const quantity = req.query.quantity;
    await cartHelper.addToCart( proId, userId, quantity);
    res.redirect(`/productdetails?proId=${proId}`);
  } catch (err) {
    console.log(err);
    res.render('error-404')
  }
};

const viewCart = async (req, res) => {
  try {
    let total;
    let products = await cartHelper.getCartProducts(req.session.user._id);
    if(products.length === 0){
      total = 0
    } else {
      total = await cartHelper.getTotal(req.session.user._id);
      total = total[0].total
    }
    let coupons = await couponHelper.userGetCoupons()
    const categories = await categoryHelpers.getAllCategories();
    res.render("user/cart", { products, total, categories, coupons, user: true, title: "Cart"});
  } catch (error) {
    console.log(error);
    res.render('error-404')
  }
};

const changeQuantity = async (req, res) => {
  try {
    cartHelper.changeProductQuantity(req.body).then((response) => {
      if (response.removeProduct) {
        res.json({ removeProduct: true });
      } else {
        res.json({ status: true });
      }
    });
  } catch (error) {
    console.log(error);
    res.render('error-404')
  }
};


module.exports = {
  addToCart,
  viewCart,
  changeQuantity,
};
