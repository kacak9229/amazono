const jwt = require('jsonwebtoken');
const config = require('../config')

module.exports = function(req, res, next) {

  let token = req.headers["authorization"];
  // decode token
  if (token) {
    // verifies secret and checks exp
    jwt.verify(token, config.secret, function(err, decoded) {
      if (err) {
        return res.json({ success: false, message: 'Failed to authenticate token.' });
      } else {
        // if everything is good, save to request for use in other routes
        console.log(decoded);
        req.decoded = decoded;

        next();
      }
    });
  } else {
    // if there is no token
    // return an error
    return res.status(403).send({
        headers: req.headers,
        success: false,
        message: 'No token provided.'
    });
  }
}
