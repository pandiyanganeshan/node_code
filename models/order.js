const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const bcrypt_p = require('bcrypt-promise')
const jwt = require('jsonwebtoken')
const validate = require('mongoose-validator')
var mongoosePaginate = require('mongoose-paginate')
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate')

var orderstatus = ['placed', 'cancelled', 'delivered', 'returned']
var canStatusEnum = ['returned', 'partially_returned', 'unreturned']
const paymentStatusEnum = ['paid', 'unpaid', 'partial']

let OrderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
    },
    vendor: {
        type: mongoose.Schema.ObjectId,
        ref: 'Vendor',
    },
    product: {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
    },
    quantity: {
        type: Number,
    },
    total: {
        type: Number,
    },
    status: {
        type: String,
        enum: orderstatus,
        default: 'placed',
    },
    paymentStatus: {
        type: String,
        enum: paymentStatusEnum,
        default: 'unpaid',
    },
    can_return_status: {
        type: String,
        enum: canStatusEnum,
        default: 'unreturned',
    },
    can_return_count: {
        type: Number,
        default:0
    },
    orderdate: {
        type: Date,
        default: Date.now,
    },
    deliveredBy : {
        type: mongoose.Schema.ObjectId,
        ref: 'Deliveryboy',
    },
    schedule_deliveryDate : {
        type: Date
    },
    deliveredDate : {
        type: Date
    },
    deferMessage : {
        type: String
    }
    
})

OrderSchema.set('toObject', { virtuals: true });
OrderSchema.set('toJSON', { virtuals: true });


OrderSchema.methods.toWeb = function () {
    let json = this.toJSON()
    json.id = this._id//this is for the front end
    return json
}

OrderSchema.plugin(mongoosePaginate)
OrderSchema.plugin(mongooseAggregatePaginate);

let Order = module.exports = mongoose.model('Order', OrderSchema)


