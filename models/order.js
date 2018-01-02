var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const mongooseAlgolia = require('mongoose-algolia');
const deepPopulate = require('mongoose-deep-populate')(mongoose);

const OrderSchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'User'},
  totalPrice: { type: Number, default: 0},
  products: [{
    product: { type: Schema.Types.ObjectId, ref: 'Product'},
    quantity: { type: Number, default: 1}
  }],
  state: String,
});

OrderSchema.plugin(deepPopulate);
module.exports = mongoose.model('Order', OrderSchema);
