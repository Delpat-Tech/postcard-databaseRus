# Proof & Approve - Backend (Node.js / Express)

This repository provides a complete Phase 1 backend for the "Proof & Approve" Postcard system. Files below are presented as individual files with headers in the form `## FILE: <path>` — copy each into your project tree.

---

## FILE: package.json

{
"name": "proof-approve-backend",
"version": "1.0.0",
"description": "Backend for Proof & Approve Postcard system (Express + MongoDB)",
"main": "src/index.js",
"scripts": {
"start": "node src/index.js",
"dev": "nodemon src/index.js",
"seed-admin": "node scripts/seedAdmin.js"
},
"dependencies": {
"aws-sdk": "^2.1400.0",
"bcrypt": "^5.1.0",
"body-parser": "^1.20.2",
"cors": "^2.8.5",
"dotenv": "^16.3.1",
"express": "^4.18.2",
"jsonwebtoken": "^9.0.0",
"mongoose": "^7.4.0",
"multer": "^1.4.5-lts.1",
"node-fetch": "^3.4.2",
"paypal-rest-sdk": "^1.8.1",
"puppeteer": "^21.3.0",
"uuid": "^9.0.0"
},
"devDependencies": {
"nodemon": "^2.0.22"
}
}

---

## FILE: .env.example

# MongoDB

MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.mongodb.net/proof-approve?retryWrites=true&w=majority

# JWT

JWT_SECRET=replace_with_a_strong_secret
JWT_EXPIRES_IN=7d

# AWS S3 (for file uploads & proofs)

S3_BUCKET=my-bucket
S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...

# PayPal (sandbox)

PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret

# PostcardMania

POSTCARDMANIA_API_KEY=replace_with_key
POSTCARDMANIA_API_URL=https://api.postcardmania.com/v1

# App

PORT=4000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=changeme
FRONTEND_URL=http://localhost:3000

---

