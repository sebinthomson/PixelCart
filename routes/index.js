const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const orderController = require('../controllers/orderController');
const couponController = require('../controllers/couponController')
const cartController = require('../controllers/cartController');
const auth=require ('../middleware/auth');

router.get('/',userController.landingPage)

router.post('/verify',userController.verify)
router.post('/verifys',userController.verifys)

router.post('/signup',userController.signup)

router.get('/login',userController.login)
router.post('/login',userController.getuserlogin)

router.get('/forgotpassword',userController.forgotPassword)
router.post('/forgotpasswordverify',userController.forgotPasswordverify)
router.post('/forgotPasswordverifys',userController.forgotPasswordverifys)
router.post('/changepassword',userController.changedPassword)

router.get('/home',auth.isBlocked,auth.isLogin,userController.home)
router.post('/filterProduct',auth.isBlocked,auth.isLogin,userController.filterProducts)

router.get('/cart',cartController.viewCart)
router.get('/addToCart',cartController.addToCart)
router.post('/changeProductQuantity',cartController.changeQuantity)

router.get('/profile',auth.isBlocked,auth.isLogin,userController.profile)
router.get('/profile-orders',auth.isBlocked,auth.isLogin,orderController.getOrders)
router.get('/invoice',auth.isBlocked,auth.isLogin,orderController.getOrderInvoice)
router.post('/edit-address',auth.isBlocked,auth.isLogin,userController.editAddress)
router.post('/edit-user',auth.isBlocked,auth.isLogin,userController.editUser)

router.get('/productdetails',auth.isBlocked,auth.isLogin,userController.getProductDetails)

router.get('/getCoupons',auth.isBlocked,auth.isLogin,couponController.userGetCoupons)
router.post('/applyCoupon',auth.isBlocked,auth.isLogin,couponController.userApplyCoupon)

router.get('/proceedToCheckout',auth.isBlocked,auth.isLogin,userController.proceedToCheckout)

router.post('/add-address',auth.isBlocked,auth.isLogin,userController.addAddress)
router.get('/deleteaddress',auth.isBlocked,auth.isLogin,userController.deleteAddress)

router.post('/addToOrders',auth.isBlocked,auth.isLogin,orderController.addOrder)
router.post('/verifyPayment',auth.isBlocked,auth.isLogin,orderController.verifyPayment)
router.get('/orderPlaced',auth.isBlocked,auth.isLogin,orderController.orderPlaced)
router.get('/requestcancellation',auth.isBlocked,auth.isLogin,orderController.requestCancellation)
router.get('/requestReturn',auth.isBlocked,auth.isLogin,orderController.requestReturn)
router.get('/requestProductCancellation',auth.isBlocked,auth.isLogin,orderController.requestProductCancellation)
router.get('/requestProductReturn',auth.isBlocked,auth.isLogin,orderController.requestProductReturn)

router.get('/logout',userController.logout)
router.get('/test',(req,res)=>{
    res.render('user/verify_otp',{newUser: true})
})


module.exports = router;
