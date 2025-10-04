const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const Template = require('../src/models/Template');
const Order = require('../src/models/Order');

async function reset() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI is not set in api/.env');
    process.exit(1);
  }

  await mongoose.connect(uri);

  // Remove seeded templates (those with pcmDesignId starting with 'tpl-')
  const tRes = await Template.deleteMany({ pcmDesignId: /^tpl-/ });
  console.log('Deleted templates:', tRes.deletedCount);

  // Remove demo order
  const oRes = await Order.deleteMany({ externalReference: 'demo-order-001' });
  console.log('Deleted demo orders:', oRes.deletedCount);

  console.log('Reset complete');
  process.exit(0);
}

reset().catch((err) => {
  console.error('Reset failed', err);
  process.exit(1);
});
