const Order = require('../models').Order
const User = require('../models').User
const Deliveryboy = require('../models').Deliveryboy
const Product = require('../models').Product
const Ownership = require('../models').Ownership

const ObjectId = require('mongoose').Types.ObjectId
const validator = require('validator')
const moment = require('moment')

const create = async function (req, res) {
    const reqOrder = req.body
    let err, order, product, products
    let schedule_date = new Date()
    var format = 'h:mm a'
    var currenttime = moment(schedule_date, format),
        beforeTime = moment('16:00 pm', format),
        afterTime = moment('23:59 pm', format)
    if (currenttime.isBetween(beforeTime, afterTime)) {
        schedule_date = moment(schedule_date).add(1, 'days').format()
    }
    
    let user = req.user
    
    if (reqOrder.user) {
        
        [err, user] = await to(
            User.findOne({'_id': new ObjectId(reqOrder.user)}))
        
        if (err) {
            console.log(err)
            return ReE(res, err, 500)
        } else {
            
            if (user) {
                
                if (user.address1 === undefined ||
                    validator.isEmpty(user.address1) ||
                    user.address2 === undefined ||
                    validator.isEmpty(user.address2)) {
                    return ReE(res,
                        {message: 'User address not present. Please update profile and then place order'},
                        400)
                }
                
            } else {
                return ReE(res, {message: 'User not found'}, 400)
                
            }
            
        }
        
    }
    
    [err, product] = await to(
        Product.findOne({'_id': new ObjectId(reqOrder.product)}))
    
    if (err) {
        console.log(err)
        return ReE(res, err, 500)
        
    } else {
        
        if (product) {
            
            if (typeof reqOrder.vendor === 'undefined' || reqOrder.vendor ===
                '') {
                return ReE(res, {message: 'vendor ID was not entered'}, 400)
            }
            if (typeof reqOrder.product === 'undefined' || reqOrder.product ===
                '') {
                return ReE(res, {message: 'product ID was not entered'}, 400)
            }
            if (typeof reqOrder.quantity === 'undefined' ||
                reqOrder.quantity === '') {
                return ReE(res, {message: 'quantity was not entered'}, 400)
            }
    
            var total = product.price * reqOrder.quantity;
            
            var productId = product._id.toString();
            
            [err, products] = await user.ownership(reqOrder.vendor)
    
            if (err) {
                console.log(err)
                return ReE(res, err, 500)
        
            }
            var owned = products.filter(function(ownedProduct) {
                return ownedProduct.product._id == productId
            })[0];
            
            if (owned) {
    
                if (reqOrder.quantity > owned.quantity) {
    
                    console.log("Updating Ownership.")
                    total = total + ((reqOrder.quantity - owned.quantity) *
                        product.initialCost)
                }
    
            }else {
                
                console.log("Ownership doesnt exist, creating.")
                var ownership;
                var newOwnership;
                var newProducts = [];
                
                
                [err,ownership] = await to(Ownership.findOne({
                    user: user,
                    vendor: reqOrder.vendor
                }))
                
                
                if (err) {
                    console.log(err)
                    return ReE(res, err, 500)
                }
                
                if (ownership){
                
                    console.log("Another Product ownership exists")
                    
                    ownership.products.push({
                        product:  product,
                        quantity: reqOrder.quantity
                    })
                    
                    ownership.save()
                    
                
                }else {
    
                    console.log("No other product ownership exist, creating")
    
                    newProducts.push({
                        product:  product,
                        quantity: reqOrder.quantity
                    });
    
                    [err, newOwnership] = await to(Ownership.create({
                        user:user,
                        vendor:reqOrder.vendor,
                        products: newProducts
                    }))
    
                    if (err) {
                        console.log(err)
                        return ReE(res, err, 500)
                    }
                }
                
            }
            
            
            reqOrder.total = total
            reqOrder.schedule_deliveryDate = schedule_date;
            
            [err, order] = await to(Order.create(reqOrder))
            
            if (err) {
                console.log(err)
                return ReE(res, err, 500)
            } else {
                return ReS(res,
                    {message: 'Order created.', order: order.toWeb()}, 200)
            }
            
        } else {
            
            return ReE(res, {message: 'Invalid Product'}, 400)
        }
    }
    
}


/** Get All Order list with pagination  **/
const getOrders = async function (req, res) {
    let user = req.user
    let limit = 10
    let current_page = 1
    var err, orders
    
    if (req.query.page) {
        current_page = req.query.page
    }
    var filters = {
        user: user.id,
    }
    
    if (req.query.status) {
        
        if ((req.query.status != 'placed') &&
            (req.query.status != 'cancelled') &&
            (req.query.status != 'returned') &&
            (req.query.status != 'delivered')
        ) {
            return ReE(res,
                {message: 'Invalid filterby name, it should placed ,cancelled ,delivered or returned'},
                400)
        }
        
        filters['status'] = req.query.status
    }
    
    var options = {
        populate: [
            {path: 'user vendor', select: 'name phone address1 address2', populate: {path: 'user', select: 'phone'}},
            {path: 'product', select: 'name price size metric color'},
            ],
        lean: true,
        page: current_page,
        limit: limit,
        sort: { orderdate: -1 }
    };
    
    [err, orders] = await to(Order.paginate(filters, options))
    
    if (err) {
        return ReE(res, err, 500)
    } else {
        return ReS(res, orders, 200)
    }
    
}


