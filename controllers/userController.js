const productHelpers = require("../helpers/product-helpers");
const categoryHelpers = require("../helpers/category-helpers");
const userHelper = require("../helpers/user-helpers");
const cartHelper = require("../helpers/cart-helpers");
const walletHelper = require("../helpers/wallet-helpers");
const bannerHelper = require("../helpers/banner-helpers");
const couponHelper = require("../helpers/coupon-helpers");
require("dotenv").config();

// twilio otp
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioVerifySid = process.env.TWILIO_VERIFY_SID;
const client = require("twilio")(twilioAccountSid, twilioAuthToken);

const landingPage = async (req, res) => {
  try {
    if (req.session.user) {
      res.redirect("/home");
    }
    const categories = await categoryHelpers.getAllCategories();
    const banners = await bannerHelper.userGetBanners();
    const products = await productHelpers.getAllProducts();
    const coupons = await couponHelper.userGetCoupons();

    const itemsPerPage = 6;
    const currentPage = parseInt(req.query.page) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProducts = products.slice(startIndex, endIndex);
    const totalPages = Math.ceil(products.length / itemsPerPage);
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }

    res.render("user/landingPage", {
      products: paginatedProducts,
      banners,
      categories,
      currentPage,
      totalPages,
      pages,
      coupons,
      user: true,
      title: "LandingPage",
      userStatus: "Login",
      userStatusLink: "/login",
    });
  } catch (error) {
    res.render("error-404");
    console.log(error.message);
  }
};
// to send verification code
const verify = async (req, res) => {
  try {
    let mobileNumber = req.body.mobileNumber;
    console.log(mobileNumber);
    client.verify.v2
      .services(twilioVerifySid)
      .verifications.create({ to: mobileNumber, channel: "whatsapp" })
      .then((verification) => {
        res.render("user/verify_otp", { mobileNumber, newUser: true });
      })
      .catch((error) => {
        console.log(error);
        res.render("error-404", { twilliofail: true });
      });
  } catch (error) {
    res.render("error-404");
    console.log(error.message);
  }
};
// to check the received otp
const verifys = async (req, res) => {
  try {
    const mobile = req.body.mobileNumber;
    const otpCode = req.body.otp;
    client.verify
      .services(twilioVerifySid)
      .verificationChecks.create({ to: mobile, code: otpCode })
      .then((verificationCheck) => {
        res.render("user/signup", { mobile, title: "Signup" });
      })
      .catch((error) => {
        console.log(error);
        res.send("Error occurred during OTP verification");
      });
  } catch (error) {
    res.render("error-404");
    console.log(error.message);
  }
};

// to send verification code
const forgotPasswordverify = async (req, res) => {
  try {
    const mobileNumber = req.body.mobileNumber;
    client.verify.v2
      .services(twilioVerifySid)
      .verifications.create({ to: mobileNumber, channel: "whatsapp" })
      .then((verification) => {
        res.render("user/verify_otp", { mobileNumber, forgotUser: true });
      })
      .catch((error) => {
        console.log(error);
        res.send("Error occurred during OTP generation");
      });
  } catch (error) {
    res.render("error-404");
    console.log(error.message);
  }
};
// to check the received otp
const forgotPasswordverifys = async (req, res) => {
  try {
    const mobile = req.body.mobileNumber;
    const otpCode = req.body.otp;
    client.verify
      .services(twilioVerifySid)
      .verificationChecks.create({ to: mobile, code: otpCode })
      .then((verificationCheck) => {
        res.render("user/changePassword", { mobile });
      })
      .catch((error) => {
        console.log(error);
        res.send("Error occurred during OTP verification");
      });
  } catch (error) {
    res.render("error-404");
    console.log(error.message);
  }
};

