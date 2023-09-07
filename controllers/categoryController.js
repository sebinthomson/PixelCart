const categoryHelper = require("../helpers/category-helpers");
const productHelper = require("../helpers/product-helpers");

const adminAddCategoryPage = async (req, res) => {
  try {
    res.render("admin/adminCategories-add", { admin: true, title: "Admin Add Category" });
  } catch (error) {
    console.log(error.message);
    res.render('error-404')
  }
};

const adminAddCategory = async (req, res) => {
  try {
    categoryHelper.addCategory(req.body, async (id) => {
      res.redirect("/admin/admin-categories");
    });
  } catch (error) {
    console.log(error.message);
    res.render('error-404')
  }
};

const categoryValidation = async (req, res) => {
  try {
    const categoryName = req.query.name;
    const categories = await categoryHelper.getAllCategories();
    const exists = categories.some(
      (category) => category.categoryName.toLowerCase() === categoryName.toLowerCase()
    );
    res.json({ exists });
  } catch (error) {
    console.log(error);
    res.render('error-404')
  }
};

const adminCategories = async (req, res) => {
  try {
    const categories = await categoryHelper.getAllCategories();

    const itemsPerPage = 5;
    const currentPage = parseInt(req.query.page) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedCategories = categories.slice(startIndex, endIndex);

    const totalPages = Math.ceil(categories.length / itemsPerPage);

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }

    res.render("admin/adminCategories", {
      categories: paginatedCategories,
      currentPage,
      totalPages,
      pages,
      admin: true,
      title: "Admin-Categories"
    });
  } catch (err) {
    console.log(err);
    res.render('error-404')
  }
};

const adminGetCategory = async (req, res) => {
  try {
    try {
      const categoryId = req.query.categoryId;
      const category = await categoryHelper.getCategoryById({
        _id: categoryId,
      });
      if (!category) {
        return res.redirect("/admin/admin-categories");
      }
      res.render("admin/adminCategories-edit", {
        category: category,
        admin: true,
        title: "Admin Edit Category"
      });
    } catch (err) {
      console.log(err);
      res.redirect("/admin/admin-categories");
      l;
    }
  } catch (error) {
    console.log(error.message);
    res.render('error-404')
  }
};

const adminEditCategory = async (req, res) => {
  try {
    await categoryHelper.updateCategory(req.params.id, req.body).then(() => {
      res.redirect("/admin/admin-categories");
    });
  } catch (error) {
    console.log(error.message);
    res.render('error-404')
  }
};

const adminDeleteCategory = async (req, res) => {
  try {
    try {
      const categoryId = req.query.categoryId;
      const category = await categoryHelper.getCategoryById({
        _id: categoryId,
      });
      const categoryName = await categoryHelper.getCategoryName(categoryId);
      if (!category) {
        return res.redirect("/admin");
      }
      await categoryHelper.softDeleteCategory(categoryId);
      await productHelper.softDeleteBlockedCategoryProducts(categoryName);
      res.redirect("/admin/admin-categories");
    } catch (err) {
      console.log(err);
      res.redirect("/admin/admin-categories");
    }
  } catch (error) {
    console.log(error.message);
    res.render('error-404')
  }
};

const adminRecoverCategory = async (req, res) => {
  try {
    try {
      const categoryId = req.query.categoryId;
      const category = await categoryHelper.getCategoryById({
        _id: categoryId,
      });
      const categoryName = await categoryHelper.getCategoryName(categoryId);
      if (!category) {
        return res.redirect("/admin");
      }
      await categoryHelper.softRecoverCategory(categoryId);
      await productHelper.softRecoverBlockedCategoryProducts(categoryName);
      res.redirect("/admin/admin-categories");
    } catch (err) {
      console.log(err);
      res.redirect("/admin/admin-categories");
    }
  } catch (error) {
    console.log(error.message);
    res.render('error-404')
  }
};

module.exports = {
  adminAddCategoryPage,
  adminAddCategory,
  adminCategories,
  adminGetCategory,
  adminEditCategory,
  adminDeleteCategory,
  adminRecoverCategory,
  categoryValidation
};
