const bodyParser = require('body-parser'); 	// get body-parser
const jwt        = require('jsonwebtoken');
const async      = require('async');
const config     = require('../config');
const checkJWT = require('../middlewares/check-jwt');
/* MODELS */
const User       = require('../models/user');
const Cart = require('../models/cart');
const superSecret = config.secret;
const router = require('express').Router()


/* LOGIN ROUTE */
router.post('/login', (req, res, next) => {

	  // find the user
	  User.findOne({
	    email: req.body.email
	  }).select('name password').exec((err, user) => {

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

  async.waterfall([
    function(callback) {

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
            callback(null, user);
          });

        }
      });
    },

    function(user) {
      let cart = new Cart();
      cart.owner = user._id;
      cart.save()

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
  ]);
});

router.route('/profile')
  /* GET - EDIT PROFILE */
  .get(checkJWT, (req, res, next) => {
    console.log(req.decoded);
    res.json({
      user: req.decoded,
      message: "Successful"
    });
  })
  /* POST - EDIT PROFILE */
  .post((req, res, next) => {
    User.findOne({ _id: req.decoded._doc._id }, function(err, user) {

      if (err) return next(err);

      if (req.body.name) user.name = req.body.name;
      if (req.body.email) user.email = req.body.email;
      if (req.body.address) user.address = req.body.address;
      if (req.body.password) user.password = req.body.password;

      user.save()
      res.json({

        success: true,
        message: "Successfully edited your profile"
      });
    });
  });

  router.route('/address', checkJWT)
    /* GET - EDIT PROFILE */
    .get((req, res, next) => {
      res.json({
        user: req.decoded._doc
      });
    })
    /* POST - EDIT PROFILE */
    .post((req, res, next) => {
      User.findOne({ _id: req.decoded._doc._id }, function(err, user) {

        if (err) return next(err);

        if (req.body.addr1) user.address.addr1 = req.body.addr1;
        if (req.body.addr2) user.address.addr2 = req.body.addr2;
        if (req.body.city) user.address.city = req.body.city;
        if (req.body.state) user.address.state = req.body.state;
        if (req.body.country) user.address.country = req.body.country;

        user.save()
        res.json({
          success: true,
          message: "Successfully edited your profile"
        });
      });
    });






module.exports = router;
