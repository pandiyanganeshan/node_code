const Vendor = require('../models').Vendor
const Product = require('../models').Product
const User = require('../models').User
const Order = require('../models').Order
const Ownership = require('../models').Ownership
const ObjectId = require('mongoose').Types.ObjectId
const validator = require('validator')
const mdistanceMultiplier = 0.001

/** Post Vendor  **/
const create = async function (req, res) {
    const reqVendor = req.body
    let err, vendor
    let user = req.user
    
    if (user.vendor) {
        
        user.populate('vendor', function (err, user) {
            
            if (err) {
                console.log(err)
                return ReE(res, err, 500)
            } else {
                return ReS(res, {
                    message: 'User is already a vendor Skipping create',
                    vendor: user.vendor,
                }, 200)
            }
            
        })
        return
    }
    
    if (typeof reqVendor.name === 'undefined' || reqVendor.name === '') {
        return ReE(res, {message: 'name was not entered'}, 400)
    }
    if (typeof reqVendor.address1 === 'undefined' || reqVendor.address1 ===
        '') {
        return ReE(res, {message: 'address1 was not entered'}, 400)
    }
    if (typeof reqVendor.city === 'undefined' || reqVendor.city === '') {
        return ReE(res, {message: 'city was not entered'}, 400)
    }
    if (typeof reqVendor.pincode === 'undefined' || reqVendor.pincode === '') {
        return ReE(res, {message: 'pincode was not entered'}, 400)
    }
    
    [err, vendor] = await to(Vendor.create(reqVendor))
    
    if (err) {
        console.log(err)
        return ReE(res, err, 500)
    } else {
        let vendor_ID = {vendor: vendor._id};
        [err, user] = await to(User.update({_id: user._id}, vendor_ID)) // update vendor Id in users collection
        if (err) {
            console.log(err)
            return ReE(res, err, 500)
        } else {
            return ReS(res, {
                message: 'Successfully created new vendor.',
                vendor: vendor.toWeb(),
            }, 200)
        }
    }
}

const get = async function (req, res) {
    res.setHeader('Content-Type', 'application/json')
    let err, vendor
    let user = req.user
    let vendorId = user.vendor
    
    if (!vendorId) {
        return ReE(res, {message: 'User is not vendor.'}, 400)
    }
    
    [err, vendor] = await to(Vendor.findOne({'_id': new ObjectId(vendorId)}).
        populate({path: 'deliveryboy', select: 'name phone status'}))
    
    if (err) {
        return ReE(res, err, 500)
    } else {
        if (vendor) {
            
            return ReS(res, {message: 'Vendor Details', vendor: vendor.toWeb()},
                200)
        }
        else {
            return ReE(res, {message: 'Invalid vendor.'}, 400)
        }
    }
}

const getOrders = async function (req, res) {
    let user = req.user
    
    if (typeof user.vendor === 'undefined' || user.vendor === '') {
        return ReE(res, {message: 'User is not vendor'}, 400)
    }
    
    let vendorId = user.vendor
    
    let limit = 10
    let current_page = 1
    let sort = 1
    
    if (req.query.sort) {
        sort = req.query.sort
    }
    
    if (req.query.status) {
        
        if ((req.query.status != 'placed') &&
            (req.query.status != 'cancelled') &&
            (req.query.status != 'returned') &&
            (req.query.status != 'delivered')
        ) {
            return ReE(res,
                {message: 'Invalid filterby name, it should be either one of placed ,cancelled ,delivered or returned'},
                400)
        }
        
    }
    
    if (req.query.filterby) {
        
        if (typeof req.query.filter === 'undefined' || req.query.filter ===
            '') {
            return ReE(res,
                {message: 'filter value was missing, If you use filerby'}, 400)
        }
        
        if ((req.query.filterby != 'tower') &&
            (req.query.filterby != 'address1') &&
            (req.query.filterby != 'address2') &&
            (req.query.filterby != 'userId')) {
            return ReE(res,
                {message: 'Invalid filterby name, it should tower,address1,address2 or userId'},
                400)
        }
    }
    
    if (req.query.floor) {
        
        if (typeof req.query.floor === 'undefined' || req.query.floor === '') {
            return ReE(res,
                {message: 'floor value was missing, If you use filerby'}, 400)
        }
    }
    
    if (req.query.door) {
        
        if (typeof req.query.door === 'undefined' || req.query.door === '') {
            return ReE(res,
                {message: 'door value was missing, If you use filerby'}, 400)
        }
    }
    
    if (req.query.page) {
        current_page = req.query.page
    }
    
    var aggregate = Order.aggregate()
    aggregate.match({vendor: new ObjectId(vendorId)}).lookup({
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user',
    }).project({
        status: 1,
        paymentStatus: 1,
        can_return_status: 1,
        can_return_count: 1,
        product: 1,
        vendor: 1,
        quantity: 1,
        orderdate: 1,
        deferMessage: 1,
        user: 1,
        
    }).unwind('$user')
    .sort({orderdate: -1})
    
    if (req.query.filterby) {
        
        var filter = req.query.filter
        
        if (req.query.filterby == 'tower') {
            filter = parseInt(req.query.filter)
            var value = filter
        } else {
            var value = new RegExp(filter)
        }
        
        if (req.query.filterby == 'tower') {
            aggregate.match({'user.tower': value})
        } else if (req.query.filterby == 'address1') {
            aggregate.match({'user.address1': {$regex: value, $options: 'i'}})
        } else if (req.query.filterby == 'address2') {
            aggregate.match({'user.address2': {$regex: value, $options: 'i'}})
        } else if (req.query.filterby == 'userId') {
            aggregate.match({'user._id': new ObjectId(filter)})
        }
        
    }
    
    if (req.query.floor) {
        
        filter = parseInt(req.query.floor)
        aggregate.match({'user.floor': filter})
    }
    
    if (req.query.door) {
        
        filter = parseInt(req.query.door)
        aggregate.match({'user.doorno': filter})
    }
    
    if (req.query.status) {
        aggregate.match({status: req.query.status})
    }
    
    var options = {
        page: current_page,
        limit: limit,
    }
    
    Order.aggregatePaginate(aggregate, options,
        function (err, results, pageCount, count) {
            if (err) {
                console.log(err)
                return ReE(res, err, 500)
            } else {
                Order.populate(results, [
                    {path: 'vendor', select: 'name phone'},
                    {path: 'product', select: 'name price size metric color'},
                ], function (err, data) {
                    if (err) {
                        return ReE(res, err, 500)
                    } else {
                        return ReS(res, {
                            docs: data,
                            total: count,
                            limit: limit,
                            page: current_page,
                            pages: pageCount,
                        }, 200)
                    }
                })
            }
        })
    
}

