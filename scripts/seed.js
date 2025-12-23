// Seed script to populate MongoDB with sample data
// Run this script with: npm run seed

const mongoose = require('mongoose');
const seedData = require('../seedData');
require('dotenv').config();

// Import models
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Sale = require('../models/Sale');

async function seedDatabase() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://maryamtalibxd123_db_user:oRsyAC8c66S7ZlRv@cluster0.73tibgq.mongodb.net/smartstock?retryWrites=true&w=majority';
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Product.deleteMany({});
    console.log('🗑️  Cleared existing products');

    await Customer.deleteMany({});
    console.log('🗑️  Cleared existing customers');

    await Sale.deleteMany({});
    console.log('🗑️  Cleared existing sales');

    // Insert products and customers first
    const insertedProducts = await Product.insertMany(seedData.products);
    console.log(`✅ Inserted ${insertedProducts.length} products`);

    const insertedCustomers = await Customer.insertMany(seedData.customers);
    console.log(`✅ Inserted ${insertedCustomers.length} customers`);

    // Now create sales with proper references
    const salesData = seedData.sales.map((sale, index) => {
      const saleCopy = { ...sale };
      
      // Get customer ID (some sales have no customer - walk-in)
      if (sale.customer && sale.customer.name) {
        const customer = insertedCustomers.find(c => c.email === sale.customer.email);
        saleCopy.customer = customer ? customer._id : null;
      }
      
      // Get product IDs for items
      saleCopy.items = sale.items.map(item => {
        const product = insertedProducts.find(p => p.sku === item.product.sku);
        return {
          ...item,
          product: product ? product._id : null
        };
      });
      
      return saleCopy;
    });

    const insertedSales = await Sale.insertMany(salesData);
    console.log(`✅ Inserted ${insertedSales.length} sales`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log(`
Summary:
- Products: ${insertedProducts.length}
- Customers: ${insertedCustomers.length}
- Sales: ${insertedSales.length}
    `);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed script
seedDatabase();
