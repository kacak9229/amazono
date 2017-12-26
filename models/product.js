const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mongooseAlgolia = require('mongoose-algolia');

const ProductSchema = new Schema({
  category: { type: Schema.Types.ObjectId, ref: 'Category'},
  owner: { type: Schema.Types.ObjectId, ref: 'User'},
  reviews: [{ type: Schema.Types.ObjectId, ref: 'Review'}],
  image: String,
  title: String,
  description: String,
  price: Number,
  created: { type: Date, default: Date.now },
});

ProductSchema.plugin(mongooseAlgolia, {
  appId: 'CO3GNO6BHL',
  apiKey: '7cb0b28f264284a8d60805680c978838',
  indexName: 'producttesting',
  selector: 'title',
  populate: {
    path: 'owner',
    select: 'name'
  },
  defaults: {
    author: 'uknown'
  },
  mappings: {
    title: function(value) {
      return `${value}`
    }
  },
  debug: true
});

let Model = mongoose.model('Product', ProductSchema);

Model.SyncToAlgolia();
Model.SetAlgoliaSettings({
  searchableAttributes: ['name','properties','shows']
})
