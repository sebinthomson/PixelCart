const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const categoryController = require('../controllers/categoryController');
const orderController = require('../controllers/orderController');
const couponController = require('../controllers/couponController');
const productController = require('../controllers/productController');
const bannerController = require('../controllers/bannerController');
const auth = require ('../middleware/auth-admin');

router.get('/',adminController.getAdminLogin) 
router.post('/admin-login',adminController.verifyAdmin) 

router.get('/admin-dashboard',auth.isLogin,adminController.adminDashboard) 

router.get('/admin-categories',auth.isLogin,categoryController.adminCategories)

router.get('/add-category',auth.isLogin,categoryController.adminAddCategoryPage)
router.post('/add-category',auth.isLogin,categoryController.adminAddCategory)
router.get('/categoryvalidation',auth.isLogin,categoryController.categoryValidation)

router.get('/admineditcategory',auth.isLogin,categoryController.adminGetCategory)
router.post('/edit-category/:id',auth.isLogin,categoryController.adminEditCategory)
router.get('/admindeletecategory',auth.isLogin,categoryController.adminDeleteCategory)
router.get('/adminrecovercategory',auth.isLogin,categoryController.adminRecoverCategory)

router.get('/products',auth.isLogin,productController.getAdminProducts)

router.get('/add-product',auth.isLogin,productController.adminAddProductPage)
router.post('/add-product',auth.isLogin,productController.adminAddProduct)

router.get('/admineditproduct',auth.isLogin,productController.adminGetProduct)
router.post('/edit-product/:id',auth.isLogin,productController.adminEditProduct)
router.get('/admindeleteproduct',auth.isLogin,productController.adminDeleteProduct)
router.get('/adminrecoverproduct',auth.isLogin,productController.adminRecoverProduct)

router.get('/admin-banners',auth.isLogin,bannerController.adminBanners)

router.get('/add-banner',auth.isLogin,bannerController.adminAddBannerPage)
router.post('/add-banner',auth.isLogin,bannerController.adminAddBanner)

router.get('/admineditbanner',auth.isLogin,bannerController.adminGetBanner)
router.post('/edit-banner/:id',auth.isLogin,bannerController.adminEditBanner)
router.get('/admindeletebanner',auth.isLogin,bannerController.adminDeleteBanner)
router.get('/adminrecoverbanner',auth.isLogin,bannerController.adminRecoverBanner)

router.get('/admin-coupons',auth.isLogin,couponController.adminCoupons)
router.get('/add-coupon',auth.isLogin,couponController.adminAddCouponPage)
router.post('/add-coupon',auth.isLogin,couponController.adminAddCoupon)

router.get('/admineditcoupon',auth.isLogin,couponController.adminGetCoupon)
router.post('/edit-coupon/:id',auth.isLogin,couponController.adminEditCoupon)
router.get('/admindeletecoupon',auth.isLogin,couponController.adminDeleteCoupon)
router.get('/adminrecovercoupon',auth.isLogin,couponController.adminRecoverCoupon)

router.get('/admin-orders',auth.isLogin,orderController.adminOrders)
router.get('/getorderproducts',auth.isLogin,orderController.adminGetOrderProducts)

router.get('/admineditorder',auth.isLogin,orderController.adminGetOrder)
router.post('/edit-order/:id',auth.isLogin,orderController.adminEditOrder)

router.get('/allUsers',auth.isLogin,adminController.getAllUsers )

router.get('/adminblock_user',auth.isLogin,adminController.adminBlockUser)
router.get('/adminUn_block_user',auth.isLogin,adminController.adminUnBlockUser)

router.get('/todaySaleExcel',auth.isLogin,orderController.todaySaleExcel)
router.get('/todayRevenueExcel',auth.isLogin,orderController.totalRevenueExcel)
router.get('/allProductExcel',auth.isLogin,productController.productListExcel)
router.get('/allOrderStatusExcel',auth.isLogin,orderController.allOrderStatus)
router.get('/orderDetailPDF',auth.isLogin,orderController.orderDetailPDF)
router.get('/customDate',auth.isLogin,orderController.customPDF)

router.get('/logout',adminController.logOut)

module.exports = router;