/** order status update  **/
const updateOrder = async function (req, res) {
    const reqOrder = req.body
    const orderId = req.params.id
    let err, order, deliveryboy, status
    
    if (validator.isEmpty(orderId)) {
        return ReE(res, {message: 'Please enter an order id to update'}, 400)
    }
    
    if (!ObjectId.isValid(orderId)) {
        
        return ReE(res, 'Please provide a valid order Id.', 400)
        
    }
    
    if (reqOrder.status) {
        if ((reqOrder.status != 'cancelled') &&
            (reqOrder.status != 'delivered') &&
            (reqOrder.status != 'returned')) {
            return ReE(res, {message: 'Invalid Order status'}, 400)
        }
    }
    
    if (reqOrder.paymentStatus) {
        if ((reqOrder.paymentStatus != 'paid') &&
            (reqOrder.paymentStatus != 'unpaid')) {
            return ReE(res, {message: 'Invalid Payment status'}, 400)
        }
    }
    
    if (reqOrder.deliveredBy) {
        
        [err, deliveryboy] = await to(
            Deliveryboy.findById(reqOrder.deliveredBy))
        if (err) {
            console.log(err)
            return ReE(res, err, 500)
        } else {
            if (!deliveryboy) {
                return ReE(res, {message: 'Delivery boy not found'}, 400)
            } else {
                reqOrder.deliveredDate = Date.now()
            }
        }
        
    }
    
    [err, order] = await to(
        Order.findOne({'_id': new ObjectId(orderId)}).populate('user'))
    
    if (err) {
        console.log(err)
        return ReE(res, err, 400)
    }
    
    if (order) {
    
        if (reqOrder.paymentStatus === 'paid') {
        
            var products,ownership;
            var productId = order.product.toString();
        
            [err, products] = await order.user.ownership(order.vendor)
            
            if (err) {
                console.log(err)
                return ReE(res, err, 500)
         
            }
    
            var owned = products.filter(function(ownedProduct) {
                return ownedProduct.product._id == productId
            })[0];
    
            if (owned) {
    
                if (order.quantity > owned.quantity) {
        
                    console.log("Updating quantity");
        
                    var difference = order.quantity - owned.quantity;
        
                    [err, ownership] = await to(Ownership.update(
                        {
                            user: order.user,
                            vendor: order.vendor,
                            'products.product': productId,
                        },
                        {
                            '$set': {
                                'products.$.quantity': owned.quantity +
                                    difference,
                            }
                        },
                        {runValidators: true}))
        
                    if (err) {
                        console.log(err)
                        return ReE(res, err, 500)
            
                    }
        
                }
    
            } else {
                return ReE(res, "Product not owned by customer, cannot update", 500)
                
            }
        }
        
        if (reqOrder.can_return_status) {
            
            if (reqOrder.can_return_status === 'returned') {
                
                if (reqOrder.can_return_count && reqOrder.can_return_count ===
                    order.quantity) {
                    
                    console.log(true)
                    
                    status = 'ok'
                    //Ok
                } else {
                    
                    if (reqOrder.can_return_count >= order.quantity) {
                        
                        return ReE(res, 'Invalid return quantity', 400)
                    }
                    
                    console.log(false)
                    
                    if (reqOrder.can_return_count === 0) {
                        
                        reqOrder.can_return_status = 'partially_returned'
                        
                        status = 'No cans returned'
                    } else {
                        
                        reqOrder.can_return_status = 'partially_returned'
                        
                        status = 'cans only partially returned.'
                    }
                    
                }
                
            }
            
        }
        
        [err, order] = await to(
            Order.update({'_id': new ObjectId(orderId)}, reqOrder,
                {runValidators: true}))
        
        if (err) {
            console.log(err)
            return ReE(res, err, 500)
        } else {
            return ReS(res, {message: 'Order Updated.', status: status}, 200)
        }
    } else {
        
        return ReE(res, 'Order does not exist', 400)
    }
}


/** Post order delete  **/
const orderDelete = async function (req, res) {
    let orderId = req.params.Id
    let err, order
    
    if (typeof orderId === 'undefined' || orderId === '') {
        return ReE(res, {message: 'order was not entered'}, 400)
    }
    
    [err, order] = await to(Order.find({'_id': new ObjectId(orderId)}).remove())
    
    if (err) {
        console.log(err)
        return ReE(res, err, 500)
    } else {
        return ReS(res, {message: 'Successfully Deleted order'}, 200)
    }
}


/** get recent order **/
const recentOrder = async function (req, res) {
    let err, order, orderM, newOrder
    let user = req.user;
    
    [err, orderM] = await to(
        Order.findOne({'user': new ObjectId(user._id)}, '-_id').
            sort({orderdate: -1}))
    
    if (err) {
        console.log(err)
        return ReE(res, err, 500)
    } else {
        
        if (orderM) {
            
            order = orderM.toObject()
            order.orderdate = new Date()
            order.status = 'placed'
            order.paymentStatus = 'unpaid'
            order.can_return_status = 'unreturned'
            order.can_return_count = 0;
            
            [err, newOrder] = await to(Order.create(order))
            
            if (err) {
                console.log('Cant create', err)
                return ReE(res, err, 500)
            } else {
                return ReS(res,
                    {message: 'Order created.', order: newOrder.toWeb()}, 200)
            }
        } else {
            return ReE(res, {message: 'No order for this user'}, 400)
        }
    }
    
}



module.exports =
{
    create : create,
    getOrders : getOrders,
    updateOrder : updateOrder,
    orderDelete : orderDelete,
    recentOrder : recentOrder,
}
