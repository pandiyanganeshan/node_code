const express = require('express')
const router = express.Router()

const UserController = require('./../controllers/UserController')
const VendorController = require('./../controllers/VendorController')
const OrderController = require('./../controllers/OrderController')
const DeliveryboyController = require('./../controllers/DeliveryboyController')
const ReportsController = require('./../controllers/ReportsController')

const custom = require('./../middleware/custom')

const passport = require('passport')
const path = require('path')

require('./../middleware/passport')(passport)
/* GET home page. */
// router.get('/', function (req, res, next) {
//     res.json({
//         status: 'success',
//         message: 'Water Tap API',
//         data: {'version_number': 'v1.0.0'},
//     })
// })

router.post('/register', UserController.register)
router.post('/verifyOTP', UserController.verifyOTP)
// router.post('/resendOTP', UserController.resendOTP)


 //router.get('/user/:userId', UserController.get)
// router.put('/user', passport.authenticate('jwt', {session: false}),UserController.update)



 router.post('/vendor', passport.authenticate('jwt', {session: false}),
      VendorController.create)
// router.get('/vendor', passport.authenticate('jwt', {session:false}), VendorController.get);
// router.get('/vendor/list', passport.authenticate('jwt', {session: false}),
//     VendorController.getVendorList)
// router.get('/vendor/orders', passport.authenticate('jwt', {session: false}),
//     VendorController.getOrders)
// router.put('/vendor', passport.authenticate('jwt', {session: false}),
//     VendorController.update)
// router.get('/vendor/products', passport.authenticate('jwt', {session: false}),
//     VendorController.getProducts)
// router.get('/vendor/product/:productid', passport.authenticate('jwt', {session: false}),
//     VendorController.getProduct)
// router.post('/vendor/product', passport.authenticate('jwt', {session: false}),
//     VendorController.addProduct)
// router.put('/vendor/productUpdate',
//     passport.authenticate('jwt', {session: false}),
//     VendorController.productUpdate)
// router.delete('/vendor/product/:id',
//     passport.authenticate('jwt', {session: false}),
//     VendorController.productDelete)
// router.get('/vendor/customer', passport.authenticate('jwt', {session: false}),
//     VendorController.getCustomer)
// router.post('/vendor/customer', passport.authenticate('jwt', {session: false}),
//     VendorController.addCustomer)
// router.post('/vendors/nearby', passport.authenticate('jwt', {session: false}),
//     VendorController.nearbyVendor)
// router.get('/vendor/filters', passport.authenticate('jwt', {session: false}),
//     VendorController.filters)

// router.post('/order', passport.authenticate('jwt', {session: false}),
//     OrderController.create)
// router.get('/orders', passport.authenticate('jwt', {session: false}),
//     OrderController.getOrders)
// router.put('/order/recent', passport.authenticate('jwt', {session: false}),
//     OrderController.recentOrder)
// router.put('/order/:id', passport.authenticate('jwt', {session: false}),
//     OrderController.updateOrder)
// router.delete('/order/:Id', passport.authenticate('jwt', {session: false}),
//     OrderController.orderDelete)


// router.post('/deliveryboy', passport.authenticate('jwt', {session: false}),
//     DeliveryboyController.create)
// router.put('/deliveryboy/:id', passport.authenticate('jwt', {session: false}),
//     DeliveryboyController.update)
// router.delete('/deliveryboy/:id',
//     passport.authenticate('jwt', {session: false}),
//     DeliveryboyController.deleteDeliveryboy)
// router.post('/deliveryboy/resendCode', passport.authenticate('jwt', {session: false}),
//     DeliveryboyController.resendCode)
// router.post('/deliveryboy/verify', DeliveryboyController.verify)

// router.get('/reports/daily', passport.authenticate('jwt', {session:false}),
//     ReportsController.Reportdaily)
// router.get('/reports/daily/pending_return', passport.authenticate('jwt', {session:false}),
//     ReportsController.pending_return)
// router.get('/reports/weekly', passport.authenticate('jwt', {session:false}),
//     ReportsController.Reportweekly)
// router.get('/reports/monthly', passport.authenticate('jwt', {session:false}),
//     ReportsController.Reportmonthly)
// router.post('/reports/custom', passport.authenticate('jwt', {session:false}),
//     ReportsController.Reportcustom)


// router.get('/reports/weekly/unreturnedcans', passport.authenticate('jwt', {session:false}),
//     ReportsController.Reportweekly_unreturned)
// router.get('/reports/weekly/unpaid', passport.authenticate('jwt', {session:false}),
//     ReportsController.Reportweekly_unpaid)
// router.get('/reports/monthly/unreturnedcans', passport.authenticate('jwt', {session:false}),
//     ReportsController.Reportmonthly_unreturned)
// router.get('/reports/monthly/unpaid', passport.authenticate('jwt', {session:false}),
//     ReportsController.Reportmonthly_unpaid)
// router.get('/reports/filter/:phone', passport.authenticate('jwt', {session:false}),
//     ReportsController.Filterphone)


// router.get('/reports/pre_delivery/', passport.authenticate('jwt', {session:false}),
//     ReportsController.BeforeDelivery)
// router.get('/reports/post_delivery', passport.authenticate('jwt', {session:false}),
//     ReportsController.AfterDelivery)



// //********* API DOCUMENTATION **********
// router.use('/docs/api.json', express.static(
//     path.join(__dirname, '/../public/v1/documentation/api.json')))
// router.use('/docs',
//     express.static(path.join(__dirname, '/../public/v1/documentation/dist')))


module.exports = router
