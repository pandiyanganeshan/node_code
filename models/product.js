const mongoose 	= require('mongoose');

var mongoosePaginate = require('mongoose-paginate')

let ProductSchema = new mongoose.Schema({
    vendor: {
        type: mongoose.Schema.ObjectId,
        ref: 'Vendor',
    },
    name: {
        type: String,
        trim: true,
    },
    color: {
        type: String,
    },
    size: {
        type: Number,
    },
    metric: {
        type: String,
    },
    price: {
        type: Number,
    },
    initialCost: {
        type: Number,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
})
 

ProductSchema.methods.toWeb = function(){
    let json = this.toJSON();
    json.id = this._id;//this is for the front end
    return json;
};

ProductSchema.plugin(mongoosePaginate)


let Product = module.exports = mongoose.model('Product', ProductSchema);


