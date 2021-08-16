const Vendor = require('../models').Vendor
const Product = require('../models').Product
const User = require('../models').User
const Order = require('../models').Order
const ObjectId = require('mongoose').Types.ObjectId
const validator = require('validator')
const moment = require('moment')

/** Order Report daily  **/
const Reportdaily = async function (req, res) {
    let user = req.user

    if (typeof user.vendor === 'undefined' || user.vendor === '') {
        return ReE(res, {message: 'User is not vendor'}, 400)
    }

    let vendorId = user.vendor
    const start = new Date();
    start.setUTCHours(0,0,0,0);
    const end = new Date();
    end.setUTCHours(23,59,59,0);
    
    Order.aggregate(
    [
      {
        $match: { orderdate: { $gte: start, $lte: end}, vendor: new ObjectId(vendorId) }
      },  
      { $group: { 
          _id: null, 
          total_cans_unreturned: { $sum: '$quantity' },
          total_cans_returned: { $sum: '$can_return_count' },
          placed_order: { $sum : { $cond : [ { $eq: [ '$status', 'placed' ] }, 1 , 0  ]  } } ,
          cancelled_order: { $sum : { $cond : [ { $eq: [ '$status', 'cancelled' ] }, 1 , 0  ]  } } ,
          delivered_orders: { $sum : { $cond : [ { $eq: [ '$status', 'delivered' ] }, 1 , 0  ]  } },
          total_paid_orders: { $sum : { $cond : [ { $eq: [ '$paymentStatus', 'paid' ] }, 1 , 0  ]  } } ,
          total_outstanding_payments: { $sum : { $cond : [ { $eq: [ '$paymentStatus', 'unpaid' ] }, '$total' , 0  ]  } } ,
          total_amount_paid: { $sum : { $cond : [ { $eq: [ '$paymentStatus', 'paid' ] }, '$total' , 0  ]  } } ,
        }
      }, {$project:{
      		_id:1,
      		placed_order:1,
      		cancelled_order:1,
      		delivered_orders:1,
      		total_cans_unreturned : {'$subtract' : [ '$total_cans_unreturned', '$total_cans_returned' ]},
      		total_paid_orders: 1,
      		total_outstanding_payments: 1,
      		total_amount_paid: 1,
      		
        }
      }],
      function(err, result) {
        if(err){
          console.log(err);
          return ReE(res, err, 500)
        }else{
        	let response;
        	if(result.length == 0){
        		let count = [];
        		let obj = {};
        		obj.placed_order = 0;
        		obj.cancelled_order = 0;
        		obj.delivered_orders = 0;
        		obj.total_cans_unreturned = 0;
        		obj.total_paid_orders = 0;
        		obj.total_outstanding_payments = 0;
        		obj.total_amount_paid = 0;
        		count.push(obj);
        		response = count;
        	}else{
        		response = result;
        	}
          return ReS(res, { message: 'Todays Order Report', count: response }, 200)
        }
      }
  );

}
module.exports.Reportdaily = Reportdaily

/** pending return daily  **/
const pending_return = async function (req, res) {
    let err, order;
    let user = req.user

    if (typeof user.vendor === 'undefined' || user.vendor === '') {
        return ReE(res, {message: 'User is not vendor'}, 400)
    }

    let vendorId = user.vendor
    const start = new Date();
    start.setUTCHours(0,0,0,0);
    const end = new Date();
    end.setUTCHours(23,59,59,0);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    [err, order] = await to(Order.find({
                                      $and: [
                                          { 'orderdate': { $gte: start, $lte: end }, 'vendor': new ObjectId(vendorId)   },
                                          { $or: [{ 'can_return_status': 'partially_returned' },
                                                  { 'can_return_status': 'unreturned' }
                                            ] }
                                      ]
                                  }))


    if (err) {
        console.log(err)
        return ReE(res, err, 500)
    } else {
        return ReS(res, { message: 'Todays Pending Returns', order: order }, 200)
    }
   

}
module.exports.pending_return = pending_return


