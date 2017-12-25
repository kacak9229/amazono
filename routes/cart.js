const router = require('express').Router();
const async = require('async');

/* Models */
const Cart = require('../models/cart');
const checkJWT = require('../middlewares/check-jwt');

/* GET- CART API */
router.get('/', checkJWT, (req, res, next) => {
  Cart
    .findOne({ owner: req.decoded._doc._id })
    .populate('items.item')
    .exec(function(err, foundCart) {
      if (err) return next(err);

      res.json({
        status: 200,
        cart : foundCart,
      });

    });
});

/* POST - ADDING ITEM TO THE CART */
router.post('/:productID', checkJWT, (req, res, next) => {
  Cart.findOne({ owner: req.decoded._doc._id }, (err, cart) => {
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

module.exports = router;
