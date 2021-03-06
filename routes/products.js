const express = require('express');
const { Product } = require('../models/product');
const { Category } = require('../models/category');
const { Order } = require('../models/order');
const { OrderItem } = require('../models/order-item');
const router = express.Router();
const mongoose = require('mongoose');
// const multer = require('multer');

// const FILE_TYPE_MAP = {
//     'image/png': 'png',
//     'image/jpeg': 'jpeg',
//     'image/jpg': 'jpg',
// };

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         const isValid = FILE_TYPE_MAP[file.mimetype];
//         let uploadError = new Error('invalid image type');

//         if (isValid) {
//             uploadError = null;
//         }
//         cb(uploadError, 'public/uploads');
//     },
//     filename: function (req, file, cb) {
//         const fileName = file.originalname.split(' ').join('-');
//         const extension = FILE_TYPE_MAP[file.mimetype];
//         cb(null, `${fileName}-${Date.now()}.${extension}`);
//     },
// });

// const uploadOptions = multer({ storage: storage });

router.get(`/`, async (req, res) => {
    let filter = {};
    if (req.query.categories) {
        filter = { category: req.query.categories.split(',') };
    }

    const productList = await Product.find(filter)
        .populate('category')
        .sort({ dateCreated: -1 });

    if (!productList) {
        res.status(500).json({ success: false });
    }
    res.send(productList);
});

router.get(`/:id`, async (req, res) => {
    const product = await Product.findById(req.params.id).populate('category');

    if (!product) {
        res.status(500).json({ success: false });
    }
    res.send(product);
});

router.post(`/` /*, uploadOptions.single('image')*/, async (req, res) => {
    const category = await Category.findById(req.body.category);
    if (!category) return res.status(400).send('Invalid Category');

    // const file = req.file;
    // if (!file) return res.status(400).send('No image in the request');

    // const fileName = file.filename;
    // const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

    let product = new Product({
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        // image: `${basePath}${fileName}`, // "http://localhost:3000/public/upload/image-2323232"
        images: req.body.images,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured,
        concentration: req.body.concentration,
        volume: req.body.volume,
        origin: req.body.origin,
    });

    product = await product.save();

    if (!product) return res.status(500).send('The product cannot be created');

    let result = await Product.findById(product._id).populate('category');

    res.send(result);
});

router.put('/:id' /*, uploadOptions.single('image')*/, async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send('Invalid Product Id');
    }
    const category = await Category.findById(req.body.category);
    if (!category) return res.status(400).send('Invalid Category');

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(400).send('Invalid Product!');

    // const file = req.file;
    // let imagepath;

    // if (file) {
    //     const fileName = file.filename;
    //     const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
    //     imagepath = `${basePath}${fileName}`;
    // } else {
    //     imagepath = product.image;
    // }

    const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            description: req.body.description,
            richDescription: req.body.richDescription,
            // image: imagepath,
            images: req.body.images,
            brand: req.body.brand,
            price: req.body.price,
            category: req.body.category,
            countInStock: req.body.countInStock,
            rating: req.body.rating,
            numReviews: req.body.numReviews,
            isFeatured: req.body.isFeatured,
            concentration: req.body.concentration,
            volume: req.body.volume,
            origin: req.body.origin,
        },
        { new: true }
    ).populate('category');

    if (!updatedProduct)
        return res.status(500).send('the product cannot be updated!');

    res.send(updatedProduct);
});

router.delete('/:id', async (req, res) => {
    const orders = await Order.find({});
    const ordersFiltered = orders.filter((i) => i.status !== 'Cancel');
    // let result = await Promise.all(
    //     ordersFiltered.map(async (orders) => {
    //         return await orders.orderItems.map(async (orderItem) => {
    //             const item = await OrderItem.findById(orderItem);
    //             return { isMatch: item.product.toString() === req.params.id };
    //         });
    //     })
    // );

    let find = false;

    for (let i = 0; i < ordersFiltered.length; i++) {
        const orders = ordersFiltered[i].orderItems;
        for (let j = 0; j < orders.length; j++) {
            const element = orders[j];
            const item = await OrderItem.findById(element);
            if (item.product.toString() === req.params.id) find = true;
        }
    }

    if (find) return res.status(500).send();

    Product.findByIdAndRemove(req.params.id)
        .then((product) => {
            if (product) {
                return res.status(200).json({
                    success: true,
                    message: 'the product is deleted!',
                });
            } else {
                return res.status(404).json({
                    success: false,
                    message: 'product not found!',
                });
            }
        })
        .catch((err) => {
            return res.status(500).json({ success: false, error: err });
        });
});

router.get(`/get/count`, async (req, res) => {
    const productCount = await Product.countDocuments((count) => count);

    if (!productCount) {
        res.status(500).json({ success: false });
    }
    res.send({
        productCount: productCount,
    });
});

router.get(`/get/featured/:count`, async (req, res) => {
    const count = req.params.count ? req.params.count : 0;
    const products = await Product.find({ isFeatured: true }).limit(+count);

    if (!products) {
        res.status(500).json({ success: false });
    }
    res.send(products);
});

// router.put(
//     '/gallery-images/:id',
//     uploadOptions.array('images', 10),
//     async (req, res) => {
//         if (!mongoose.isValidObjectId(req.params.id)) {
//             return res.status(400).send('Invalid Product Id');
//         }
//         const files = req.files;
//         let imagesPaths = [];
//         const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

//         if (files) {
//             files.map((file) => {
//                 imagesPaths.push(`${basePath}${file.filename}`);
//             });
//         }

//         const product = await Product.findByIdAndUpdate(
//             req.params.id,
//             {
//                 images: imagesPaths,
//             },
//             { new: true }
//         );

//         if (!product)
//             return res.status(500).send('the gallery cannot be updated!');

//         res.send(product);
//     }
// );

module.exports = router;
