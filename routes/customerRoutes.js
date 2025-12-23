const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const asyncHandler = require('express-async-handler');

// DASHBOARD STATS
router.get('/stats/dashboard', asyncHandler(async (req, res) => {
  const totalCustomers = await Customer.countDocuments();
  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  const newCustomers = await Customer.countDocuments({
    createdAt: { $gte: monthAgo }
  });
  res.json({ totalCustomers, newCustomers });
}));

// GET ALL CUSTOMERS
router.get('/', asyncHandler(async (req, res) => {
  const customers = await Customer.find().sort({ updatedAt: -1 });
  res.json(customers);
}));

// GET SINGLE CUSTOMER
router.get('/:id', asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    res.status(404);
    throw new Error('Customer not found');
  }
  res.json(customer);
}));

// CREATE CUSTOMER
router.post('/', asyncHandler(async (req, res) => {
  const { name, email, phone } = req.body;

  if (!name || !email || !phone) {
    res.status(400);
    throw new Error('Name, email, and phone are required');
  }

  // Check if email already exists
  const existing = await Customer.findOne({ email });
  if (existing) {
    res.status(400);
    throw new Error('Customer with this email already exists');
  }

  const customer = await Customer.create(req.body);
  res.status(201).json(customer);
}));

// UPDATE CUSTOMER
router.put('/:id', asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    res.status(404);
    throw new Error('Customer not found');
  }

  Object.assign(customer, req.body);
  await customer.save();
  res.json(customer);
}));

// DELETE CUSTOMER
router.delete('/:id', asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    res.status(404);
    throw new Error('Customer not found');
  }
  await customer.remove();
  res.json({ message: 'Customer deleted successfully' });
}));

module.exports = router;
