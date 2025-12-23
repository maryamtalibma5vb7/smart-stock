const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const asyncHandler = require('express-async-handler');

/* =========================
   GET ALL SALES
========================= */
router.get('/', asyncHandler(async (req, res) => {
  const sales = await Sale.find()
    .populate('customer', 'name email')
    .populate('items.product', 'name price')
    .sort({ saleDate: -1 });

  res.json(sales);
}));

/* =========================
   CREATE SALE
========================= */
router.post('/', asyncHandler(async (req, res) => {
  const {
    items,
    customer,
    staffMember,
    paymentMethod,
    tax = 0,
    discount = 0,
    notes
  } = req.body;

  // Validation
  if (!Array.isArray(items) || items.length === 0) {
    res.status(400);
    throw new Error('Items array is required');
  }

  if (!staffMember || !paymentMethod) {
    res.status(400);
    throw new Error('Staff member and payment method are required');
  }

  let subtotal = 0;
  const saleItems = [];

  for (const item of items) {
    const productId = item.productId || item.product; // support old key

    if (!productId || !item.quantity) {
      res.status(400);
      throw new Error('Each item must have productId and quantity');
    }

    const product = await Product.findById(productId);
    if (!product) {
      res.status(404);
      throw new Error(`Product not found`);
    }

    if (product.stock < item.quantity) {
      res.status(400);
      throw new Error(`Insufficient stock for ${product.name}`);
    }

    const unitPrice = item.unitPrice ?? product.price; // use product price if not provided
    const itemSubtotal = unitPrice * item.quantity;
    subtotal += itemSubtotal;

    saleItems.push({
      product: product._id,
      quantity: item.quantity,
      unitPrice,
      subtotal: itemSubtotal
    });

    product.stock -= item.quantity;
    await product.save();
  }

  const total = subtotal + tax - discount;

  const sale = new Sale({
    customer: customer || null,
    items: saleItems,
    subtotal,
    tax,
    discount,
    total,
    paymentMethod,
    staffMember,
    notes
  });

  await sale.save();

  // Update customer loyalty
  if (customer) {
    const customerDoc = await Customer.findById(customer);
    if (customerDoc) {
      customerDoc.totalSpent = (customerDoc.totalSpent || 0) + total;
      customerDoc.loyaltyPoints = (customerDoc.loyaltyPoints || 0) + Math.floor(total / 10);
      await customerDoc.save();
    }
  }

  // Return populated sale
  const populatedSale = await Sale.findById(sale._id)
    .populate('customer', 'name email')
    .populate('items.product', 'name price');

  res.status(201).json(populatedSale);
}));

module.exports = router;