const changedPassword = async (req, res) => {
  try {
    const mobile = req.body.mobile;
    const password = req.body.password;
    const user = { mobile, password };
    userHelper.updateUser(user, (stat) => {
      if (stat === "DONE") {
        res.render("user/login", { title: "Login" });
      } else if (stat === "USER_ALREADY_EXISTS") res.redirect("/login");
    });
  } catch (error) {
    res.render("error-404");
    console.log(error.message);
  }
};

const signup = async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;
    const user = { name, email, mobile, password };
    userHelper.addUser(user, (stat) => {
      if (stat === "DONE") {
        res.render("user/login", { email, title: "Login" });
      } else if (stat === "USER_ALREADY_EXISTS") res.redirect("/login");
    });
  } catch (error) {
    res.render("error-404");
    console.log(error.message);
  }
};

const login = async (req, res) => {
  try {
    if (req.session.user) {
      res.redirect("/home");
    }
    res.render("user/signup&login", {
      loginErr: req.session.loginErr,
      title: "Signup & Login",
    });
    req.session.loginErr = false;
  } catch (error) {
    res.render("error-404");
    console.log(error.message);
  }
};

const getuserlogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const user = await userHelper.getUsers({
      email: email,
      password: password,
    });
    if (!user) {
      req.session.loginErr = true;
      return res.redirect("/login");
    }
    if (user) {
      req.session.user = user;
      return res.redirect("/home");
    }
  } catch (err) {
    console.log(err);
    res.redirect("/login");
  }
};

const forgotPassword = async (req, res) => {
  try {
    res.render("user/forgotpasswordotp");
  } catch (error) {
    console.log(error);
    res.render("error-404");
  }
};

const logout = async (req, res) => {
  try {
    req.session.user = false;
    res.redirect("/");
  } catch (error) {
    console.log(error.message);
  }
};

const home = async (req, res) => {
  try {
    const colors = await productHelpers.getAllColors();
    const brands = await productHelpers.getAllBrands();
    const categories = await categoryHelpers.getAllCategories();
    const products = await productHelpers.getAllProducts();
    const banners = await bannerHelper.userGetBanners();
    const coupons = await couponHelper.userGetCoupons();

    const itemsPerPage = 6;
    const currentPage = parseInt(req.query.page) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProducts = products.slice(startIndex, endIndex);
    const totalPages = Math.ceil(products.length / itemsPerPage);
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    res.render("user/index", {
      products: paginatedProducts,
      currentPage,
      totalPages,
      pages,
      coupons,
      categories,
      colors,
      banners,
      user: true,
      brands,
      title: "Home",
    });
  } catch (error) {
    res.render("error-404");
    console.log(error.message);
  }
};

const filterProducts = async (req, res) => {
  const productCategory = req.body.productCategory;
  const productBrand = req.body.productBrand;
  const productColor = req.body.productColor;
  const productRange = req.body.productRange;
  let sort = req.body.sort;
  const search = req.body.search;
  let rangefilter = [];
  const filter = { isDeleted: false };
  if (search) {
    const regex = new RegExp("^" + search, "i");
    filter.name = regex;
  }
  if (productCategory) {
    filter.category = { $in: productCategory };
  }
  if (productBrand) {
    filter.brand = { $in: productBrand };
  }
  if (productColor) {
    filter.color = { $in: productColor };
  }
  if (productRange) {
    for (let i = 0; i < productRange.length; i++) {
      if (productRange[i] == "lt1000") {
        rangefilter.push({ price: { $lte: 1000 } });
      }
      if (productRange[i] == "lt1500") {
        rangefilter.push({ price: { $gt: 1000, $lte: 1500 } });
      }
      if (productRange[i] == "lt2000") {
        rangefilter.push({ price: { $gt: 1500, $lte: 2000 } });
      }
      if (productRange[i] == "lt2500") {
        rangefilter.push({ price: { $gt: 2000, $lte: 2500 } });
      }
      if (productRange[i] == "gt2500") {
        rangefilter.push({ price: { $gt: 2500 } });
      }
    }
    filter.$or = rangefilter;
  }
  if (sort) {
    if (sort == "HL") {
      sort = { price: -1 };
    }
    if (sort == "LH") {
      sort = { price: 1 };
    }
    if (sort == "NA") {
      sort = { date: -1 };
    }
  } else {
    sort = { date: -1 };
  }
  const products = await productHelpers.getFilterBrand(filter, sort);
  const itemsPerPage = 6;
  let currentPage = parseInt(req.body.page);
  if (isNaN(currentPage)) {
    currentPage = 1;
  }
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = products.slice(startIndex, endIndex);
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }
  if (products.length) {
    res.json({ products: paginatedProducts, currentPage, totalPages, pages });
  } else {
    res.json({ noProducts: true });
  }
};

