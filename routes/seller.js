const router = require('express').Router()
const Product = require('../models/product');

const aws = require('aws-sdk')
const multer = require('multer');
const multerS3 = require('multer-s3')
const s3 = new aws.S3({ accessKeyId: 'AKIAIEXJ3IWGGSLED3DA', secretAccessKey: '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'})

const checkJWT = require('../middlewares/check-jwt');

/* UPLOAD TO S3 using Multer */
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'amazonov1',
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, Date.now().toString())
    }
  })
});

/* GET AND POST PRODUCTS - ADDING ITEM */
router.route('/products')
  .get(checkJWT, (req, res, next) => {

    Product
      .find({ owner: req.decoded.user._id })
      .populate('owner')
      .populate('category')
      .exec((err, products) => {
        if (products) {
          res.json({
            success: true,
            message: `${req.decoded.user.name}'s products`,
            products: products
          });
        }
      });
  })

  .post([checkJWT, upload.single('product_picture')], (req, res, next) => {
    let product = new Product;
    product.owner = req.decoded.user._id;
    product.category = req.body.categoryId;
    product.title = req.body.title;
    product.price = req.body.price;
    product.description = req.body.description;
    product.image = req.file.location;
    product.save()
    res.json({
      success: true,
      message: "Successfully added the product"
    });
  })

/* Remove all items own by owner */
router.get('/remove-products', checkJWT, (req, res, next) => {
  Product.find({ owner: req.decoded.user._id }).remove((err, result) => {
    res.json({
      message: "Successfully removed all the products"
    })
  });
})

/* Change product images */
router.get('/change-images', (req, res, next) => {
  Product.find({}, (err, products) => {
    products.map((product) => {
      product.image = "https://picsum.photos/250/?random";
      product.save();
    });

    res.json({
      message: "Successfully changed the images"
    })
  });
})

module.exports = router
