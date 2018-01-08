const express = require('express');
const JWT = require('jsonwebtoken');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const config 	   = require('./config');

const app = express();

/* Mongoose connected */
mongoose.connect(config.database, { useMongoClient: true }, (err) => {
  if (err) {
    console.log(err);
  } else {
    console.log("Connected to the database");
  }
});
// APP CONFIGURATION ==================
// ====================================

/* configure our app to handle CORS requests */
app.use(function(req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
	next();
});

/* Middleware */
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(morgan('dev'));


/* Routes */
const mainRoutes = require('./routes/main');
const userRoutes = require('./routes/account');
const productSearch = require('./routes/product-search');
const sellerRoutes = require('./routes/seller');

app.use('/api/accounts', userRoutes);
app.use('/api', mainRoutes);
app.use('/api/search', productSearch);
app.use('/api/seller', sellerRoutes);

app.listen(config.port, (err) => {
  console.log('Magic happens on port ' + config.port);
});
