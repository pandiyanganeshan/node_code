const User = require('../models').User
const msg91 = require('msg91')(CONFIG.sms_auth_key, CONFIG.sms_sender_id,
    CONFIG.sms_route_id)
const ObjectId = require('mongoose').Types.ObjectId
const validator = require('validator')

const register = async function (req, res) {
    const reqRegister = req.body
    let err, user;
    
    if (typeof reqRegister.name === 'undefined' || reqRegister.name === '') {
        return ReE(res, {message: 'name was not entered'}, 400)
    }
    
    if (typeof reqRegister.phone === 'undefined' || reqRegister.phone === '') {
        return ReE(res, {message: 'phone was not entered'}, 400)
    }
    
    if (reqRegister.phone.startsWith("+91")) {
        reqRegister.countryCode = "+91"
        reqRegister.phone = reqRegister.phone.replace("+91", "")
    }
    
    if (reqRegister.phone.startsWith("+1")) {
        reqRegister.countryCode = "+1"
        reqRegister.phone = reqRegister.phone.replace("+1", "")
    } else {
        reqRegister.countryCode = "+91"
    }
    
    
    console.log(reqRegister.phone)
    if (validator.isMobilePhone(reqRegister.phone,['en-IN','en-US'])) {//checks if only phone number was sent
        
        let OTP = Math.floor(100000 + Math.random() * 900000)
        reqRegister.otp = OTP;
        [err, user] = await to(User.create(reqRegister))
        if (err) {
            if (err.code === 11000) {
                let message = encodeURIComponent(OTP+' is the Verification code for MeatTap. Welcome back.');
                [err, user] = await to(
                    User.findOne({'phone': reqRegister.phone}).populate('vendor'))
                if (err) {
                    return ReE(res, err, 500)
                } else {
                    user['otp'] = OTP
                    
                    if (reqRegister.countryCode) {
                        user.countryCode = reqRegister.countryCode
                    }
                    
                    user.save()
                    
                    if (CONFIG.sms_enable === 'true') {
                       
                        console.log(reqRegister.countryCode+reqRegister.phone)
                        msg91.send(reqRegister.countryCode+reqRegister.phone, message, function(err, response){
                            console.log("SMS",err, response)
                        });
                    } else {
                        console.log("Not sending SMS")
                    }
                    return ReS(res, {
                        message: 'Phone number already exists',
                        newUser: false,
                        user: user.toWeb(),
                    }, 200)
                }
            } else {
                return ReE(res, err, 500)
            }
        } else {
            let message = encodeURIComponent(OTP+' is the Verification code for MeatTap.')
            
            if (CONFIG.sms_enable === 'true') {
               
                msg91.send(reqRegister.countryCode+reqRegister.phone, message, function(err, response){});
            } else {
                console.log("Not sending SMS")
            }
            return ReS(res,
                {message: 'Successfully created new user.',
                    newUser: true,
                    user: user.toWeb()},
                200)
        }
    } else {
        return ReE(res, {message: 'Invalid phone number'},
            400)
    }
    
}
module.exports.register = register

const verifyOTP = async function (req, res) {
    const reqVerify = req.body
    let err, user
    
    if (typeof reqVerify.otp === 'undefined' || reqVerify.otp === '') {
        return ReE(res, {message: 'Otp was not entered'}, 400)
    }
    if (typeof reqVerify.id === 'undefined' || reqVerify.id === '') {
        return ReE(res, {message: 'User Id was not entered'}, 400)
    }
    
    [err, user] = await to(User.findOne(
        {'otp': reqVerify.otp, '_id': new ObjectId(reqVerify.id)})
        .populate({path:'vendor',select:'address1 address2 city pincode name'}))
    
    if (err) {
        return ReE(res, err, 500)
    } else {
        if (user) {
            return ReS(res, {
                message: 'Successfully Verified.',
                user: user.toWeb(),
                token: user.getJWT(),
            }, 200)
        } else {
            return ReE(res, {message: 'Invalid OTP! or User.'}, 400)
        }
    }
}
module.exports.verifyOTP = verifyOTP

const resendOTP = async function (req, res) {
    const reqResend = req.body
    let err, user
    
    if (typeof reqResend.userid === 'undefined' || reqResend.userid === '') {
        return ReE(res, {message: 'User Id was not entered'}, 400)
    }
    
    [err, user] = await to(
        User.findOne({'_id': new ObjectId(reqResend.userid)}))
    
    if (err) {
        return ReE(res, err, 500)
    } else {
        if (user) {
            let OTP = Math.floor(100000 + Math.random() * 900000)
            user['otp'] = OTP
            user.save()
    
            let message = encodeURIComponent(OTP+' is the Verification code for MeatTap.');
    
            if (CONFIG.sms_enable === 'true') {
                if (!user.countryCode) {
                    user.countryCode = "+91"
                }
                msg91.send(user.countryCode+user.phone, message, function(err, response){});
            } else {
                console.log("Not sending SMS")
            }
            
            return ReS(res, {message: 'OTP resent.', OTP: OTP}, 200)
        } else {
            return ReE(res, {message: 'Invalid User.'}, 400)
        }
    }
}
module.exports.resendOTP = resendOTP

const get = async function (req, res) {
    res.setHeader('Content-Type', 'application/json')
    let userId = req.params.userId
    
    if (typeof userId === 'undefined' || userId === '') {
        return ReE(res, {message: 'user id was not entered'}, 400)
    }
    
    [err, user] = await to(User.findOne({'_id': new ObjectId(userId)}))
    
    if (err) {
        return ReE(res, err, 500)
    } else {
        if (user) {
            return ReS(res, {message: 'user list', user: user.toWeb()}, 200)
        }
        else {
            return ReE(res, {message: 'Invalid User.'}, 400)
        }
    }
}

module.exports.get = get

const update = async function (req, res) {
    
    const updateData = req.body
    
    
    let user = req.user;
    
    
    [err, vendor] = await to(User.update({_id: user._id}, updateData))
    
    if (err) {
        return ReE(res, err, 500)
    } else {
        return ReS(res, {message: 'User updated', update: updateData}, 200)
    }
    
}

module.exports.update = update