/** Order Report weekly  **/
const Reportweekly = async function (req, res) {
    let user = req.user

    if (typeof user.vendor === 'undefined' || user.vendor === '') {
        return ReE(res, {message: 'User is not vendor'}, 400)
    }

    let vendorId = user.vendor

    var curr = new Date; // get current date
    var myToday = new Date(curr.getFullYear(), curr.getMonth(), curr.getDate(), 0, 0, 0);
    var first = myToday.getDate() - myToday.getDay(); 
    var Startofweek = new Date(myToday.setDate(first));
    
    Order.aggregate(
    [
      {
        $match: { orderdate: {  $gte: Startofweek , $lte: new Date() } , vendor: new ObjectId(vendorId) }
      },  
      { $group: { 
          _id: null, 
          total_cans_unreturned: { $sum: '$quantity' },
          total_cans_returned: { $sum: '$can_return_count' },
          placed_order: { $sum : { $cond : [ { $eq: [ '$status', 'placed' ] }, 1 , 0  ]  } } ,
          cancelled_order: { $sum : { $cond : [ { $eq: [ '$status', 'cancelled' ] }, 1 , 0  ]  } } ,
          delivered_orders: { $sum : { $cond : [ { $eq: [ '$status', 'delivered' ] }, 1 , 0  ]  } },
          total_paid_orders: { $sum : { $cond : [ { $eq: [ '$paymentStatus', 'paid' ] }, 1 , 0  ]  } } ,
          total_outstanding_payments: { $sum : { $cond : [ { $eq: [ '$paymentStatus', 'unpaid' ] }, '$total' , 0  ]  } } ,
          total_amount_paid: { $sum : { $cond : [ { $eq: [ '$paymentStatus', 'paid' ] }, '$total' , 0  ]  } } ,
        }
      }, {$project:{
      		_id:1,
      		placed_order:1,
      		cancelled_order:1,
      		delivered_orders:1,
      		total_cans_unreturned : {'$subtract' : [ '$total_cans_unreturned', '$total_cans_returned' ]},
      		total_paid_orders: 1,
      		total_outstanding_payments: 1,
      		total_amount_paid: 1,
      		
        }
      }],
      function(err, result) {
        if(err){
          console.log(err);
          return ReE(res, err, 500)
        }else{
        	let response;
        	if(result.length == 0){
        		let count = [];
        		let obj = {};
        		obj.placed_order = 0;
        		obj.cancelled_order = 0;
        		obj.delivered_orders = 0;
        		obj.total_cans_unreturned = 0;
        		obj.total_paid_orders = 0;
        		obj.total_outstanding_payments = 0;
        		obj.total_amount_paid = 0;
        		count.push(obj);
        		response = count;
        	}else{
        		response = result;
        	}
          return ReS(res, { message: 'Weekly Order Report', count: response }, 200)
        }
      }
  );
    

}
module.exports.Reportweekly = Reportweekly

