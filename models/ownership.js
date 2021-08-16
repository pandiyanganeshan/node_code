const mongoose 	= require('mongoose');

var mongoosePaginate = require('mongoose-paginate')

let OwnershipSchema = new mongoose.Schema({
    vendor: {
        type: mongoose.Schema.ObjectId,
        ref: 'Vendor',
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
    },
    
    products: [{
        product: {
                type: mongoose.Schema.ObjectId,
                ref: 'Product',
            },
        quantity: {
            type:Number
        }
    }],
    
    createdAt: {
        type: Date,
        default: Date.now,
    },
})


OwnershipSchema.methods.toWeb = function(){
    let json = this.toJSON();
    json.id = this._id;//this is for the front end
    return json;
};

OwnershipSchema.plugin(mongoosePaginate)


let Ownership = module.exports = mongoose.model('Ownership', OwnershipSchema);


