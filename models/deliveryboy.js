const mongoose = require('mongoose')

var activestatus = ['active', 'inactive']

let DeliveryboySchema = new mongoose.Schema({
    vendor: {
        type: mongoose.Schema.ObjectId,
        ref: 'Vendor',
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    phone: {
        type: String,
        required: true,
        trim: true,
    },
    secret_code: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: activestatus,
        default: 'inactive',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    
})

DeliveryboySchema.methods.toWeb = function () {
    let json = this.toJSON()
    json.id = this._id//this is for the front end
    return json
}

let Deliveryboy = module.exports = mongoose.model('Deliveryboy',
    DeliveryboySchema)


