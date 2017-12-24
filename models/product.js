const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProductSchema = new Schema({
  category: { type: Schema.Types.ObjectId, ref: 'Category'},
  owner: { type: Schema.Types.ObjectId, ref: 'User'},
  name: String,
  price: Number,
  reviews: [{ type: Schema.Types.ObjectId, ref: 'Review'}],
  created: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Product', ProductSchema);
