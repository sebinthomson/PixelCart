const categoryHelpers = require("../helpers/category-helpers");
const couponHelper = require("../helpers/coupon-helpers");
const cartHelper = require("../helpers/cart-helpers");

const adminCoupons = async (req, res) => {
  try {
    const coupons = await couponHelper.adminGetAllCoupons();

    const itemsPerPage = 5;
    const currentPage = parseInt(req.query.page) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedCoupons = coupons.slice(startIndex, endIndex);
    const totalPages = Math.ceil(coupons.length / itemsPerPage);
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }

    res.render("admin/adminCoupons", {
      coupons: paginatedCoupons,
      currentPage,
      totalPages,
      pages,
      admin: true,
      title: "Coupons",
    });
  } catch (err) {
    console.log(err);
    res.render('error-404')
  }
};

const adminAddCouponPage = async (req, res) => {
  try {
    res.render("admin/adminCoupons-add", { admin: true, title: "Add Coupon" });
  } catch (error) {
    console.log(error.message);
    res.render('error-404')
  }
};

const adminAddCoupon = async (req, res) => {
  try {
    console.log(req.body);
    await couponHelper.addCoupon(req.body);
    res.redirect("/admin/admin-coupons");
  } catch (error) {
    console.log(error.message);
    res.render('error-404')
  }
};

const adminDeleteCoupon = async (req, res) => {
  try {
    try {
      const couponId = req.query.couponId;
      const coupon = await couponHelper.getCouponById({ _id: couponId });
      if (!coupon) {
        return res.redirect("/admin/admin-coupons");
      }
      await couponHelper.softDeleteCoupon(couponId);
      res.redirect("/admin/admin-coupons");
    } catch (err) {
      console.log(err);
      res.redirect("/admin/admin-coupons");
    }
  } catch (error) {
    console.log(error.message);
    res.render('error-404')
  }
};

const adminRecoverCoupon = async (req, res) => {
  try {
    try {
      const couponId = req.query.couponId;
      const coupon = await couponHelper.getCouponById({ _id: couponId });
      if (!coupon) {
        return res.redirect("/admin/admin-coupons");
      }
      await couponHelper.softRecoverCoupon(couponId);
      res.redirect("/admin/admin-coupons");
    } catch (err) {
      console.log(err);
      res.redirect("/admin/admin-coupons");
    }
  } catch (error) {
    console.log(error.message);
    res.render('error-404')
  }
};

const adminGetCoupon = async (req, res) => {
  try {
    const couponId = req.query.couponId;
    const coupon = await couponHelper.getCouponById({ _id: couponId });
    if (!coupon) {
      return res.redirect("/admin/admin-coupons");
    }
    res.render("admin/adminCoupons-edit", {
      coupon: coupon,
      admin: true,
      title: "Admin Edit Coupon",
    });
  } catch (err) {
    console.log(err);
    res.redirect("/admin/admin-coupons");
    res.render('error-404')
  }
};

const adminEditCoupon = async (req, res) => {
  try {
    couponHelper.updateCoupon(req.params.id, req.body);
    res.redirect("/admin/admin-coupons");
  } catch (error) {
    console.log(error.message);
    res.render('error-404')
  }
};

const userGetCoupons = async (req, res) => {
  try {
    const coupons = await couponHelper.userGetCoupons()
    res.json({coupons})
  } catch (err) {
    console.log(err);
    res.render('error-404')
  }
};

const userApplyCoupon = async (req, res) => {
  try {
    const couponCode = req.body.couponCode
    const userId = req.session.user._id
    let cartTotal = await cartHelper.getTotal(userId)
    cartTotal = cartTotal[0].total
    let couponDetails = await couponHelper.getCouponByCode(couponCode)
    couponDetails = couponDetails[0]
    if(cartTotal >= couponDetails.minAmount){
      discount = ( cartTotal * couponDetails.discount ) * 100
      if(discount > couponDetails.maxDiscount) {
        discount = couponDetails.maxDiscount
      }
      cartTotal = cartTotal - discount;
      let obj = {
        discount: discount, 
        grandTotal: cartTotal
      }
      res.json({ obj, noMinAmount: false })
    } else {
      res.json ({noMinAmount: true})
    }
  } catch (err) {
    console.log(err);
    res.render('error-404')
  }
};

module.exports = {
  adminCoupons,
  adminAddCouponPage,
  adminAddCoupon,
  adminDeleteCoupon,
  adminRecoverCoupon,
  adminGetCoupon,
  adminEditCoupon,
  userGetCoupons,
  userApplyCoupon
};
