const bannerHelper = require("../helpers/banner-helpers");

const adminBanners = async (req, res) => {
  try {
    const banners = await bannerHelper.adminGetAllBanners();
    const itemsPerPage = 3;
    const currentPage = parseInt(req.query.page) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedBanners = banners.slice(startIndex, endIndex);
    const totalPages = Math.ceil(banners.length / itemsPerPage);
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    res.render("admin/adminBanners", {
      banners: paginatedBanners,
      currentPage,
      totalPages,
      pages,
      admin: true,
      title: "Admin-Banners",
    });
  } catch (err) {
    console.log(err);
    res.render("error-404");
  }
};

const adminAddBannerPage = async (req, res) => {
  try {
    res.render("admin/adminBanners-add", {
      admin: true,
      title: "Admin Add Banner",
    });
  } catch (error) {
    console.log(error.message);
    res.render("error-404");
  }
};

const adminAddBanner = async (req, res) => {
  try {
    let banner = await bannerHelper.addBanner(req.body);
    if (req.files && req.files["bannerImage"]) {
      const images = req.files["bannerImage"];
      const movePromises = [];
        const movePromise = new Promise((resolve, reject) => {
          images.mv(
            "./public/banner-images/" + banner.id 
            + ".jpg",
            (err) => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            }
          );
        });
        movePromises.push(movePromise);
      Promise.all(movePromises)
        .then(() => {
          res.redirect("/admin/admin-banners");
        })
        .catch((error) => {
          console.log("Failed to move images:", error);
          res.status(500).send("Failed to add banner");
        });
    }
  } catch (error) {
    console.log(error.message);
    res.render("error-404");
  }
};

const adminGetBanner = async (req, res) => {
  try {
    try {
      const bannerId = req.query.bannerId;
      const banner = await bannerHelper.getBannerById({ _id: bannerId });
      if (!banner) {
        return res.redirect("/admin/admin-banners");
      }
      res.render("admin/adminBanners-edit", {
        banner,
        admin: true,
        title: "Admin Edit Banner",
      });
    } catch (err) {
      console.log(err);
      res.redirect("/admin/admin-banners");
    }
  } catch (error) {
    console.log(error.message);
    res.render("error-404");
  }
};

const adminEditBanner = async (req, res) => {
  try {
    bannerHelper.updateBanner(req.params.id, req.body).then(() => {
      res.redirect("/admin/admin-banners");
      if (req.files && req.files["bannerImage"]) {
        const image = req.files["bannerImage"];
        const movePromise = new Promise((resolve, reject) => {
          image.mv(
            "./public/banner-images/" + req.params.id + ".jpg",
            (err) => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            }
          );
        });
        movePromise.catch((error) => {
          console.log("Failed to move images:", error);
          res.status(500).send("Failed to add banner");
        });
      }
    });
  } catch (error) {
    console.log(error.message);
    res.render("error-404");
  }
};

const adminDeleteBanner = async (req, res) => {
  try {
    try {
      const bannerId = req.query.bannerId;
      const banner = await bannerHelper.getBannerById({ _id: bannerId });
      if (!banner) {
        return res.redirect("/admin/admin-banners");
      }
      await bannerHelper.softDeleteBanner({_id: bannerId});
      res.redirect("/admin/admin-banners");
    } catch (err) {
      console.log(err);
      res.render("error-404");
    }
  } catch (error) {
    console.log(error.message);
    res.render("error-404");
  }
};

const adminRecoverBanner = async (req, res) => {
  try {
    try {
      const bannerId = req.query.bannerId;
      const banner = await bannerHelper.getBannerById({ _id: bannerId });
      if (!banner) {
        return res.redirect("/admin/admin-banners");
      }
      await bannerHelper.softRecoverBanner(bannerId);
      res.redirect("/admin/admin-banners");
    } catch (err) {
      console.log(err);
      res.render("error-404");
    }
  } catch (error) {
    console.log(error.message);
    res.render("error-404");
  }
};

module.exports = {
  adminBanners,
  adminAddBannerPage,
  adminAddBanner,
  adminGetBanner,
  adminEditBanner,
  adminDeleteBanner,
  adminRecoverBanner
}