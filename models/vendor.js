const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const validate = require('mongoose-validator')
var mongoosePaginate = require('mongoose-paginate')

var productSchema = {
    
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
}

var deliveryboySchema = {
    type: mongoose.Schema.ObjectId,
    ref: 'Deliveryboy',
}

var activestatus = ['active', 'inactive', 'hold']

let VendorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    address1: {
        type: String,
        required: true,
    },
    address2: {
        type: String,
    },
    image: {
        type: String,
    },
    city: {
        type: String,
        required: true,
    },
    pincode: {
        type: String,
        required: true,
    },
    _coordinates: {
        type: [Number],
        index: '2dsphere',
        default: [0, 0],
    },
    product: [productSchema],
    deliveryboy: [deliveryboySchema],
    activestatus: {
        type: String,
        enum: activestatus,
        default: 'active',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    
})

VendorSchema.virtual('user', {
    ref: 'User',
    localField: '_id',
    foreignField: 'vendor',
})

VendorSchema.set('toJSON', { virtuals: true });
VendorSchema.set('toObject', { virtuals: true });

VendorSchema.path('_coordinates').validate(function (value) {
    return (
        Array.isArray(value) &&
        value.length === 2 &&
        'number' === typeof value[0] &&
        'number' === typeof value[1]
    )
}, 'Invalid location. Should be geoJSON')

// Setters, Getters
VendorSchema.virtual('location').set(function (location) {
    if ((Array.isArray(location) && location.length === 2)) {
        this._coordinates = location
    } else if (location === Object(location) &&
        location.type && location.type === 'Point' &&
        location.coordinates && location.coordinates.length === 2
    ) {
        this._coordinates = location.coordinates
    }
}).get(function () {
    return {
        'type': 'Point',
        'coordinates': this._coordinates,
    }
})

VendorSchema.methods.toWeb = function () {
    let json = this.toJSON()
    json.id = this._id//this is for the front end
    return json
}

VendorSchema.plugin(mongoosePaginate)

let Vendor = module.exports = mongoose.model('Vendor', VendorSchema)


