const router = require('express').Router()

const aws = require('aws-sdk')
const multer = require('multer');
const multerS3 = require('multer-s3')
const s3 = new aws.S3({ accessKeyId: '13123123', secretAccessKey: '12312312123'})

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

/* POST - ADDING ITEM */
router.post('/add-item', [checkJWT, upload.single('product_picture')], (req, res, next) => {
  let product = new Product;
  product.category = req.body.categoryID;
  product.owner = req.decoded._doc._id;
  product.title = req.body.title;
  product.images.push(req.file.location);
  product.price = req.body.price;
  product.description = req.body.description;
  product.save()
  res.json({
    success: true,
    message: "Successfully added the product"
  });
});

module.exports = router
