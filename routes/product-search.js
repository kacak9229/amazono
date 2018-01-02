const router = require('express').Router();
const async = require('async');
const stripe = require('stripe') ('sk_test_RtVWGtHcykG3FyyNS1EGhbIq');

/* Models */
const User = require('../models/user');
const Product = require('../models/product');
const Order = require('../models/order');

/* Algolia Search */
const algoliasearch = require('algoliasearch');
const client = algoliasearch('CO3GNO6BHL', '3a4325e1bed03a2fa814393542dcbe61');
const index = client.initIndex('producttesting');

const checkJWT = require('../middlewares/check-jwt');

/* ALGOLIA SEARCH */


  router.get('/', (req, res, next) => {
    if (req.query.query) {
      index.search({
        query: req.query.query,
        page: req.query.page,
      }, (err, content) => {
        res.json({
          success: true,
          status: 200,
          content: content,
          search_result: req.query.query
        });
      })
    }
  })



module.exports = router