/** Order Report monthly  **/
const Reportmonthly = async function (req, res) {
    let user = req.user

    if (typeof user.vendor === 'undefined' || user.vendor === '') {
        return ReE(res, {message: 'User is not vendor'}, 400)
    }

    let vendorId = user.vendor
    var date = new Date();
    var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);

    Order.aggregate(
    [
      {
        $match: { orderdate: {  $gte: firstDay , $lte: new Date() } , vendor: new ObjectId(vendorId) }
      },  
      { $group: { 
          _id: null, 
          total_cans_unreturned: { $sum: '$quantity' },
          total_cans_returned: { $sum: '$can_return_count' },
          placed_order: { $sum : { $cond : [ { $eq: [ '$status', 'placed' ] }, 1 , 0  ]  } } ,
          cancelled_order: { $sum : { $cond : [ { $eq: [ '$status', 'cancelled' ] }, 1 , 0  ]  } } ,
          delivered_orders: { $sum : { $cond : [ { $eq: [ '$status', 'delivered' ] }, 1 , 0  ]  } },
          total_paid_orders: { $sum : { $cond : [ { $eq: [ '$paymentStatus', 'paid' ] }, 1 , 0  ]  } } ,
          total_outstanding_payments: { $sum : { $cond : [ { $eq: [ '$paymentStatus', 'unpaid' ] }, '$total' , 0  ]  } } ,
          total_amount_paid: { $sum : { $cond : [ { $eq: [ '$paymentStatus', 'paid' ] }, '$total' , 0  ]  } } ,
        }
      }, {$project:{
      		_id:1,
      		placed_order:1,
      		cancelled_order:1,
      		delivered_orders:1,
      		total_cans_unreturned : {'$subtract' : [ '$total_cans_unreturned', '$total_cans_returned' ]},
      		total_paid_orders: 1,
      		total_outstanding_payments: 1,
      		total_amount_paid: 1,
      		
        }
      }],
      function(err, result) {
        if(err){
          console.log(err);
          return ReE(res, err, 500)
        }else{
        	let response;
        	if(result.length == 0){
        		let count = [];
        		let obj = {};
        		obj.placed_order = 0;
        		obj.cancelled_order = 0;
        		obj.delivered_orders = 0;
        		obj.total_cans_unreturned = 0;
        		obj.total_paid_orders = 0;
        		obj.total_outstanding_payments = 0;
        		obj.total_amount_paid = 0;
        		count.push(obj);
        		response = count;
        	}else{
        		response = result;
        	}
          return ReS(res, { message: 'Monthly Order Report', count: response }, 200)
        }
      }
  );
    

}
module.exports.Reportmonthly = Reportmonthly

/** Order Report custom  **/
const Reportcustom = async function (req, res) {
    const reqOrder = req.body
    let user = req.user

    if (typeof user.vendor === 'undefined' || user.vendor === '') {
        return ReE(res, {message: 'User is not vendor'}, 400)
    }

    let vendorId = user.vendor
    
    if (typeof reqOrder.start_date === 'undefined' || reqOrder.start_date === '') {
        return ReE(res, {message: 'Start Date was not entered'}, 400)
    }
    if (typeof reqOrder.end_date === 'undefined' || reqOrder.end_date === '') {
        return ReE(res, {message: 'End Date was not entered'}, 400)
    }
    

    Order.aggregate(
    [
      {
        $match: { orderdate: { $gte: reqOrder.start_date, $lte: reqOrder.end_date}, vendor: new ObjectId(vendorId) }
      },  
      { $group: { 
          _id: null, 
          total_cans_unreturned: { $sum: '$quantity' },
          total_cans_returned: { $sum: '$can_return_count' },
          placed_order: { $sum : { $cond : [ { $eq: [ '$status', 'placed' ] }, 1 , 0  ]  } } ,
          cancelled_order: { $sum : { $cond : [ { $eq: [ '$status', 'cancelled' ] }, 1 , 0  ]  } } ,
          delivered_orders: { $sum : { $cond : [ { $eq: [ '$status', 'delivered' ] }, 1 , 0  ]  } },
          total_paid_orders: { $sum : { $cond : [ { $eq: [ '$paymentStatus', 'paid' ] }, 1 , 0  ]  } } ,
          total_outstanding_payments: { $sum : { $cond : [ { $eq: [ '$paymentStatus', 'unpaid' ] }, '$total' , 0  ]  } } ,
          total_amount_paid: { $sum : { $cond : [ { $eq: [ '$paymentStatus', 'paid' ] }, '$total' , 0  ]  } } ,
        }
      }, {$project:{
      		_id:1,
      		placed_order:1,
      		cancelled_order:1,
      		delivered_orders:1,
      		total_cans_unreturned : {'$subtract' : [ '$total_cans_unreturned', '$total_cans_returned' ]},
      		total_paid_orders: 1,
      		total_outstanding_payments: 1,
      		total_amount_paid: 1,
      		
        }
      }],
      function(err, result) {
        if(err){
          console.log(err);
          return ReE(res, err, 500)
        }else{
        	let response;
        	if(result.length == 0){
        		let count = [];
        		let obj = {};
        		obj.placed_order = 0;
        		obj.cancelled_order = 0;
        		obj.delivered_orders = 0;
        		obj.total_cans_unreturned = 0;
        		obj.total_paid_orders = 0;
        		obj.total_outstanding_payments = 0;
        		obj.total_amount_paid = 0;
        		count.push(obj);
        		response = count;
        	}else{
        		response = result;
        	}
          return ReS(res, { message: 'Monthly Order Report', count: response }, 200)
        }
      }
  );
    

}
module.exports.Reportcustom = Reportcustom

