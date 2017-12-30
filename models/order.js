var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const OrderSchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'User'},
  totalPrice: { type: Number, default: 0},
  products: [{
    product: { type: Schema.Types.ObjectId, ref: 'Product'},
    quantity: { type: Number, default: 1},
    price: { type: Number, default: 0},
  }],
  state: String,
});


module.exports = mongoose.model('Order', OrderSchema);
