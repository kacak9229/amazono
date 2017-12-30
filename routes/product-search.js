const router = require('express').Router();
const async = require('async');
const stripe = require('stripe') ('sk_test_RtVWGtHcykG3FyyNS1EGhbIq');

/* Models */
const User = require('../models/user');
const Product = require('../models/product');
const Order = require('../models/order');

/* Algolia Search */
const algoliasearch = require('algoliasearch');
const client = algoliasearch('something', 'something2');
const index = client.initIndex('producttesting');

const checkJWT = require('../middlewares/check-jwt');

/* ALGOLIA SEARCH */
router.route('/')
  .get((req, res, next) => {
    if (req.query.q) {
      index.search(req.query.q, (err, content) => {
        res.json({
          success: true,
          status: 200,
          content: content,
          search_result: req.query.q
        });
      });
    }
  });


module.exports = router