/** Order before delivery Report daily  **/
module.exports.BeforeDelivery = async function (req, res) {
    let user = req.user;
    
    if (typeof user.vendor === 'undefined' || user.vendor === '') {
        return ReE(res, {message: 'User is not vendor'}, 400)
    }
    
    
    let vendorId = user.vendor
    const now = new Date();
    const start = new Date();
    start.setUTCHours(0,0,0,0);
    const end = new Date();
    end.setUTCHours(23,59,59,0);
    
    
    Order.aggregate(
    [
      {
        $match: { schedule_deliveryDate: { $gte: start, $lte: end}, vendor: new ObjectId(vendorId) }
      },
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "product"
        }
      },
      {
        $unwind: "$product"
      },
      { $group: {
           _id: '$product.name',
           quantity: { $sum: '$quantity' },
           total_order: { $sum: 1 },
        }
      },
      {$project:{tmp:{name:'$_id', quantity: '$quantity', order:'$total_order'}}},
      {$group:{_id:null, total_order:{$sum:'$tmp.order'}, total_quantity_cans:{$sum:'$tmp.quantity'}, product:{$addToSet:'$tmp'}}},
      ],
      function(err, result) {
        if(err){
          console.log(err);
          return ReE(res, err, 500)
        }else{
        	let response;
        	if(result.length == 0){
        		let count = [];
        		let obj = {};
        		obj.total_order = 0;
        		obj.total_quantity_cans = 0;
        		obj.product = [];
        		count.push(obj);
        		response = count;
        	}else{
        		response = result;
        	}
          return ReS(res, { message: 'Total before delivery Report', response}, 200)
        }
      }
  );

}


/** Order after delivery Report daily  **/
module.exports.AfterDelivery  = async function (req, res) {
    let err, order;
    let user = req.user;
    
    if (typeof user.vendor === 'undefined' || user.vendor === '') {
        return ReE(res, {message: 'User is not vendor'}, 400)
    }
    
    let vendorId = user.vendor
    const start = new Date();
    start.setUTCHours(0,0,0,0);
    const end = new Date();
    end.setUTCHours(23,59,59,0);
    
    
    
    Order.aggregate(
    [
      {
        $match: { schedule_deliveryDate: { $gte: start, $lte: end}, vendor: new ObjectId(vendorId) }
      },  
      { $group: { 
          _id: null,
          total_cans_unreturned: { $sum: '$quantity' },
          total_cans_returned: { $sum: '$can_return_count' },
          total_order_notdeliverd: { $sum : { $cond : [ { $eq: [ '$status', 'placed' ] }, 1 , 0  ]  } } ,
          total_order_deliverd: { $sum : { $cond : [ { $eq: [ '$status', 'delivered' ] }, 1 , 0  ]  } },
          total_amount_collected: { $sum : { $cond : [ { $eq: [ '$paymentStatus', 'paid' ] }, '$total' , 0  ]  } } ,
        }
      },
      {$project:{
      		_id:1,
      		total_order_notdeliverd:1,
      		total_order_deliverd:1,
      		total_amount_collected:1,
      		total_cans_unreturned : {'$subtract' : [ '$total_cans_unreturned', '$total_cans_returned' ]},
      		total_cans_returned:1,
      		
        }
      }],
      function(err, result) {
        if(err){
          console.log(err);
          return ReE(res, err, 500)
        }else{

        	let response;
        	if(result.length == 0){
        		let count = [];
        		let obj = {};
        		obj.total_order_notdeliverd = 0;
        		obj.total_order_deliverd = 0;
        		obj.total_cans_unreturned = 0;
        		obj.total_cans_returned = 0;
        		obj.total_amount_collected = 0;
        		count.push(obj);
        		response = count;
        	}else{
        		response = result;
        	}
        	return ReS(res, { message: 'Today after delivery Report', count: response }, 200)
        }
      }
  );

}