const getVendorList = async function (req, res) {
    
    let limit = 10
    let current_page = 1
    
    if (req.query.page) {
        current_page = req.query.page
    }
    
    [err, vendors] = await to(
        Vendor.paginate({}, {page: current_page, limit: limit}))
    
    return ReS(res, vendors, 200)
    
}

/** Post update Vendor  **/
const update = async function (req, res) {
    const reqVendor = req.body
    let err, vendor
    
    if (typeof reqVendor.vendor === 'undefined' || reqVendor.vendor === '') {
        return ReE(res, {message: 'vendor id was not entered'}, 400)
    }
    if (typeof reqVendor.name === 'undefined' || reqVendor.name === '') {
        return ReE(res, {message: 'name was not entered'}, 400)
    }
    if (typeof reqVendor.address1 === 'undefined' || reqVendor.address1 ===
        '') {
        return ReE(res, {message: 'address1 was not entered'}, 400)
    }
    if (typeof reqVendor.city === 'undefined' || reqVendor.city === '') {
        return ReE(res, {message: 'city was not entered'}, 400)
    }
    if (typeof reqVendor.pincode === 'undefined' || reqVendor.pincode === '') {
        return ReE(res, {message: 'pincode was not entered'}, 400)
    }
    
    [err, vendor] = await to(Vendor.update({_id: reqVendor.vendor}, reqVendor))
    
    if (err) {
        console.log(err)
        return ReE(res, err, 500)
    } else {
        return ReS(res, {message: 'Successfully update vendor.'}, 200)
    }
}

const getProducts = async function (req, res) {
    let user = req.user
    let vendorId = req.query.vendorId
    
    if (vendorId === undefined || validator.isEmpty(vendorId)) {
        
        if (typeof user.vendor === 'undefined' || user.vendor === '') {
            return ReE(res, {message: 'User is not vendor'}, 400)
        }
        
        vendorId = user.vendor
        
    }
    
    let limit = 10
    let current_page = 1
    
    if (req.query.page) {
        current_page = req.query.page
    }
    
    var options = {
        select: '',
        lean: true,
        page: current_page,
        limit: limit,
    };
    
    [err, products] = await to(Product.paginate({'vendor': vendorId}, options))
    
    if (err) {
        return ReE(res, err, 500)
    } else {
        return ReS(res, products, 200)
    }
    
}

const getProduct = async function (req, res) {
    
    let productid = req.params.productid
    let user = req.user
    let err, products
    let vendorId = user.vendor
    
    if (validator.isEmpty(productid)) {
        return ReE(res, {message: 'Please enter an vendor id to get report'},
            400)
    }
    
    if (typeof user.vendor === 'undefined' || user.vendor === '') {
        return ReE(res, {message: 'User is not vendor'}, 400)
    }
    
    [err, products] = await to(
        Product.findOne({'vendor': vendorId, '_id': productid}))
    
    if (err) {
        return ReE(res, err, 500)
    } else {
        return ReS(res, products, 200)
    }
    
}

