const router = require('express').Router();
const async = require('async');
const stripe = require('stripe') ('sk_test_RtVWGtHcykG3FyyNS1EGhbIq');

/* Models */
const User = require('../models/user');
const Product = require('../models/product');
const Cart = require('../models/cart');

/* To be removed */
const Category = require('../models/category');

/* Algolia Search */
const algoliasearch = require('algoliasearch');
const client = algoliasearch('something', 'something2');
const index = client.initIndex('producttesting');

const checkJWT = require('../middlewares/check-jwt');

/* TO BE DELETED */
const faker = require('faker');

/* PAGINATION FUNCTION */
function paginate(req, res, next) {

  var perPage = 9;
  var page = req.params.page;

  Product
    .find()
    .skip( perPage * page)
    .limit( perPage )
    .populate('category')
    .exec(function(err, products) {
      if (err) return next(err);
      Product.count().exec((err, count) => {
        if (err) return next(err);
        res.json({
          success: true,
          products: products,
          pages: Math.ceil(count / perPage)
        });
      });
    });
}

/* HOME PAGE */
router.get('/', (req, res, next) => {
  paginate(req, res, next);
});

/* Pagination */
router.get('/page/:page', (req, res, next) => {
  paginate(req,res,next);
});

/* GET - CATEGORIES ITEMS */
router.get('/categories/:id', (req, res, next) => {
  Product
    .find({ category: req.params.id })
    .populate('category')
    .exec((err, products) => {
      if (err) return next(err);
      res.json({
        success: true,
        products: products
      })
    });
});

/* GET - Single Product */
router.get('/product/:id', function(req, res, next) {
  Product.findById({ _id: req.params.id }, function(err, product) {
    if (err) return next(err);
    res.json({
      product
    })
  });
});

/* PAYMENT METHOD STRIPE */
router.post('/payment', checkJWT, (req, res, next) => {

  var stripeToken = req.body.stripeToken;
  var currentCharges = Math.round(req.body.stripeMoney * 100);
  stripe.customers.create({
    source: stripeToken,
  }).then(function(customer) {
    return stripe.charges.create({
      amount: currentCharges,
      currency: 'usd',
      customer: customer.id
    });
  }).then(function(charge) {
    async.waterfall([
      function(callback) {
        Cart.findOne({ owner: req.user._id }, (err, cart) => {
          callback(err, cart);
        });
      },
      function(cart, callback) {
        User.findOne({ _id: req.user._id }, (err, user) => {
          if (user) {
            for (var i = 0; i < cart.items.length; i++) {
              user.history.push({
                item: cart.items[i].item,
                paid: cart.items[i].price
              });
            }

            user.save((err, user) => {
              if (err) return next(err);
              callback(err, user);
            });
          }
        });
      },
      function(user) {
        Cart.update({ owner: user._id }, { $set: { items: [], total: 0 }}, (err, updated) => {
          if (updated) {
            res.json({
              success: true,
              message: 'Successfully made a payment'
            })
          }
        });
      }
    ]);
  });
});

/* ONLY FOR TESTING */
router.post('/create-new-category', (req, res, next) => {
  let category = new Category();
  category.name = req.body.name;
  category.save();
  res.json('category created');
});

/* Using Faker */
router.get('/populate/products/:id', (req, res, next) => {

  for (i = 0; i < 30; i++) {
    let product = new Product();
    product.category = req.params.id;
    product.owner = '5a3fd12c23825f001466bf8a';
    product.image = faker.image.cats()
    product.title = faker.commerce.productName();
    product.description = faker.lorem.words();
    product.price = faker.commerce.price();
    product.save()
  }

  res.json({
    message: 'Successfully added 30 pictures'
  });

});

module.exports = router;