/** Order Report weekly for unreturned cans  **/
const Reportweekly_unreturned = async function (req, res) {
    let user = req.user

    if (typeof user.vendor === 'undefined' || user.vendor === '') {
        return ReE(res, {message: 'User is not vendor'}, 400)
    }

    let vendorId = user.vendor

    var curr = new Date; // get current date
    var myToday = new Date(curr.getFullYear(), curr.getMonth(), curr.getDate(), 0, 0, 0);
    var first = myToday.getDate() - myToday.getDay(); 
    var Startofweek = new Date(myToday.setDate(first));
    
    Order.aggregate(
    [
      {
        $match: { orderdate: {  $gte: Startofweek , $lte: new Date() } ,  vendor: new ObjectId(vendorId) }
      }, 
      {
      	$lookup:  { 
                from: "users", 
                localField: "user", 
                foreignField: "_id", 
                as: "user"  
            }
      }, 
      {
        $unwind: "$user"
      },
      { $group: { 
           _id: '$user', 
           total_cans_unreturned: { $sum: '$quantity' },
           total_cans_returned: { $sum: '$can_return_count' },
        }
      },
      {$project:{tmp:{name:'$_id.name', phone: '$_id.phone', address1:'$_id.address1' , address2:'$_id.address2', total_cans_unreturned : {'$subtract' : [ '$total_cans_unreturned', '$total_cans_returned' ]}}  }}, 
      { $group: {
      			_id:null,
      			total_cans_unreturned:{$sum:'$tmp.total_cans_unreturned'},
                user:{$addToSet:'$tmp'}
            }
      },
      { $project: {
	      total_cans_unreturned : 1,
	      user:
           {
              $filter:
              {
                input: "$user",
                as: "us",
                cond: { $gte: [ '$$us.total_cans_unreturned', 1 ] }
              }
            }
	      
	    }
	  }],
      function(err, result) {
        if(err){
          console.log(err);
          return ReE(res, err, 500)
        }else{

        	let user = [];
        	let total_cans_unreturned = 0;
        	if(result.length != 0 && typeof result[0] !== 'undefined'){
        		total_cans_unreturned = result[0].total_cans_unreturned;
        		user = result[0].user;
        	}
          return ReS(res, { message: 'Weekly unreturned cans Report', total_cans_unreturned: total_cans_unreturned,  user }, 200)
        }
      }
  );
    

}
module.exports.Reportweekly_unreturned = Reportweekly_unreturned