/** Post Vendor Product  **/
const addProduct = async function (req, res) {
    const reqProduct = req.body
    let user = req.user
    let err, product
    
    if (typeof user === 'undefined' || user === '') {
        return ReE(res, {message: 'Wrong user'}, 400)
    }
    if (typeof user.vendor === 'undefined' || user.vendor === '') {
        return ReE(res, {message: 'User is not Vendor'}, 400)
    }
    reqProduct.vendor = user.vendor
    if (typeof reqProduct.name === 'undefined' || reqProduct.name === '') {
        return ReE(res, {message: 'Product name is missing'}, 400)
    }
    if (typeof reqProduct.price === 'undefined' || reqProduct.price === '') {
        return ReE(res, {message: 'Pricing is missing'}, 400)
    }
    
    if (typeof reqProduct.price === 'undefined' || reqProduct.initialCost ===
        '') {
        return ReE(res, {message: 'Initial cost is missing'}, 400)
    }
    
    [err, product] = await to(Product.create(reqProduct))
    
    if (err) {
        console.log(err)
        return ReE(res, err, 500)
    } else {
        
        [err, vendor] = await to(
            Vendor.update({_id: user.vendor}, {$push: {product: product._id}}))
        
        if (err) {
            console.log(err)
            return ReE(res, err, 500)
        } else {
            return ReS(res, {message: 'Product created.', productId: product.toWeb().id}, 200)
        }
    }
}

/** Post Vendor Product update  **/
const productUpdate = async function (req, res) {
    const reqProduct = req.body
    let err, product
    
    if (typeof reqProduct.product === 'undefined' || reqProduct.product ===
        '') {
        return ReE(res, {message: 'Product was not entered'}, 400)
    }
    if (typeof reqProduct.name === 'undefined' || reqProduct.name === '') {
        return ReE(res, {message: 'name was not entered'}, 400)
    }
    if (typeof reqProduct.price === 'undefined' || reqProduct.price === '') {
        return ReE(res, {message: 'price was not entered'}, 400)
    }
    
    [err, product] = await to(
        Vendor.update({'product._id': new ObjectId(reqProduct.product)},
            {'$set': {'product.$': reqProduct}}))
    
    if (err) {
        console.log(err)
        return ReE(res, err, 500)
    } else {
        return ReS(res, {message: 'Successfully update product.'}, 200)
    }
}

/** Post Vendor Product delete  **/
const productDelete = async function (req, res) {
    const product = req.params.id
    let user = req.user
    let err, vendor, productRemoved
    
    if (typeof user === 'undefined' || user === '') {
        return ReE(res, {message: 'Wrong user'}, 400)
    }
    if (typeof user.vendor === 'undefined' || user.vendor === '') {
        return ReE(res, {message: 'User is not Vendor'}, 400)
    }
    
    if (typeof product === 'undefined' || product ===
        '') {
        return ReE(res, {message: 'Please provide a product id.'}, 400)
    }
    [err, vendor] = await to(
        Vendor.update({'_id': new ObjectId(user.vendor)},
            {'$pull': {'product': new ObjectId(product)}}))
    
    if (err) {
        console.log(err)
        return ReE(res, err, 500)
    } else {
        
        [err, productRemoved] = await to(
            Product.find({'_id': new ObjectId(product)}).remove())
        
        if (err) {
            console.log(err)
            return ReE(res, err, 500)
        } else {
            
            return ReS(res, {message: 'Product Deleted'}, 200)
        }
    }
}

const getCustomer = async function (req, res) {
    
    let customerPhone = req.query.phone
    
    if (typeof req.user.vendor === 'undefined' || req.user.vendor === '') {
        return ReE(res, {message: 'User is not vendor'}, 400)
    }
    
    let vendorId = req.user.vendor
    
    var err, user, ownedProducts
    if (!customerPhone) {
        
        return ReE(res, {message: 'Please provide customer phone number'}, 400)
    }
    
    [err, user] = await to(
        User.findOne({'phone': new RegExp(customerPhone, 'i')}))
    
    console.log(err, user)
    if (err) {
        console.log(err)
        return ReE(res, err, 500)
    } else {
        
        if (user) {
            
            var responseUser = user.toWeb();
                
                [err, ownedProducts] = await user.ownership(vendorId)
    
    
            if (err) {
                console.log(err)
                return ReE(res, err, 500)
            }
            
                responseUser.products = ownedProducts
           
            
            return ReS(res, {message: 'User found', user: responseUser}, 200)
        } else {
            return ReE(res, 'User not found', 400)
        }
        
    }
}