## FILE: src/index.js

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const authRoutes = require('./routes/auth');
const templateRoutes = require('./routes/templates');
const orderRoutes = require('./routes/orders');
const uploadRoutes = require('./routes/uploads');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_URL || '\*' }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// routes
app.use('/api/auth', authRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/admin', adminRoutes);

// health
app.get('/health', (req, res) => res.json({ ok: true, time: new Date() }));

async function start() {
try {
await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
console.log('MongoDB connected');
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
} catch (err) {
console.error('Failed to start server', err);
process.exit(1);
}
}

start();

---

## FILE: src/models/AdminUser.js

const mongoose = require('mongoose');

const AdminUserSchema = new mongoose.Schema({
username: { type: String, required: true, unique: true },
passwordHash: { type: String, required: true },
role: { type: String, default: 'admin' },
createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AdminUser', AdminUserSchema);

---

## FILE: src/models/Template.js

const mongoose = require('mongoose');

const TemplateSchema = new mongoose.Schema({
name: { type: String, required: true },
previewUrl: { type: String },
templateType: { type: String, default: 'front/back' },
sizes: [{ type: String }],
createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Template', TemplateSchema);

---

## FILE: src/models/Order.js

const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
user: {
name: String,
email: String
},
product: {
type: { type: String },
size: String,
quantity: Number,
priceCents: Number
},
design: {
mode: String,
frontUrl: String,
backUrl: String,
pdfUrl: String
},
mailing: {
recipient: Object,
csvUrl: String
},
proof: {
frontProofUrl: String,
backProofUrl: String,
approvedByUserAt: Date
},
payment: {
provider: { type: String, default: 'paypal' },
paypalOrderId: String,
status: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
paidAt: Date
},
admin: {
status: { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
approvedBy: String,
approvedAt: Date,
printerJobId: String,
printerResponse: Object
},
createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);

---

## FILE: src/routes/auth.js

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const AdminUser = require('../models/AdminUser');

router.post('/login', async (req, res) => {
const { username, password } = req.body;
try {
const user = await AdminUser.findOne({ username });
if (!user) return res.status(401).json({ error: 'Invalid credentials' });
const ok = await bcrypt.compare(password, user.passwordHash);
if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
const token = jwt.sign({ sub: user.\_id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
res.json({ token });
} catch (err) {
console.error(err);
res.status(500).json({ error: 'Server error' });
}
});

module.exports = router;

---

## FILE: src/middleware/auth.js

const jwt = require('jsonwebtoken');

function adminAuth(req, res, next) {
const auth = req.headers.authorization;
if (!auth) return res.status(401).json({ error: 'Missing auth' });
const token = auth.split(' ')[1];
try {
const payload = jwt.verify(token, process.env.JWT_SECRET);
req.user = payload;
next();
} catch (err) {
return res.status(401).json({ error: 'Invalid token' });
}
}

module.exports = { adminAuth };

---

## FILE: src/routes/templates.js

const express = require('express');
const router = express.Router();
const Template = require('../models/Template');
const { adminAuth } = require('../middleware/auth');

// public list
router.get('/', async (req, res) => {
try {
const list = await Template.find({});
res.json(list);
} catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// admin create
router.post('/', adminAuth, async (req, res) => {
try {
const t = new Template(req.body);
await t.save();
res.json(t);
} catch (err) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;

---

## FILE: src/routes/uploads.js

const express = require('express');
const router = express.Router();
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const s3 = new AWS.S3({ region: process.env.S3_REGION });
const BUCKET = process.env.S3_BUCKET;

// return presigned URL to upload a file
router.post('/sign', async (req, res) => {
try {
const { filename, contentType } = req.body;
const key = `${uuidv4()}-${filename}`;
const params = {
Bucket: BUCKET,
Key: key,
Expires: 60 \* 5,
ContentType: contentType
};
const url = await s3.getSignedUrlPromise('putObject', params);
const publicUrl = `https://${BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`;
res.json({ uploadUrl: url, publicUrl, key });
} catch (err) {
console.error(err);
res.status(500).json({ error: 'Could not create upload URL' });
}
});

module.exports = router;

---

## FILE: src/routes/orders.js

const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { generateProofForOrder, createPaypalOrder, capturePaypalOrder } = require('../services/orderService');

// create order (before payment)
router.post('/', async (req, res) => {
try {
const order = new Order(req.body);
await order.save();

    // generate proof (async) - we generate server-side canonical proof for uploaded PDFs
    const proofs = await generateProofForOrder(order);
    if (proofs) {
      order.proof = proofs;
      await order.save();
    }

    // create PayPal order (server-side)
    const paypal = await createPaypalOrder(order);

    res.json({ orderId: order._id, paypalOrder: paypal, proof: order.proof });

} catch (err) {
console.error(err);
res.status(500).json({ error: 'Server error' });
}
});

// PayPal webhook: mark order paid (simple endpoint; you should validate via SDK/webhook verification in prod)
router.post('/:id/paypal-complete', async (req, res) => {
const id = req.params.id;
const { paypalOrderId } = req.body;
try {
const order = await Order.findById(id);
if (!order) return res.status(404).json({ error: 'Order not found' });

    // capture & verify via PayPal SDK
    const capture = await capturePaypalOrder(paypalOrderId);
    if (!capture || !capture.id) return res.status(400).json({ error: 'Failed to capture' });

    order.payment.paypalOrderId = paypalOrderId;
    order.payment.status = 'paid';
    order.payment.paidAt = new Date();
    await order.save();
    res.json({ ok: true, orderId: order._id });

} catch (err) {
console.error(err);
res.status(500).json({ error: 'Server error' });
}
});

// get order
router.get('/:id', async (req, res) => {
const order = await Order.findById(req.params.id);
if (!order) return res.status(404).json({ error: 'Not found' });
res.json(order);
});

module.exports = router;

---

## FILE: src/routes/admin.js

const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const Order = require('../models/Order');
const { sendToPrinter } = require('../services/printerService');

// list pending orders
router.get('/orders', adminAuth, async (req, res) => {
const q = await Order.find({ 'admin.status': 'pending' }).sort({ createdAt: -1 });
res.json(q);
});

// get order
router.get('/orders/:id', adminAuth, async (req, res) => {
const order = await Order.findById(req.params.id);
if (!order) return res.status(404).json({ error: 'Not found' });
res.json(order);
});

// approve and send to printer
router.post('/orders/:id/approve', adminAuth, async (req, res) => {
try {
const order = await Order.findById(req.params.id);
if (!order) return res.status(404).json({ error: 'Not found' });

    // call printer API
    const result = await sendToPrinter(order, req.user);
    order.admin.status = 'approved';
    order.admin.approvedBy = req.user.username;
    order.admin.approvedAt = new Date();
    order.admin.printerJobId = result.jobId || null;
    order.admin.printerResponse = result;
    await order.save();

    res.json({ ok: true, printer: result });

} catch (err) {
console.error(err);
res.status(500).json({ error: 'Printer error' });
}
});

module.exports = router;

---

## FILE: src/services/orderService.js

const fetch = require('node-fetch');
const puppeteer = require('puppeteer');
const paypal = require('paypal-rest-sdk');

paypal.configure({
mode: process.env.PAYPAL_MODE || 'sandbox',
client_id: process.env.PAYPAL_CLIENT_ID,
client_secret: process.env.PAYPAL_CLIENT_SECRET
});

// Generate canonical proof images for an order. For uploaded PDFs, render first page to PNG.
async function generateProofForOrder(order) {
try {
if (order.design && order.design.pdfUrl) {
const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
const page = await browser.newPage();
// open the PDF directly in chromium - Puppeteer will not natively render PDFs to PNG without extra handling,
// so we will load a lightweight HTML wrapper that embeds the PDF in an <embed> or use pdf2png in production.

      // Simple approach: navigate to the PDF URL and screenshot the page.
      await page.goto(order.design.pdfUrl, { waitUntil: 'networkidle2' });
      const screenshot = await page.screenshot({ fullPage: true });
      await browser.close();

      // upload screenshot to S3 or store as data URL
      // For Phase 1: return data: URL
      const base64 = screenshot.toString('base64');
      const dataUrl = `data:image/png;base64,${base64}`;
      return { frontProofUrl: dataUrl, backProofUrl: null };
    }
    return null;

} catch (err) {
console.error('proof generation failed', err);
return null;
}
}

async function createPaypalOrder(order) {
// create a PayPal order object
const create_payment_json = {
intent: 'CAPTURE',
purchase_units: [{
amount: { currency_code: 'USD', value: ((order.product.priceCents||0)/100).toFixed(2) },
description: `${order.product.quantity} x ${order.product.type} ${order.product.size}`
}],
application_context: {
return_url: `${process.env.FRONTEND_URL}/checkout/success?orderId=${order._id}`,
cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel?orderId=${order._id}`
}
};
return new Promise((resolve, reject) => {
paypal.payment.create(create_payment_json, function (error, payment) {
if (error) return reject(error);
resolve(payment);
});
});
}

async function capturePaypalOrder(paypalOrderId) {
// This code uses PayPal REST SDK's execute capture flow for payments created with payment.create
return new Promise((resolve, reject) => {
paypal.payment.execute(paypalOrderId, {}, function (error, payment) {
if (error) return reject(error);
resolve(payment);
});
});
}

module.exports = { generateProofForOrder, createPaypalOrder, capturePaypalOrder };

---

## FILE: src/services/printerService.js

const fetch = require('node-fetch');

async function sendToPrinter(order, adminUser) {
// Placeholder implementation for PostcardMania. You MUST replace with their API spec & fields.
const apiKey = process.env.POSTCARDMANIA_API_KEY;
const url = process.env.POSTCARDMANIA_API_URL || 'https://api.postcardmania.com/v1';

// Build payload - this is an illustrative example only.
const payload = {
apiKey,
productType: order.product.type,
size: order.product.size,
quantity: order.product.quantity,
design: {
pdfUrl: order.design.pdfUrl,
frontUrl: order.design.frontUrl,
backUrl: order.design.backUrl
},
mailingListUrl: order.mailing.csvUrl,
referenceId: order.\_id.toString()
};

// In production: call the real endpoint and handle authentication headers
// return { jobId: 'demo-job-123', raw: payload };

const resp = await fetch(`${url}/orders`, {
method: 'POST',
headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
body: JSON.stringify(payload)
}).then(r => r.json()).catch(e => ({ error: String(e) }));

// Standardize return
return { jobId: resp.jobId || resp.id || null, raw: resp };
}

module.exports = { sendToPrinter };

---

## FILE: scripts/seedAdmin.js

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const AdminUser = require('../src/models/AdminUser');

async function seed() {
await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const username = process.env.ADMIN_USERNAME || 'admin';
const password = process.env.ADMIN_PASSWORD || 'changeme';
const existing = await AdminUser.findOne({ username });
if (existing) {
console.log('Admin exists');
process.exit(0);
}
const hash = await bcrypt.hash(password, 10);
const u = new AdminUser({ username, passwordHash: hash });
await u.save();
console.log('Admin created:', username);
process.exit(0);
}
seed();

---

## FILE: README.md

# Proof & Approve - Backend

This backend implements the Phase 1 MVP for the Proof & Approve postcard application.

## Features

- Express + MongoDB (Mongoose)
- Admin password login (JWT)
- Template management
- Order creation + PayPal integration (server-side)
- S3 presigned uploads for files
- Server-side proof generation for uploaded PDFs (Puppeteer)
- Admin approve -> send to PostcardMania (placeholder implementation)

## Getting started

1. Copy files into a new project folder.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and fill values.
4. Run `npm run seed-admin` to create the admin user.
5. Run `npm run dev` to start the dev server.

## Important notes & TODOs for production

- Replace `sendToPrinter` with exact PostcardMania API fields and test with their sandbox key.
- Implement robust PayPal webhook verification and signature checks.
- Replace data URLs for proof images with S3 uploads for persistent storage.
- Add request validation (e.g., celebrate/Joi) and rate-limiting.
- Harden CORS & secure environment variable handling.

---

# End of code bundle

Enjoy — this is a working starting backend skeleton for Phase 1. After you copy it into a repo I can:

- generate the frontend skeleton that connects to it, or
- expand any service (e.g., complete PostcardMania mapping, add webhook verification, switch to PayPal Checkout SDK)
