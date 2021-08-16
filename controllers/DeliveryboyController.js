const Deliveryboy = require('../models').Deliveryboy;
const Vendor = require('../models').Vendor;
const User = require('../models').User;
const ObjectId = require('mongoose').Types.ObjectId;
const validator = require('validator')
const crypto = require('crypto');

/** Post Deliveryboy  **/
const create = async function(req, res){
    const reqDeliveryboy = req.body;
    let err, deliveryboy, vendor;
    let user = req.user;
    var secret_code = crypto.randomBytes(3).toString('hex');

    
    if (typeof user.vendor === 'undefined' || user.vendor === "") {
        return ReE(res, {message:'User is not a Vendor'}, 400);
    }
    
    reqDeliveryboy.vendor = user.vendor;

    if (typeof reqDeliveryboy.name === 'undefined' || reqDeliveryboy.name === "") {
        return ReE(res, {message:'Please enter a name for the Delivery boy'}, 400);
    }
    if (typeof reqDeliveryboy.phone === 'undefined' || reqDeliveryboy.phone === "") {
        return ReE(res, {message:'Please enter Delivery boy phone number'}, 400);
    }
    reqDeliveryboy['secret_code'] = secret_code;

    [err, deliveryboy] = await to(Deliveryboy.create(reqDeliveryboy));

    if(err){
        console.log(err);
        return ReE(res, err, 500);
    }else{
        [err, vendor] = await to(Vendor.update( {_id: user.vendor}, {$push: {deliveryboy: deliveryboy._id}}));

        if(err){
            console.log(err);
            return ReE(res, err, 500);
        }else{
            [err, userdetails] = await to(User.findOne( {_id: user.id}));
            return ReS(res, {message:'Delivery boy added.', verificationCode:deliveryboy.secret_code}, 200);
        } 
        
    }  
    
}
module.exports.create = create;

const resendCode = async function(req, res){
    const reqResend = req.body;
    let err, deliveryboy;

    if (typeof reqResend.id === 'undefined' || reqResend.id === "") {
        return ReE(res, {message:'Deliveryboy Id was not entered'}, 400);
    }

    [err, deliveryboy] = await to( Deliveryboy.findOne( { '_id': new ObjectId( reqResend.id ) } ) );

    if(err) {
        return ReE(res, err, 500);
    } else {
        if (deliveryboy) {
            var secret_code = crypto.randomBytes(3).toString('hex');
            deliveryboy['secret_code'] = secret_code;
            deliveryboy.save();
            return ReS(res, { message:'regenerated Code.', secret_code:secret_code }, 200);
        } else {
            return ReE(res, {message:'Invalid Deliveryboy.'}, 400);
        }
    } 
}
module.exports.resendCode = resendCode;

const verify = async function(req, res){
    const reqVerify = req.body;
    let err, deliveryboy;
    
    if(!reqVerify.secret_code){
        return ReE(res, {message:'No data sent '}, 400);
    }
    
    if (validator.isEmpty(reqVerify.secret_code)) {
        return ReE(res, {message:'Please enter a secret code.'}, 400);
    }

    [err, deliveryboy] = await to(Deliveryboy.findOne({ 'secret_code': reqVerify.secret_code.toLowerCase()}));

    if(err) {
        return ReE(res, err, 500);
    } else {
        if (deliveryboy) {
            [err, status] = await to(Deliveryboy.update( {'_id': new ObjectId(deliveryboy.id) }, {  status : 'active'  } ) );
            if(err)
                return ReE(res, err, 500);
            
            [err, user] = await to(User.findOne( {vendor: new ObjectId(deliveryboy.vendor)})
            .select('name phone vendor address1 address2 city pincode')
            .populate({path:'vendor',select:''}));
    
            
            
            if(err) {
                console.log(err);
                return ReE(res, err, 500);
            }
            
            if(user){
                return ReS(res, {message:'Successfully Activated.', id:deliveryboy.id, user:user, token:user.getJWT()}, 200);
    
            } else {
                return ReE(res, {message:'User not found'}, 400);
            }
            
        } else {
            return ReE(res, {message:'Invalid Secret Code'}, 400);
        }
    } 
}
module.exports.verify = verify;

/** update Deliveryboy  **/
const update = async function(req, res){
    const reqDeliveryboy = req.body;
    const deliveryboyId  = req.params.id
    let err, deliveryboy;
    
    
    if (validator.isEmpty(deliveryboyId)) {
        return ReE(res, {message:'Please provide a Deliveryboy ID to update'}, 400);
    }
    
    if (!reqDeliveryboy.name && !reqDeliveryboy.phone) {
        return ReE(res, {message:'Nothing to update'}, 400);
    }
    
    [err, deliveryboy] = await to(Deliveryboy.update({_id: new ObjectId(deliveryboyId)}, reqDeliveryboy));
    
    if(err){
        console.log(err);
        return ReE(res, err, 500);
    }else{
        return ReS(res, {message:'Delivery boy Updated.'}, 200);
    } 
    
}
module.exports.update = update;

/** delete Deliveryboy  **/
const deleteDeliveryboy = async function(req, res){
    let deliveryboyId = req.params.id;
    let err, deliveryboy;
    
    if (validator.isEmpty(deliveryboyId)) {
        return ReE(res, {message:'Please provide a Deliveryboy ID to update'}, 400);
    }
    
    [err, deliveryboy] = await to(Deliveryboy.find( {'_id': new ObjectId(deliveryboyId) }).remove());
    
    if(err){
        console.log(err);
        return ReE(res, err, 500);
    }else{
        return ReS(res, {message:'Deliveryboy removed'}, 200);
    } 
    
}
module.exports.deleteDeliveryboy = deleteDeliveryboy;
