const router = require('express').Router();
const User = require('../models/user');
const Product = require('../models/product');
const Cart = require('../models/cart');
const async = require('async');

const checkJWT = require('../middlewares/check-jwt');
const stripe = require('stripe') ('sk_test_RtVWGtHcykG3FyyNS1EGhbIq');


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
          pages: count / perPage
        });
      });
    });
}

/* HOME PAGE */
router.get('/', (req, res, next) => {
  paginate(req, res, next);
});

/* CART API */
router.get('/cart', (req, res, next) => {
  Cart
    .findOne({ owner: req.user._id })
    .populate('items.item')
    .exec(function(err, foundCart) {
      if (err) return next(err);
      res.render('main/cart', {
        foundCart: foundCart,
        message: req.flash('remove')
      });
    });
});

/* SINGLE PRODUCT API */
router.post('/product/:productID', (req, res, next) => {
  Cart.findOne({ owner: req.user._id }, (err, cart) => {
    cart.items.push({
      item: req.body.productID,
      price: parseFloat(req.body.priceValue),
      quantity: parseInt(req.body.quantity)
    });

    cart.total = (cart.total + parseFloat(req.body.priceValue)).toFixed(2);

    cart.save()
    res.json({
      success: true,
      message: "Successfully added the item to the cart"
    });
  });
});

/* REMOVE PRODUCT FROM CART */
router.post('/remove', checkJWT, (req, res, next) => {
  Cart.findOne({ owner: req.user._id }, (err, foundCart) => {
    foundCart.items.pull(String(req.body.item));

    foundCart.total = (foundCart.total - parseFloat(req.body.price)).toFixed(2);
    foundCart.save()
    res.json({
      success: true,
      message: "Successfully pulled the item"
    });
  });
});

router.get('/page/:page', (req, res, next) => {
  paginate(req,res,next);
});

/* GET - GET CATEGORIES ITEMS */
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

/* GET - GET Single ITEM */
router.get('/product/:id', function(req, res, next) {
  Product.findById({ _id: req.params.id }, function(err, product) {
    if (err) return next(err);
    res.render('main/product', {
      product: product
    });
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

module.exports = router;