const addCustomer = async function (req, res) {
    
    const requestBody = req.body
    let customerPhone = requestBody.phone
    let customerName = requestBody.name
    let err, user
    
    if (!customerPhone && !customerName) {
        
        return ReE(res, {message: 'Cannot create customer out of nothing'}, 400)
    }
    
    if (validator.isEmpty(customerName)) {
        return ReE(res, {message: 'Please enter a name for the customer'}, 400)
    }
    
    if (validator.isEmpty(customerPhone)) {
        return ReE(res, {message: 'Please enter customer phone number'}, 400)
    }
    
    [err, user] = await to(
        User.findOne({'phone': new RegExp(customerPhone, 'i')}))
    
    if (err) {
        console.log(err)
        return ReE(res, err, 500)
    } else {
        
        if (user) {
            return ReE(res, 'User already exists', 409)
        }
        
        [err, user] = await to(User.create(requestBody))
        
        if (err) {
            console.log(err)
            return ReE(res, err, 500)
        } else {
            return ReS(res, {message: 'User created', user: user}, 200)
        }
    }
}

/**  Vendor near by **/
const nearbyVendor = async function (req, res) {
    const reqVendor = req.body
    
    if (typeof reqVendor.location === 'undefined' || reqVendor.location ===
        '') {
        return ReE(res, {message: 'Location was not entered'}, 400)
    }
    
    if (typeof reqVendor.location[0] === 'undefined' ||
        reqVendor.location[0] === '') {
        return ReE(res, {message: 'Invalid Location'}, 400)
    }
    
    if (typeof reqVendor.location[1] === 'undefined' ||
        reqVendor.location[1] === '') {
        return ReE(res, {message: 'Invalid Location'}, 400)
    }
    
    Vendor.aggregate(
        [
            {
                '$geoNear': {
                    'near': {
                        'type': 'Point',
                        'coordinates': [
                            reqVendor.location[0],
                            reqVendor.location[1]],
                    },
                    'distanceField': 'distance',
                    'maxDistance': (10 / mdistanceMultiplier),
                    'distanceMultiplier': mdistanceMultiplier,
                    'spherical': true,
                },
            },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: 'vendor',
                    as: 'products',
                },
            },
            {
                $unwind: '$products',
            },
            {
                $project: {
                    _id: 1,
                    _coordinates: 1,
                    product: 1,
                    starting_price: {$min: '$products.price'},
                    deliveryboy: 1,
                    activestatus: 1,
                    address1: 1,
                    address2: 1,
                    city: 1,
                    name: 1,
                    pincode: 1,
                    createdAt: 1,
                    distance: {
                        $divide: [
                            {
                                $trunc: {
                                    $multiply: [
                                        '$distance',
                                        10],
                                },
                            }, 10],
                    },
                },
            }],
        function (err, vendor) {
            if (err) {
                console.log(err)
                return ReE(res, err, 500)
            } else {
                return ReS(res, {message: 'Vendor List', vendor: vendor}, 200)
            }
        },
    )
    
}

/** filters Vendor  **/
const filters = async function (req, res) {
    
    let user = req.user
    
    if (typeof user.vendor === 'undefined' || user.vendor === '') {
        return ReE(res, {message: 'User is not vendor'}, 400)
    }
    
    let vendorId = user.vendor
    
    Order.aggregate(
        [
            {
                $match: {vendor: new ObjectId(vendorId)},
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'users',
                },
            },
            {
                $unwind: '$users',
            },
            {
                $group: {
                    _id: null,
                    address1: {$addToSet: '$users.address1'},
                    address2: {$addToSet: '$users.address2'},
                    tower: {$addToSet: '$users.tower'},
                },
            },
        
        ],
        function (err, result) {
            if (err) {
                console.log(err)
                return ReE(res, err, 500)
            } else {
                
                var tower = []
                var address1 = []
                var address2 = []
                if (result.length != 0 && typeof result[0] !== 'undefined') {
                    tower = result[0].tower
                    address1 = result[0].address1
                    address2 = result[0].address2
                }
                
                var obj = [
                    {name: 'tower', value: tower},
                    {name: 'address1', value: address1},
                    {name: 'address2', value: address2},
                ]
                return ReS(res, {message: 'Vendor Filter', filter: obj}, 200)
            }
        },
    )
    
}

module.exports = {
    create: create,
    get: get,
    getOrders: getOrders,
    getVendorList: getVendorList,
    update: update,
    getProducts: getProducts,
    getProduct: getProduct,
    addProduct: addProduct,
    productUpdate: productUpdate,
    productDelete: productDelete,
    getCustomer: getCustomer,
    addCustomer: addCustomer,
    nearbyVendor: nearbyVendor,
    filters: filters,
}