const getProductDetails = async (req, res) => {
  try {
    const id = req.query.proId;
    const product = await productHelpers.getProductById({ _id: id });
    if (!product) {
      return res.redirect("/login");
    }
    res.render("user/product-detail", {
      product,
      user: true,
      title: "Product Detail",
    });
  } catch (err) {
    console.log(err);
    res.render("error-404");
  }
};

const proceedToCheckout = async (req, res) => {
  try {
    let discount = req.query.discount;
    if (!discount) discount = 0;
    let total;
    const addresses = await userHelper.getAddresses(req.session.user._id);
    let products = await cartHelper.getCartProducts(req.session.user._id);
    let wallet = await walletHelper.getWallet(req.session.user._id);
    if (products.length === 0) {
      total = 0;
    } else {
      total = await cartHelper.getTotal(req.session.user._id);
      total = total[0].total - discount;
    }
    res.render("user/checkout", {
      discount,
      addresses,
      products,
      total,
      wallet,
      user: true,
      title: "Checkout",
    });
  } catch (err) {
    console.log(err);
    res.render("error-404");
  }
};

const addAddress = async (req, res) => {
  try {
    const country = req.body.country;
    const billingAddressName = req.body.billingAddressName;
    const address = req.body.address;
    const townCity = req.body.townCity;
    const zipPostalCode = req.body.zipPostalCode;
    const email = req.body.email;
    const number = req.body.number;
    await userHelper.addAddressToUser(
      req.session.user._id,
      country,
      billingAddressName,
      address,
      townCity,
      zipPostalCode,
      email,
      number
    );
    res.redirect("proceedToCheckout");
  } catch (err) {
    console.log(err);
    res.render("error-404");
  }
};

const profile = async (req, res) => {
  try {
    const addresses = await userHelper.getAddresses(req.session.user._id);
    let userDetails = await userHelper.findUser(req.session.user._id);
    userDetails = userDetails[0];
    res.render("user/profile", {
      addresses,
      userDetails,
      user: true,
      title: "Profile Management",
    });
  } catch (error) {
    console.log(error);
    res.render("error-404");
  }
};

const editAddress = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const addressid = req.query.addressId;
    await userHelper.editAddress(userId, addressid, req.body);
    res.redirect("/profile");
  } catch (error) {
    console.log(error);
  }
};

const editUser = async (req, res) => {
  try {
    const userId = req.session.user._id;
    await userHelper.editUser(userId, req.body);
    res.redirect("/profile");
  } catch (error) {
    console.log(error);
    res.render("error-404");
  }
};

const deleteAddress = async (req, res) => {
  try {
    const addressId = req.query.addressId;
    const userId = req.session.user._id;
    await userHelper.deleteAddress(userId, addressId);
    res.redirect("/profile");
  } catch (error) {
    console.log(error);
    res.render("error-404");
  }
};

module.exports = {
  landingPage,
  verify,
  verifys,
  signup,
  login,
  getuserlogin,
  logout,
  home,
  getProductDetails,
  proceedToCheckout,
  addAddress,
  profile,
  editAddress,
  editUser,
  deleteAddress,
  forgotPassword,
  forgotPasswordverify,
  forgotPasswordverifys,
  changedPassword,
  filterProducts,
};
