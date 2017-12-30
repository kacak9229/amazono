const router = require('express').Router();
const async = require('async');
const stripe = require('stripe') ('sk_test_JF4CoY7UAKFnkwzNgh1NtXDV');

/* Models */
const User = require('../models/user');
const Product = require('../models/product');
const Order = require('../models/order');

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
router.get('/product/:id', (req, res, next) => {
  Product.findById({ _id: req.params.id }, function(err, product) {
    if (err) return next(err);
    res.json({
      product
    })
  });
});

/* PAYMENT METHOD STRIPE */
router.post('/payment', checkJWT, (req, res, next) => {
  console.log(req.body.stripeToken);
  var stripeToken = req.body.stripeToken;
  var currentCharges = Math.round(req.body.totalPrice * 100);
  stripe.customers.create({
    source: stripeToken.id,
  }).then(function(customer) {

    return stripe.charges.create({
      amount: currentCharges,
      currency: 'usd',
      customer: customer.id
    });

  }).then(function(charge) {
    const products = req.body.products;

    let order = new Order();
    order.owner = req.decoded.user._id;
    order.totalPrice = currentCharges;
    order.state = "Processing";

    products.map((product) => {

      order.products.push({
        product: product._id,
        quantity: product.quantity
      });
    });

    order.save();
    res.json({
      success: true,
      message: "Successfully made a payment"
    });

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
