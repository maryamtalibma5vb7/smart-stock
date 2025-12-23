const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const asyncHandler = require('express-async-handler');

// Get sales trend data
router.get('/sales-trend', asyncHandler(async (req, res) => {
  const { days = 7 } = req.query;
  const data = [];
  const labels = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const sales = await Sale.find({
      saleDate: { $gte: start, $lte: end }
    });

    const total = sales.reduce((sum, sale) => sum + sale.total, 0);
    data.push(total);
    labels.push(date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    }));
  }

  res.json({ labels, data });
}));

// Get sales by category
router.get('/sales-by-category', asyncHandler(async (req, res) => {
  const sales = await Sale.find().populate('items.product', 'category');
  
  const categorySales = {};
  
  sales.forEach(sale => {
    sale.items.forEach(item => {
      if (item.product && item.product.category) {
        const category = item.product.category;
        categorySales[category] = (categorySales[category] || 0) + item.subtotal;
      }
    });
  });

  const labels = Object.keys(categorySales);
  const data = Object.values(categorySales);

  res.json({ labels, data });
}));

// Get top products
router.get('/top-products/:limit?', asyncHandler(async (req, res) => {
  const limit = parseInt(req.params.limit) || 10;
  
  const sales = await Sale.find().populate('items.product', 'name sku price');
  
  const productSales = {};
  
  sales.forEach(sale => {
    sale.items.forEach(item => {
      if (item.product) {
        const productId = item.product._id;
        if (!productSales[productId]) {
          productSales[productId] = {
            product: item.product,
            totalQuantity: 0,
            totalRevenue: 0
          };
        }
        productSales[productId].totalQuantity += item.quantity;
        productSales[productId].totalRevenue += item.subtotal;
      }
    });
  });

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, limit)
    .map(item => ({
      name: item.product.name,
      sku: item.product.sku,
      totalQuantity: item.totalQuantity,
      totalRevenue: item.totalRevenue,
      profitMargin: ((item.totalRevenue - (item.totalQuantity * item.product.price * 0.6)) / item.totalRevenue * 100).toFixed(1)
    }));

  res.json(topProducts);
}));

// Get inventory health report
router.get('/inventory-health', asyncHandler(async (req, res) => {
  const products = await Product.find({ isActive: true });
  
  const totalProducts = products.length;
  const lowStockCount = products.filter(p => p.stock <= p.minStock && p.stock > 0).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;
  const healthyCount = totalProducts - lowStockCount - outOfStockCount;

  res.json({
    totalProducts,
    lowStockCount,
    outOfStockCount,
    healthyCount,
    healthPercentage: ((healthyCount / totalProducts) * 100).toFixed(1)
  });
}));

// Get customer insights
router.get('/customer-insights', asyncHandler(async (req, res) => {
  const customers = await Customer.find();
  const sales = await Sale.find().populate('customer');
  
  const totalCustomers = customers.length;
  const vipCustomers = customers.filter(c => c.loyaltyPoints >= 500).length;
  
  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  const newCustomers = customers.filter(c => c.createdAt > monthAgo).length;

  // Top customer by total spent
  const topCustomer = customers.length > 0 ? 
    customers.reduce((max, customer) => 
      customer.totalSpent > max.totalSpent ? customer : max
    ) : null;

  res.json({
    totalCustomers,
    vipCustomers,
    newCustomers,
    topCustomer: topCustomer ? {
      name: topCustomer.name,
      totalSpent: topCustomer.totalSpent,
      loyaltyPoints: topCustomer.loyaltyPoints
    } : null
  });
}));

// Export data
router.get('/export/:type', asyncHandler(async (req, res) => {
  const { type } = req.params;
  let data = [];

  switch (type) {
    case 'products':
      data = await Product.find();
      break;
    case 'customers':
      data = await Customer.find();
      break;
    case 'sales':
      data = await Sale.find()
        .populate('customer', 'name email')
        .populate('items.product', 'name sku');
      break;
    default:
      return res.status(400).json({ message: 'Invalid export type' });
  }

  // Convert to CSV format
  const csvData = convertToCSV(data);
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=${type}-export.csv`);
  res.send(csvData);
}));

// Helper function to convert data to CSV
function convertToCSV(data) {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0].toObject ? data[0].toObject() : data[0]);
  const rows = data.map(item => {
    const obj = item.toObject ? item.toObject() : item;
    return headers.map(header => {
      let value = obj[header];
      if (value && typeof value === 'object') {
        value = JSON.stringify(value);
      }
      return `"${value}"`;
    }).join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

module.exports = router;