/** Order Report monthly for unreturned cans  **/
const Reportmonthly_unreturned = async function (req, res) {
    let user = req.user

    if (typeof user.vendor === 'undefined' || user.vendor === '') {
        return ReE(res, {message: 'User is not vendor'}, 400)
    }

    let vendorId = user.vendor

    var date = new Date();
    var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    
    Order.aggregate(
    [
      {
        $match: { orderdate: {  $gte: firstDay , $lte: new Date() } , vendor: new ObjectId(vendorId) }
      }, 
      {
      	$lookup:  { 
                from: "users", 
                localField: "user", 
                foreignField: "_id", 
                as: "user"  
            }
      }, 
      {
        $unwind: "$user"
      },
      { $group: { 
           _id: '$user', 
           total_cans_unreturned: { $sum: '$quantity' },
           total_cans_returned: { $sum: '$can_return_count' },
        }
      },
      {$project:{tmp:{name:'$_id.name', phone: '$_id.phone', address1:'$_id.address1' , address2:'$_id.address2', total_cans_unreturned : {'$subtract' : [ '$total_cans_unreturned', '$total_cans_returned' ]}}  }}, 
      { $group: {
      			_id:null,
      			total_cans_unreturned:{$sum:'$tmp.total_cans_unreturned'},
                user:{$addToSet:'$tmp'}
            }
      },
      { $project: {
	      total_cans_unreturned : 1,
	      user:
           {
              $filter:
              {
                input: "$user",
                as: "us",
                cond: { $gte: [ '$$us.total_cans_unreturned', 1 ] }
              }
            }
	      
	    }
	  }],
      function(err, result) {
        if(err){
          console.log(err);
          return ReE(res, err, 500)
        }else{

        	let user = [];
        	let total_cans_unreturned = 0;
        	if(result.length != 0 && typeof result[0] !== 'undefined'){
        		total_cans_unreturned = result[0].total_cans_unreturned;
        		user = result[0].user;
        	}
          return ReS(res, { message: 'Monthly unreturned cans Report', total_cans_unreturned: total_cans_unreturned,  user }, 200)
        }
      }
  );
    

}
module.exports.Reportmonthly_unreturned = Reportmonthly_unreturned



/** Order Report weekly for unpaid cans  **/
const Reportweekly_unpaid = async function (req, res) {
    let user = req.user

    if (typeof user.vendor === 'undefined' || user.vendor === '') {
        return ReE(res, {message: 'User is not vendor'}, 400)
    }

    let vendorId = user.vendor

    var curr = new Date; // get current date
    var myToday = new Date(curr.getFullYear(), curr.getMonth(), curr.getDate(), 0, 0, 0);
    var first = myToday.getDate() - myToday.getDay(); 
    var Startofweek = new Date(myToday.setDate(first));
    
    Order.aggregate(
    [
      {
        $match: { orderdate: {  $gte: Startofweek , $lte: new Date() } , paymentStatus: 'unpaid', vendor: new ObjectId(vendorId) }
      }, 
      {
      	$lookup:  { 
                from: "users", 
                localField: "user", 
                foreignField: "_id", 
                as: "user"  
            }
      }, 
      {
        $unwind: "$user"
      },
      { $group: { 
           _id: '$user', 
           amount: { $sum: '$total' },
        }
      }, 
      {$project:{tmp:{name:'$_id.name', phone: '$_id.phone', address1:'$_id.address1' , address2:'$_id.address2', amount: '$amount'}  }}, 
      {$group:{_id:null, total_amount:{$sum:'$tmp.amount'}, user:{$addToSet:'$tmp'}}},
      ],
      function(err, result) {
        if(err){
          console.log(err);
          return ReE(res, err, 500)
        }else{

        	let user = [];
        	let total_amount = 0;
        	if(result.length != 0 && typeof result[0] !== 'undefined'){
        		total_amount = result[0].total_amount;
        		user = result[0].user;
        	}
          	
          return ReS(res, { message: 'Weekly unpaid amount Report', total_amount: total_amount,  user }, 200)
        }
      }
  );
    

}
module.exports.Reportweekly_unpaid = Reportweekly_unpaid


/** Order Report monthly for unpaid cans  **/
const Reportmonthly_unpaid = async function (req, res) {
    let user = req.user

    if (typeof user.vendor === 'undefined' || user.vendor === '') {
        return ReE(res, {message: 'User is not vendor'}, 400)
    }

    let vendorId = user.vendor

    var date = new Date();
    var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    
    Order.aggregate(
    [
      {
        $match: { orderdate: {  $gte: firstDay , $lte: new Date() } , paymentStatus: 'unpaid', vendor: new ObjectId(vendorId) }
      }, 
      {
      	$lookup:  { 
                from: "users", 
                localField: "user", 
                foreignField: "_id", 
                as: "user"  
            }
      }, 
      {
        $unwind: "$user"
      },
      { $group: { 
           _id: '$user', 
           amount: { $sum: '$total' },
        }
      }, 
      {$project:{tmp:{name:'$_id.name', phone: '$_id.phone', address1:'$_id.address1' , address2:'$_id.address2', amount: '$amount'}  }}, 
      {$group:{_id:null, total_amount:{$sum:'$tmp.amount'}, user:{$addToSet:'$tmp'}}},
      ],
      function(err, result) {
        if(err){
          console.log(err);
          return ReE(res, err, 500)
        }else{

        	let user = [];
        	let total_amount = 0;
        	if(result.length != 0 && typeof result[0] !== 'undefined'){
        		total_amount = result[0].total_amount;
        		user = result[0].user;
        	}
          	
          return ReS(res, { message: 'User Reports', total_amount: total_amount,  user }, 200)
        }
      }
  );
    

}
module.exports.Reportmonthly_unpaid = Reportmonthly_unpaid


