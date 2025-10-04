const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const Template = require('../src/models/Template');
const Order = require('../src/models/Order');

async function seed() {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        console.error('MONGO_URI is not set in api/.env');
        process.exit(1);
    }

    try {
        await mongoose.connect(uri);
    } catch (err) {
        console.error('Initial MongoDB connection failed:', err.message);
        if (uri.includes('localhost')) {
            const fallback = uri.replace('localhost', '127.0.0.1');
            console.log(`Retrying MongoDB connection with ${fallback}`);
            await mongoose.connect(fallback);
        } else {
            throw err;
        }
    }

    // Seed templates
    const templates = [
        {
            pcmDesignId: 'tpl-001',
            name: 'Sunny Fields',
            size: '6x9',
            previewUrl: 'https://placehold.co/600x400?text=Sunny+Fields',
            isPublic: true,
        },
        {
            pcmDesignId: 'tpl-002',
            name: 'City Lights',
            size: '6x9',
            previewUrl: 'https://placehold.co/600x400?text=City+Lights',
            isPublic: true,
        },
        {
            pcmDesignId: 'tpl-003',
            name: 'Classic Minimal',
            size: '6x9',
            previewUrl: 'https://placehold.co/600x400?text=Classic+Minimal',
            isPublic: false,
        },
    ];

    for (const t of templates) {
        const existing = await Template.findOne({ pcmDesignId: t.pcmDesignId });
        if (existing) {
            console.log(`Template ${t.pcmDesignId} exists`);
        } else {
            await new Template(t).save();
            console.log(`Inserted template ${t.pcmDesignId}`);
        }
    }

    // Seed a sample order (only if no orders exist)
    const orderCount = await Order.countDocuments();
    if (orderCount === 0) {
        const sampleOrder = new Order({
            designType: 'single',
            designId: 'tpl-001',
            designName: 'Sunny Fields',
            designSize: '6x9',
            isCustomDesign: false,
            mailClass: 'Standard',
            externalReference: 'demo-order-001',
            mailDate: new Date().toLocaleDateString('en-US'),
            brochureFold: 'Bi-Fold',
            returnAddress: {
                firstName: 'Acme',
                lastName: 'Marketing',
                company: 'Acme Co',
                address1: '1234 Main St',
                address2: '',
                city: 'Anytown',
                state: 'CA',
                zipCode: '90210',
            },
            recipients: [
                {
                    firstName: 'John',
                    lastName: 'Doe',
                    company: 'Doe Inc',
                    address1: '100 Elm St',
                    address2: '',
                    city: 'Somewhere',
                    state: 'CA',
                    zipCode: '90001',
                },
                {
                    firstName: 'Jane',
                    lastName: 'Smith',
                    company: '',
                    address1: '200 Oak Ave',
                    address2: 'Apt 3',
                    city: 'Elsewhere',
                    state: 'NY',
                    zipCode: '10001',
                },
            ],
            status: 'draft',
        });

        await sampleOrder.save();
        console.log('Inserted sample order demo-order-001');
    } else {
        console.log('Orders already exist; skipping sample order creation');
    }

    console.log('Seeding complete');
    process.exit(0);
}

seed().catch((err) => {
    console.error('Seeding failed', err);
    process.exit(1);
});
