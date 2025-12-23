const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const asyncHandler = require('express-async-handler');

// DASHBOARD STATS (MUST BE FIRST)
router.get('/stats/dashboard', asyncHandler(async (req, res) => {
  const totalProducts = await Product.countDocuments();
  const lowStockProducts = await Product.countDocuments({
    $expr: { $lte: ['$stock', '$minStock'] }
  });

  const stockValue = await Product.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        totalValue: { $sum: { $multiply: ['$stock', '$price'] } }
      }
    }
  ]);

  const categories = await Product.distinct('category');

  res.json({
    totalProducts,
    lowStockProducts,
    stockValue: stockValue[0]?.totalValue || 0,
    totalCategories: categories.length
  });
}));

// GET ALL PRODUCTS
router.get('/', asyncHandler(async (req, res) => {
  const products = await Product.find().sort({ updatedAt: -1 });
  res.json(products);
}));

// GET SINGLE PRODUCT
router.get('/:id', asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json(product);
}));

// CREATE PRODUCT
router.post('/', asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json(product);
}));

// UPDATE PRODUCT
router.put('/:id', asyncHandler(async (req, res) => {
  const updated = await Product.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(updated);
}));

// DELETE PRODUCT
router.delete('/:id', asyncHandler(async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: 'Product deleted' });
}));

module.exports = router;
