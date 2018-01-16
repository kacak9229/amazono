const router = require('express').Router();
const async = require('async');
const stripe = require('stripe') ('sk_test_JF4CoY7UAKFnkwzNgh1NtXDV');

/* Models */
const User = require('../models/user');
const Product = require('../models/product');
const Order = require('../models/order');
const Review = require('../models/review');

/* To be removed */
const Category = require('../models/category');
const checkJWT = require('../middlewares/check-jwt');

/* TO BE DELETED */
const faker = require('faker');

/* PAGINATION FUNCTION */
function paginate(req, res, next) {

  const perPage = 10;
  var page = req.query.page;

  Product
    .find()
    .skip( perPage * page)
    .limit( perPage )
    .populate('category')
    .populate('owner')
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
router.get('/products', (req, res, next) => {
  paginate(req, res, next);
});

// /* Pagination */
// router.get('/page/:page', (req, res, next) => {
//   paginate(req,res,next);
// });

/* GET - CATEGORIES ITEMS */
router.get('/categories/:id', (req, res, next) => {
  const perPage = 10;
  var page = req.query.page;
  async.waterfall([
    function(callback) {
      Product.find({ category: req.params.id }, (err, products) => {
        var totalProducts = products.length;
        callback(err, totalProducts);
      })
    },
    function(totalProducts, callback) {
      Product
        .find({ category: req.params.id })
        .skip( perPage * page)
        .limit( perPage )
        .populate('category')
        .populate('owner')
        .populate('reviews')
        .exec((err, products) => {

          if (err) return next(err);
          Product.count().exec((err, count) => {
            if (err) return next(err);
            res.json({
              success: true,
              message: `category`,
              products: products,
              categoryName: products[0].category.name,
              totalProducts: totalProducts,
              pages: Math.ceil(count / perPage)
            })
          });
        });
    }
  ])
});


/* Testing */
router.get('/categories', (req, res, next) => {
  Category.find({}, (err, categories) => {
    res.json({
      success: true,
      categories: categories
    });
  });
});

/* GET - Single Product */
router.get('/product/:id', (req, res, next) => {

  Product
    .findById({ _id: req.params.id })
    .populate('category')
    .populate('owner')
    .deepPopulate('reviews.owner')
    .exec((err, product) => {
      if (err) {
        res.json({
          success: false,
          message: "Product is not found"
        })
      } else {
        if (product) {
          res.json({
            success: true,
            product: product
          })
        }
      }
    });

});

/* PAYMENT METHOD STRIPE */
router.post('/payment', checkJWT, (req, res, next) => {
  console.log(req.body);
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
        product: product.product,
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

/* POST - Reviews */
router.post('/review', checkJWT, (req, res, next) => {

  async.waterfall([
    function(callback) {
      console.log(req.body);
      Product.findOne({ _id: req.body.productId }, (err, product) => {
        if (product) {

          callback(err, product);
        }
      })
    },
    function(product) {

      let review = new Review();
      review.owner = req.decoded.user._id;

      if (req.body.title) review.title = req.body.title;
      if (req.body.description) review.description = req.body.description;
      review.rating = req.body.rating;

      product.reviews.push(review._id);
      product.save();
      review.save();
      res.json({
        success: true,
        message: "Successfully added the review"
      });
    }
  ])

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