/** filter with phon  **/
const Filterphone = async function (req, res) {
	let err, user
	let limit = 10;
    let current_page = 1;

    let vendor = req.user

    if (typeof vendor.vendor === 'undefined' || vendor.vendor === '') {
        return ReE(res, {message: 'User is not vendor'}, 400)
    }

    let vendorId = vendor.vendor

	const phoneno = req.params.phone
   
    if (validator.isEmpty(phoneno)) {
        return ReE(res, {message: 'Please enter an phoneno'}, 400)
    }
    
	if (req.query.page) {
		current_page = req.query.page
    }
     
    [err, user] = await to(User.findOne( {'phone': phoneno } ) )

	
	if (err) {
            console.log(err)
            return ReE(res, err, 500)
    } else {

    	if (user) {

	var aggregate = Order.aggregate();
	aggregate
				.match({vendor: new ObjectId(vendorId)})
        .lookup( {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "user"
            } )
        .lookup( {
                from: "products",
                localField: "product",
                foreignField: "_id",
                as: "products"
            } )
        .unwind("$user")
        .project({
       		_id : 0,
        	name: '$user.name',
        	address1: '$user.address1',
        	address2: '$user.address2',
        	phone: '$user.phone',
        	amount: '$total',
        	quantity: '$quantity',
        	can_return_count: '$can_return_count',
        	paymentStatus: '$paymentStatus',
			    	orders:{
			    		    order : '$_id',
			    			vendor: '$vendor',
			    	 		products : '$products',
			    	 		status:'$status',
			    	 		product : '$product',
			    	 		can_return_status : '$can_return_status',
			    	 		quantity : '$quantity' ,
			    	 		paymentStatus : '$paymentStatus' ,
			    	 		orderdate : '$orderdate',
			    	 		total_cans_unreturned : {'$subtract' : [ '$quantity', '$can_return_count' ]},
			    	 		amount : '$total',
			    	 	}
        	})
        .match({ phone : phoneno });
      		
	var options = {
                    page : current_page,
                    limit : limit
      	}


	Order.aggregatePaginate(aggregate, options, function(err, results, pageCount, count) {
        if(err){
            console.error(err)
          return ReE(res, err, 500)
        }else{
              let order = [];
              let data = {};
	          let total_cans_unreturned = 0;
	          let amount = 0;
        	if(results.length != 0 ){
        		results.forEach(function(element) {
        		  if(element.paymentStatus == 'unpaid'){
        		  	amount += element.amount;
        		  }
        		  var cans = element.quantity - element.can_return_count;
        		  total_cans_unreturned += cans;
        		  data['name'] = element.name;
        		  data['address1'] = element.address1;
        		  data['address2'] = element.address2;
        		  data['phone'] = element.phone
        		  order.push(element.orders);
				});
        	}
        	data['total_cans_unreturned'] = total_cans_unreturned;
        	data['total_outstanding_payments'] = amount;
        	data['orders'] = order;

              return ReS(res, {
                                user: data,
                                total: count,
                                limit: limit,
                                page: current_page,
                                pages: pageCount
                            }, 200)
        }
			});
		} else {
			return ReE(res, {message: 'Invalid Phone'}, 400)
      }

	}
  

}
module.exports.Filterphone = Filterphone