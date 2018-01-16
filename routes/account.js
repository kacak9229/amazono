const bodyParser = require('body-parser'); 	// get body-parser
const jwt        = require('jsonwebtoken');
const async      = require('async');
const config     = require('../config');
const checkJWT = require('../middlewares/check-jwt');
/* MODELS */
const User       = require('../models/user');
const Order = require('../models/order');
const Review = require('../models/review');
const superSecret = config.secret;
const router = require('express').Router()


/* LOGIN ROUTE */
router.post('/login', (req, res, next) => {
	  // find the user

    User.findOne({ email: req.body.email }, (err, user) => {


	    if (err) throw err;

	    // no user with that username was found
	    if (!user) {
	      res.json({
	      	success: false,
	      	message: 'Authentication failed. User not found.'
	    	});
	    } else if (user) {

	      // check if password matches
	      var validPassword = user.comparePassword(req.body.password);
	      if (!validPassword) {
	        res.json({
	        	success: false,
	        	message: 'Authentication failed. Wrong password.'
	      	});
	      } else {

	        // if user is found and password is right
	        // create a token
	        var token = jwt.sign({
	        	user: user
	        }, superSecret, {
	          expiresIn: '24h' // expires in 24 hours
	        });

	        // return the information including token as JSON
	        res.json({
	          success: true,
	          message: 'Enjoy your token!',
	          token: token
	        });
	      }
	    }
	  });
	});


/* SIGNUP ROUTE */
router.post('/signup', (req, res, next) => {

    var user = new User();
    user.name = req.body.name;
    user.email = req.body.email;
    user.password = req.body.password;
    user.picture = user.gravatar();

    User.findOne({ email: req.body.email }, (err, existingUser) => {

      if (existingUser) {

        res.json({
          success: false,
          message: 'Account with that email is already exist',
        });

      } else {

        user.save(function(err, user) {
          if (err) return next(err);
          var token = jwt.sign({
	        	user: user
	        }, superSecret, {
	          expiresIn: '24h' // expires in 24 hours
	        });

	        // return the information including token as JSON
	        res.json({
	          success: true,
	          message: 'Enjoy your token!',
	          token: token
	        });
        });

      }
    });
});

router.route('/profile')
  /* GET - EDIT PROFILE */
  .get(checkJWT, (req, res, next) => {
    User.findOne({ _id: req.decoded.user._id }, (err, user) => {
      res.json({
        user: user,
        message: "Successful"
      });
    })

  })
  /* POST - EDIT PROFILE */
  .post(checkJWT, (req, res, next) => {
    User.findOne({ _id: req.decoded.user._id }, function(err, user) {

      if (err) return next(err);

      if (req.body.name) user.name = req.body.name;
      if (req.body.email) user.email = req.body.email;
      if (req.body.password) user.password = req.body.password;

      user.isSeller = req.body.isSeller;

      user.save()
      res.json({
        success: true,
        message: "Successfully edited your profile"
      });
    });
  });

  router.route('/address')
    /* GET - EDIT PROFILE */
    .get(checkJWT, (req, res, next) => {
      User.findOne({ _id: req.decoded.user._id }, (err, user) => {
        res.json({
          address: user.address,
          message: "Successful"
        });
      });

    })
    /* POST - EDIT PROFILE */
    .post(checkJWT, (req, res, next) => {
      User.findOne({ _id: req.decoded.user._id }, function(err, user) {

        if (err) return next(err);
        console.log(user);
        if (req.body.addr1) user.address.addr1 = req.body.addr1;
        if (req.body.addr2) user.address.addr2 = req.body.addr2;
        if (req.body.city) user.address.city = req.body.city;
        if (req.body.state) user.address.state = req.body.state;
        if (req.body.country) user.address.country = req.body.country;
        if (req.body.postalCode) user.address.postalCode = req.body.postalCode;

        user.save()
        res.json({
          success: true,
          message: "Successfully edited your address",
        });
      });
    });


  /* GET - orders */
  router.get('/orders', checkJWT, (req, res, next) => {

    Order
    .find({ owner: req.decoded.user._id })
    .populate('products.product')
    .populate('owner')
    .exec((err, orders) => {
      if (err) {
        res.json({
          success: false,
          message: 'Couldn\'t find your order'
        });
      } else {
        res.json({
          success: true,
          message: "Found your order",
          orders: orders
        });
      }
    });
  });

  router.get('/orders/:id', checkJWT, (req, res, next) => {

    Order
    .findOne({ _id: req.params.id })
    .deepPopulate('products.product.owner')
    .populate('owner')
    .exec((err, order) => {
      if (err) {
        res.json({
          success: false,
          message: 'Couldn\'t find your orders'
        });
      } else {
        res.json({
          success: true,
          message: "Found your orders",
          order: order
        });
      }

    });
  });


  router.get('/all-orders', (req, res, next) => {
    Order.find({})
    .populate('products.product')
    .exec((err, orders) => {
      if (err) {
        res.json({
          success: false,
          message: 'Couldn\'t find your order'
        });
      } else {
        res.json({
          success: true,
          message: "Found your orders!",
          orders: orders
        });
      }
    });
  });




module.exports = router;
