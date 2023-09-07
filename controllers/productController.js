const productHelpers = require("../helpers/product-helpers");
const categoryHelpers = require("../helpers/category-helpers");
const exceljs = require("exceljs");

module.exports = {
  productListExcel: async (req, res) => {
    try {
      const products = await productHelpers.getAllProducts();
      const workbook = new exceljs.Workbook();
      const worksheet = workbook.addWorksheet("products");
      worksheet.columns = [
        { header: "S no", key: "s_no" },
        { header: "Id", key: "_id" },
        { header: "Name", key: "name" },
        { header: "Category", key: "category" },
        { header: "Description", key: "description" },
        { header: "Price", key: "price" },
      ];
      let counter = 1;
      products.forEach((element) => {
        element.s_no = counter;
        worksheet.addRow(element);
        counter++;
      });
      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
      });
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment;filename=productList.xlsx"
      );
      return workbook.xlsx.write(res).then(() => {
        res.status(200);
      });
    } catch (error) {
      console.log(error.message);
    }
  },

  getAdminProducts: async (req, res) => {
    try {
      const products = await productHelpers.getAllProductsEvenDeleted();

      const itemsPerPage = 5;
      const currentPage = parseInt(req.query.page) || 1;
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedProducts = products.slice(startIndex, endIndex);
      const totalPages = Math.ceil(products.length / itemsPerPage);
      const pages = [];
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }

      res.render("./admin/adminProducts", {
        products: paginatedProducts,
        currentPage,
        totalPages,
        pages,
        admin: true,
        title: "Admin-Products",
      });
    } catch (error) {
      console.log(error.message);
      res.render("error-404");
    }
  },

  adminAddProductPage: async (req, res) => {
    try {
      const categories = await categoryHelpers.getAllCategories();
      res.render("admin/adminProducts-add", {
        categories,
        admin: true,
        title: "Admin Add Product",
      });
    } catch (error) {
      console.log(error.message);
      res.render("error-404");
    }
  },

  adminAddProduct: async (req, res) => {
    try {
      let product = await productHelpers.addProduct(req.body);
      if (req.files && req.files["images[]"]) {
        const images = req.files["images[]"];
        const movePromises = [];

        for (let i = 0; i < images.length; i++) {
          const image = images[i];
          const movePromise = new Promise((resolve, reject) => {
            image.mv(
              "./public/product-images/" + product.id + i + ".jpg",
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
        }
        Promise.all(movePromises)
          .then(() => {
            res.redirect("/admin/products");
          })
          .catch((error) => {
            console.log("Failed to move images:", error);
            res.status(500).send("Failed to add product");
          });
      }
    } catch (error) {
      console.log(error.message);
      res.render("error-404");
    }
  },

  adminGetProduct: async (req, res) => {
    try {
      try {
        const productId = req.query.productId;
        const product = await productHelpers.getProductById({ _id: productId });
        const categories = await categoryHelpers.getAllCategories();
        if (!product) {
          return res.redirect("/admin");
        }
        res.render("admin/adminProducts-edit", {
          product: product,
          admin: true,
          categories,
          title: "Admin Edit Product",
        });
      } catch (err) {
        console.log(err);
        res.redirect("/admin");
      }
    } catch (error) {
      console.log(error.message);
      res.render("error-404");
    }
  },

  adminDeleteProduct: async (req, res) => {
    try {
      try {
        const productId = req.query.productId;
        const product = await productHelpers.getProductById({ _id: productId });
        if (!product) {
          return res.redirect("/admin/products");
        }
        await productHelpers.softDeleteProduct(productId);
        res.redirect("/admin/products");
      } catch (err) {
        console.log(err);
        res.render("error-404");
      }
    } catch (error) {
      console.log(error.message);
      res.render("error-404");
    }
  },

  adminRecoverProduct: async (req, res) => {
    try {
      try {
        const productId = req.query.productId;
        const product = await productHelpers.getProductById({ _id: productId });
        if (!product) {
          return res.redirect("/admin/products");
        }
        await productHelpers.softRecoverProduct(productId);
        res.redirect("/admin/products");
      } catch (err) {
        console.log(err);
        res.render("error-404");
      }
    } catch (error) {
      console.log(error.message);
      res.render("error-404");
    }
  },

  adminEditProduct: async (req, res) => {
    try {
      productHelpers.updateProduct(req.params.id, req.body).then(() => {
        res.redirect("/admin/products");
        if (req.files && req.files["images[]"]) {
          const image = req.files["images[]"];
          const movePromise = new Promise((resolve, reject) => {
            image.mv(
              "./public/product-images/" + req.params.id + ".jpg",
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
            res.status(500).send("Failed to add product");
          });
        }
      });
    } catch (error) {
      console.log(error.message);
      res.render("error-404");
    }
  },
};
