const mongoose = require('mongoose')
const ObjectId = require('mongoose').Types.ObjectId
const bcrypt = require('bcryptjs')
const bcrypt_p = require('bcrypt-promise')
const jwt = require('jsonwebtoken')
const validate = require('mongoose-validator')
const Vendor = require('./../models/vendor')
const Ownership = require('./../models/ownership')

let UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    phone: {
        type: String, required: true, unique: true, index: true, sparse: true,//sparse is because now we have two possible unique keys that are optional
        validate: [
            validate({
                validator: 'isNumeric',
                arguments: [7, 20],
                message: 'Not a valid phone number.',
            })],
    },
    countryCode: {
        type: String,
    },
    otp: {
        type: String,
    },
    address1: {
        type: String,
    },
    address2: {
        type: String,
    },
    tower: {
        type: Number,
    },
    floor: {
        type: Number,
    },
    doorno: {
        type: Number,
    },
    image: {
        type: String,
    },
    city: {
        type: String,
    },
    pincode: {
        type: String,
    },
    _coordinates: {
        type: [Number],
        index: '2dsphere',
        default: [0, 0],
    },
    vendor: {
        type: mongoose.Schema.ObjectId,
        ref: 'Vendor',
    },
    owned: [{
    
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    lastLogin: {
        type: Date,
    },
    
})

UserSchema.virtual('vendors', {
    ref: 'Vendor',
    localField: 'vendor',
    foreignField: '_id',
})

UserSchema.methods.ownership = async function (vendorId) {
    
    let err,ownership,
        products = [];
    
    var options = {
        user: this,
    };
    
    if (vendorId) {
        options.vendor = new ObjectId(vendorId)
    }

    [err, ownership] = await to(
        Ownership.findOne(options,
            {'products._id': 0}).
            populate({
                path: 'products.product',
                select: 'name price size metric initialCost',
            }))
    if (err) {
        console.log(err)
    }
    if (ownership) {
        products = ownership.products
    }
    
    return [err, products]
    
}

UserSchema.methods.Vendors = async function () {
    let err, vendors;
    [err, vendors] = await to(Vendor.find({'user': this._id}))
    if (err) TE('err getting vendors')
    return vendors
}

UserSchema.methods.getJWT = function () {
    let expiration_time = parseInt(CONFIG.jwt_expiration)
    console.log(expiration_time);
    
    //, {expiresIn: expiration_time}
    return 'Bearer ' + jwt.sign({user_id: this._id}, CONFIG.jwt_encryption)
}

UserSchema.methods.toWeb = function () {
    let json = this.toJSON()
    json.id = this._id//this is for the front end
    return json
}

let User = module.exports = mongoose.model('User', UserSchema)


