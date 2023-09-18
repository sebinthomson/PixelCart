const productHelpers = require("../helpers/product-helpers");
const categoryHelpers = require("../helpers/category-helpers");
const userHelpers = require("../helpers/user-helpers");
const orderHelpers = require("../helpers/order-helper");

const adminDashboard = async (req, res) => {
  try {
    let orders = await orderHelpers.getOrdertotal();
    orders = orders[0];
    const productsCount = await productHelpers.productsCount();
    const categoryCount = await categoryHelpers.categoryCount();
    let onlineOrders = await orderHelpers.getOnlineCount();
    onlineOrders = onlineOrders[0];
    let codOrders = await orderHelpers.getCODCount();
    codOrders = codOrders[0];
    const order = await orderHelpers.latestorders();
    const salesData = await orderHelpers.salesData();
    const salesCount = await orderHelpers.salesCount();
    const categorySales = await orderHelpers.categorySales();
    res.render("./admin/adminDashboard", {
      orders,
      productsCount,
      categoryCount,
      onlineOrders,
      codOrders,
      salesData,
      salesCount,
      order,
      categorySales,
      admin: true,
      title: "Admin-Analytics",
    });
  } catch (error) {
    console.log(error.message);
    res.render("error-404");
  }
};

const getAdminLogin = async (req, res) => {
  try {
    res.render("admin/admin-login"
    ,{title:"Admin-Login"});
  } catch (error) {
    console.log(error.message);
  }
};

const verifyAdmin = async (req, res) => {
  try {
    try {
      const email = req.body.email;
      const password = req.body.password;
      const admin = await userHelpers.getAdminByMail(email, password);
      if (admin.is_admin) {
        req.session.admin = true;
        req.session.admin = admin;
        res.redirect("/admin/admin-dashboard");
      } else {
        res.render("admin/admin-login");
      }
    } catch (err) {
      console.log(err);
      res.redirect("/");
    }
  } catch (error) {
    console.log(error.message);
    res.render("error-404");
  }
};

const logOut = async (req, res) => {
  try {
    req.session.admin = false;
    res.redirect("/admin");
  } catch (error) {
    console.log(error.message);
    res.render("error-404");
  }
};

const adminBlockUser = async (req, res) => {
  try {
    userHelpers.updateUserBlockedStatus(req.query.userId).then(() => {
      res.redirect("/admin/allUsers");
    });
  } catch (error) {
    console.log(error.message);
    res.render("error-404");
  }
};

const adminUnBlockUser = async (req, res) => {
  try {
    userHelpers.updateUserUnBlockedStatus(req.query.userId).then(() => {
      res.redirect("/admin/allUsers");
    });
  } catch (error) {
    console.log(error.message);
    res.render("error-404");
  }
};

const getAllUsers = async (req, res) => {
  try {
    userHelpers
      .getAllUsers()
      .then((users) => {
        if (users) {
          const itemsPerPage = 5;
          const currentPage = parseInt(req.query.page) || 1;
          const startIndex = (currentPage - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          const paginatedUsers = users.slice(startIndex, endIndex);

          const totalPages = Math.ceil(users.length / itemsPerPage);

          const pages = [];
          for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
          }

          res.render("./admin/adminUsers", {
            users: paginatedUsers,
            currentPage,
            totalPages,
            pages,
            admin: true,
            title: "Admin-Users",
          });
        } else {
          res.render("error-404", { title: "Failed to retrieve users" });
          console.log("Failed to retrieve users");
        }
      })
      .catch((error) => {
        console.log("Error retrieving users:", error);
      });
  } catch (error) {
    res.render("error-404");
    console.log(error.message);
  }
};

module.exports = {
  adminDashboard,
  getAdminLogin,
  verifyAdmin,
  logOut,
  adminBlockUser,
  adminUnBlockUser,
  getAllUsers,
};
