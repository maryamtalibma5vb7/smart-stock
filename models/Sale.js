const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  }
});

const saleSchema = new mongoose.Schema({
  saleNumber: {
    type: String,
    required: true,
    unique: true
  },
  saleDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  items: [saleItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['Cash', 'Credit Card', 'Debit Card', 'Check', 'Gift Card', 'Other']
  },
  paymentStatus: {
    type: String,
    default: 'Paid',
    enum: ['Paid', 'Pending', 'Cancelled']
  },
  staffMember: {
    type: String,
    required: true,
    trim: true
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate sale number before validation so "required" validation doesn't fail
saleSchema.pre('validate', async function(next) {
  if (!this.saleNumber) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const startOfNextDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

    const count = await mongoose.models.Sale.countDocuments({
      saleDate: { $gte: startOfDay, $lt: startOfNextDay }
    });

    this.saleNumber = `SALE-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Sale', saleSchema);