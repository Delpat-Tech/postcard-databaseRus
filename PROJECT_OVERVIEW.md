# 🎯 Postcard System MVP - Complete Project Overview

**Project Name:** Proof & Approve Postcard System  
**Type:** Full-stack Web Application (MERN Stack)  
**Purpose:** Custom postcard ordering system integrated with PostcardMania printing API

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Data Flow & System Design](#data-flow--system-design)
5. [Database Schema](#database-schema)
6. [Backend API Documentation](#backend-api-documentation)
7. [Frontend Structure](#frontend-structure)
8. [Integration Details](#integration-details)
9. [Business Logic & Workflows](#business-logic--workflows)
10. [Security & Authentication](#security--authentication)
11. [Deployment & Environment](#deployment--environment)
12. [Key Features & Modules](#key-features--modules)

---

## 🎯 Executive Summary

This is a **proof-and-approve postcard ordering system** that enables customers to:

- Design custom postcards using templates from PostcardMania
- Configure mailing options (mail class, dates, brochure folds)
- Add recipients manually
- Generate proofs for review before submission
- Submit orders that require admin approval before printing

**Core Value Proposition:**

- Admin-controlled template library
- Full customization with PostcardMania's design tools
- Admin approval workflow before orders go to print
- Direct integration with PostcardMania printing API

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────┐
│   React App     │  (Frontend - Vite + React + TypeScript + Tailwind)
│  Port: 5173     │
└────────┬────────┘
         │ HTTP/REST API
         │
┌────────▼────────┐
│  Express API    │  (Backend - Node.js + Express)
│  Port: 5000     │
└────┬───────┬────┘
     │       │
     │       └─────────────┐
     │                     │
┌────▼────────┐    ┌──────▼──────────┐
│  MongoDB    │    │ PostcardMania   │
│  (Atlas)    │    │  External API   │
└─────────────┘    └─────────────────┘
```

### Architecture Layers

1. **Presentation Layer** (Frontend)

   - React SPA with client-side routing
   - Zustand for state management
   - Tailwind CSS for styling

2. **Application Layer** (Backend API)

   - Express.js REST API
   - JWT-based authentication
   - Middleware for auth & validation

3. **Data Layer**

   - MongoDB with Mongoose ODM
   - Indexed collections for performance

4. **Integration Layer**
   - PostcardMania API client
   - AWS S3 (planned for file storage)
   - PayPal integration (planned)

---

## 💻 Technology Stack

### Frontend

```json
{
  "framework": "React 19.1.1",
  "language": "TypeScript 5.8.3",
  "bundler": "Vite 7.1.7",
  "routing": "React Router DOM 7.9.3",
  "state": "Zustand 5.0.8",
  "styling": "Tailwind CSS 3.4.15",
  "http": "Fetch API (native)",
  "ui": "Custom components with Tailwind"
}
```

### Backend

```json
{
  "runtime": "Node.js 20.12.2",
  "framework": "Express 5.1.0",
  "database": "MongoDB via Mongoose 8.18.3",
  "auth": "JWT (jsonwebtoken 9.0.2)",
  "password": "bcrypt 6.0.0",
  "http-client": "axios 1.7.9",
  "file-upload": "multer 2.0.2",
  "pdf-generation": "puppeteer 24.23.0 (planned)",
  "env": "dotenv 17.2.3"
}
```

### Development Tools

- **Linting:** ESLint 9.36.0
- **Node Process Manager:** nodemon 3.1.10
- **Package Manager:** npm 10.5.0
- **Version Control:** Git (GitHub repository)

---

## 🔄 Data Flow & System Design

### User Journey Flow

```
1. DESIGN SELECTION
   ↓
   User views public templates
   ↓
   Chooses: Existing Template OR Create New OR Edit Existing
   ↓
   [If Create/Edit] → Opens PostcardMania editor → Saves as new template
   ↓

2. CONFIGURE ORDER
   ↓
   Select: Mail Class, Mail Date, Brochure Fold, Return Address
   ↓
   Order saved as "draft"
   ↓

3. ADD RECIPIENTS
   ↓
   Manual entry of recipient addresses
   ↓
   Validates address format
   ↓

4. REVIEW & PROOF
   ↓
   Generates front/back proof via PostcardMania API
   ↓
   User checks approval checklist
   ↓
   Order status → "pending_admin_approval"
   ↓

5. ADMIN APPROVAL
   ↓
   Admin reviews order in admin panel
   ↓
   Approves → Sends to PostcardMania API
   ↓
   Order status → "submitted_to_pcm"
   ↓
   PostcardMania prints & mails
```

### Data Flow Diagram

```
┌──────────────┐
│  Customer    │
└──────┬───────┘
       │ 1. Browse Templates
       ▼
┌──────────────────────┐
│  Frontend (React)    │
└──────┬───────────────┘
       │ 2. Fetch public templates
       ▼
┌──────────────────────┐
│  Backend API         │ ← JWT Auth for admin routes
└──────┬───────────────┘
       │ 3. Query MongoDB
       ▼
┌──────────────────────┐
│  MongoDB             │
│  - templates         │
│  - orders            │
│  - admin_users       │
└──────────────────────┘
       │
       │ 4. Admin approves order
       ▼
┌──────────────────────┐
│  PostcardMania API   │
│  - Create order      │
│  - Generate proofs   │
│  - Track printing    │
└──────────────────────┘
```

---

## 🗄️ Database Schema

### Collections Overview

1. **templates** - Design templates from PostcardMania
2. **orders** - Customer orders
3. **adminusers** - Admin accounts

### Schema Details

#### 1. `templates` Collection

```javascript
{
  _id: ObjectId,
  pcmDesignId: String (unique, required),     // PostcardMania design ID
  name: String (required),                     // Template name
  size: String (required),                     // "4.25 x 6", "6 x 8.5", etc.
  previewUrl: String,                          // Preview image URL
  rawData: Mixed,                              // Full PostcardMania response
  isPublic: Boolean (default: false),          // Visible to customers?
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**

- `pcmDesignId` (unique)
- `isPublic` (for fast public template queries)

---

#### 2. `orders` Collection

```javascript
{
  _id: ObjectId,

  // Design Information
  designType: String,                          // "single" | "split" | "drip"
  designId: String,                            // PostcardMania design ID
  designName: String,                          // Template name
  designSize: String,                          // "46", "68", "611", "811", "BRO"
  isCustomDesign: Boolean (default: false),    // Custom vs template

  // Order Configuration
  mailClass: String (default: "FirstClass"),   // "FirstClass" | "Standard"
  externalReference: String,                   // Customer reference
  mailDate: String (required),                 // YYYY-MM-DD format
  brochureFold: String (default: "Bi-Fold"),   // "Tri-Fold" | "Bi-Fold"

  // Return Address
  returnAddress: {
    firstName: String (required),
    lastName: String (required),
    company: String,
    address1: String (required),
    address2: String,
    city: String (required),
    state: String (required),
    zipCode: String (required),
    phone: String,
    email: String
  },

  // User Contact
  userDet: {
    phone: String,
    email: String
  },

  // Recipients (Array - at least 1 required)
  recipients: [{
    firstName: String (required),
    lastName: String (required),
    company: String,
    address1: String (required),
    address2: String,
    city: String (required),
    state: String (required),
    zipCode: String (required),
    externalReferenceNumber: String,
    variables: [{                              // Design variables per recipient
      key: String (required),
      value: String (required)
    }]
  }],

  // Order Addons
  addons: [{
    addon: String                              // "UV" | "Livestamping"
  }],

  // Design Assets
  front: String,                               // Front design URL or HTML
  back: String,                                // Back design URL or HTML
  frontPdf: Buffer,                            // PDF data
  backPdf: Buffer,                             // PDF data

  // Addressing Configuration
  addressing: {
    font: String,                              // Font choice for addressing
    fontColor: String,                         // "Black" | "Green" | "Blue"
    exceptionalAddressingType: String,         // "resident" | "occupant" | "business"
    extRefNbr: String
  },

  // Global Design Variables
  globalDesignVariables: [{
    key: String (required),
    value: String (required)
  }],

  // QR Code
  qrCodeID: Number,

  // Order Status & Tracking
  status: String (default: "draft"),           // Workflow states (see below)
  pcmOrderId: String,                          // PostcardMania order ID
  pcmResponse: Object,                         // Full API response from PCM

  // Proofs
  frontproof: String,                          // Front proof image URL
  backproof: String,                           // Back proof image URL

  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

**Order Status Values:**

- `draft` - Order being created
- `pending_admin_approval` - Submitted, awaiting admin review
- `submitted_to_pcm` - Approved and sent to PostcardMania
- `approved` - (Future use)
- `rejected` - Admin rejected the order

**Indexes:**

- `status` (for filtering orders by state)
- `createdAt` (for sorting)
- `pcmOrderId` (for tracking)

---

#### 3. `adminusers` Collection

```javascript
{
  _id: ObjectId,
  username: String (unique, required),
  passwordHash: String (required),             // bcrypt hashed
  role: String (default: "admin"),
  createdAt: Date
}
```

**Indexes:**

- `username` (unique)

---

## 🔌 Backend API Documentation

### Base URL

```
http://localhost:5000/api
```

### Authentication

- **Method:** JWT Bearer Token
- **Header:** `Authorization: Bearer <token>`
- **Token Expiry:** 7 days (configurable via `JWT_EXPIRES_IN`)

---

### API Endpoints Summary

| Endpoint                 | Method | Auth  | Description                 |
| ------------------------ | ------ | ----- | --------------------------- |
| `/auth/login`            | POST   | None  | Admin login                 |
| `/templates/public`      | GET    | None  | Get public templates        |
| `/templates/proof`       | POST   | None  | Generate proof              |
| `/templates/new`         | POST   | None  | Create new design           |
| `/templates/:id/edit`    | POST   | None  | Duplicate & edit template   |
| `/templates/:id/editme`  | POST   | None  | Edit template in-place      |
| `/templates`             | GET    | Admin | Get all templates           |
| `/templates/:id`         | GET    | None  | Get template by ID          |
| `/templates/:id/public`  | PUT    | Admin | Toggle visibility           |
| `/templates/:id`         | DELETE | Admin | Delete template             |
| `/orders`                | POST   | None  | Create order                |
| `/orders/:id/config`     | PUT    | None  | Update order config         |
| `/orders/:id/recipients` | POST   | None  | Add recipients              |
| `/orders/:id/submit`     | POST   | None  | Submit for approval         |
| `/orders`                | GET    | Admin | List all orders             |
| `/orders/:id`            | GET    | None  | Get order by ID             |
| `/orders/:id/approve`    | POST   | Admin | Approve & send to PCM       |
| `/orders/:id/reject`     | POST   | Admin | Reject order                |
| `/admin/designs/import`  | GET    | Admin | Import designs from PCM     |
| `/admin/orders`          | GET    | Admin | List all orders             |
| `/admin/orders/:id`      | GET    | Admin | Get order details           |
| `/uploads/sign`          | POST   | None  | Get S3 signed URL (planned) |
| `/health`                | GET    | None  | Health check                |

---

### Detailed Endpoint Specifications

#### **Authentication**

##### POST `/api/auth/login`

Admin login

**Request:**

```json
{
  "username": "admin",
  "password": "securepassword"
}
```

**Response (200):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (401):**

```json
{
  "error": "Invalid credentials"
}
```

---

#### **Templates**

##### GET `/api/templates/public`

Get all public templates (visible to customers)

**Response (200):**

```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "pcmDesignId": "12345",
    "name": "Summer Sale Postcard",
    "size": "6 x 8.5",
    "previewUrl": "https://...",
    "isPublic": true,
    "createdAt": "2025-10-01T00:00:00.000Z",
    "updatedAt": "2025-10-01T00:00:00.000Z"
  }
]
```

---

##### POST `/api/templates/proof`

Generate proof for a template or custom design

**Request:**

```json
{
  "format": "jpg",
  "templateId": "507f1f77bcf86cd799439011",
  "size": "68",
  "recipient": {
    "firstName": "John",
    "lastName": "Doe",
    "address1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "returnAddress": {
      "firstName": "Jane",
      "lastName": "Smith",
      "address1": "456 Oak Ave",
      "city": "Boston",
      "state": "MA",
      "zipCode": "02101"
    }
  }
}
```

**Alternative (custom design):**

```json
{
  "format": "pdf",
  "front": "<html>...</html>",
  "back": "<html>...</html>",
  "size": "46",
  "recipient": { ... }
}
```

**Response (200):**

```json
{
  "front": "https://api.postcardmania.com/proofs/front_abc123.jpg",
  "back": "https://api.postcardmania.com/proofs/back_abc123.jpg"
}
```

---

##### POST `/api/templates/new`

Request new design from PostcardMania

**Request:**

```json
{
  "designData": {
    "name": "My Custom Design",
    "size": "68"
  }
}
```

**Response (201):**

```json
{
  "template": {
    "_id": "507f1f77bcf86cd799439011",
    "pcmDesignId": "67890",
    "name": "My Custom Design (2025-10-13)",
    "size": "68",
    "isPublic": true,
    "createdAt": "2025-10-13T00:00:00.000Z"
  },
  "url": "https://portal.pcmintegrations.com/integrated/embed/editor/67890"
}
```

---

##### POST `/api/templates/:id/edit`

Duplicate template and open editor

**Response (200):**

```json
{
  "_id": "507f...",
  "pcmDesignId": "67891",
  "name": "Copy of Summer Sale",
  "url": "https://portal.pcmintegrations.com/integrated/embed/editor/67891",
  ...
}
```

---

##### PUT `/api/templates/:id/public` 🔒 Admin

Toggle template visibility

**Request:**

```json
{
  "isPublic": true
}
```

**Response (200):**

```json
{
  "_id": "507f...",
  "isPublic": true,
  ...
}
```

---

#### **Orders**

##### POST `/api/orders`

Create a new order

**Request:**

```json
{
  "designType": "single",
  "designId": "12345",
  "designName": "Summer Sale",
  "designSize": "68",
  "isCustomDesign": false,
  "mailClass": "FirstClass",
  "mailDate": "2025-11-15",
  "brochureFold": "Bi-Fold",
  "returnAddress": {
    "firstName": "Jane",
    "lastName": "Smith",
    "address1": "456 Oak Ave",
    "city": "Boston",
    "state": "MA",
    "zipCode": "02101"
  },
  "recipients": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "address1": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001"
    }
  ]
}
```

**Response (201):**

```json
{
  "_id": "507f...",
  "status": "draft",
  "createdAt": "2025-10-13T00:00:00.000Z",
  ...
}
```

**Validation Errors (400):**

```json
{
  "error": "Mail date is required."
}
```

---

##### POST `/api/orders/:id/submit`

Submit order for admin approval

**Response (200):**

```json
{
  "_id": "507f...",
  "status": "pending_admin_approval",
  ...
}
```

---

##### POST `/api/orders/:id/approve` 🔒 Admin

Approve order and send to PostcardMania

**Response (200):**

```json
{
  "_id": "507f...",
  "status": "submitted_to_pcm",
  "pcmOrderId": "PCM-12345",
  "pcmResponse": { ... },
  ...
}
```

---

##### POST `/api/orders/:id/reject` 🔒 Admin

Reject order

**Response (200):**

```json
{
  "_id": "507f...",
  "status": "rejected",
  ...
}
```

---

#### **Admin**

##### GET `/api/admin/designs/import` 🔒 Admin

Import all designs from PostcardMania API

**Response (200):**

```json
{
  "message": "Imported 45 designs from PostcardMania",
  "designs": [ ... ]
}
```

---

## 🎨 Frontend Structure

### Page Routes

| Route         | Component       | Description                 |
| ------------- | --------------- | --------------------------- |
| `/`           | `Home.tsx`      | Landing page with CTA       |
| `/order`      | `Order.tsx`     | Multi-step order form       |
| `/templates`  | `Templates.tsx` | Browse all public templates |
| `/design/:id` | `Design.tsx`    | Template customization      |
| `/upload`     | `Upload.tsx`    | Upload custom design        |
| `/checkout`   | `Checkout.tsx`  | PayPal payment (planned)    |
| `/admin`      | `Admin.tsx`     | Admin dashboard             |

---

### Component Hierarchy

```
App.tsx
├── Navbar.tsx
└── Routes
    ├── Home.tsx
    ├── Order.tsx
    │   ├── Stepper.tsx
    │   ├── Step1Upload.tsx (Select Design)
    │   ├── Step2Config.tsx (Configure Order)
    │   ├── Step3Recipients.tsx (Add Recipients)
    │   │   ├── RecipientList.tsx
    │   │   └── RecipientCSV.tsx
    │   ├── Step4Review.tsx (Review & Submit)
    │   │   ├── ProofPreview.tsx
    │   │   └── OrderSummaryCard.tsx
    │   └── FormComponents.tsx (Input, Select, Button, Card)
    ├── Templates.tsx
    ├── Design.tsx
    ├── Upload.tsx
    ├── Checkout.tsx
    └── Admin.tsx
```

---

### State Management (Zustand Store)

**Store:** `orderStore.ts`

**State:**

```typescript
{
  token: string | null,
  currentOrder: Partial<Order>,
  orders: Order[],
  templates: Template[],
  isLoading: boolean,
  error: string | null
}
```

**Actions:**

```typescript
// Auth
adminLogin(username, password)
adminLogout()

// Orders
setCurrentOrder(order)
addOrder(order)
updateOrderStatus(orderId, status)
createOrder(orderData)
updateOrder(orderId, orderData)
submitOrder(orderId)
approveOrder(orderId)
rejectOrder(orderId)
fetchOrders()
clearCurrentOrder()

// Templates
setTemplates(templates)
fetchTemplates()              // Public templates
fetchAllTemplates()           // All templates (admin)
toggleTemplateVisibility(templateId, isPublic)
importDesigns()               // Import from PostcardMania
createNewDesign(payload)
openTemplateEditor(templateId)
openTemplateSimpleEditor(templateId)
generateProofByTemplate(size, recipient, format, templateId?, front?, back?)

// Recipients
addRecipient(recipient)
removeRecipient(recipientId)
```

---

### Multi-Step Order Form Flow

#### **Step 1: Select Design**

- Display public templates in grid
- Options:
  - Select existing template
  - Create new design (opens PostcardMania editor)
  - Edit existing template (duplicates & opens editor)
- Stores: `templateId`, `designId`, `designName`, `designSize`

#### **Step 2: Configure Order**

- Mail Class (FirstClass / Standard)
- External Reference
- Mail Date (date picker)
- Brochure Fold (Tri-Fold / Bi-Fold)
- Return Address (full form)
- User Contact (phone, email)

#### **Step 3: Add Recipients**

- Manual entry form
- Add multiple recipients
- Display recipient list with edit/delete
- CSV upload (planned)
- Validates required fields

#### **Step 4: Review & Submit**

- Generate proof via PostcardMania API
- Display front/back proof images
- Approval checklist:
  - ✅ All images displayed correctly
  - ✅ No spelling errors
  - ✅ All design variables correct
  - ✅ Address block mapped correctly
  - ✅ I don't want return address (optional)
  - ✅ Quantity correct
  - ✅ First Class mailing confirmed
- Order summary card
- Submit button (enabled when checklist complete)

---

## 🔗 Integration Details

### PostcardMania API Integration

**Service:** `api/src/services/postcard.js`

**Configuration:**

```javascript
{
  baseURL: process.env.POSTCARD_MANIA_API_URL,  // https://v3.pcmintegrations.com/
  apiKey: process.env.POSTCARD_MANIA_API_KEY,
  apiSecret: process.env.POSTCARD_MANIA_API_SECRET
}
```

**Authentication:**

- Method: API Key + Secret → JWT token
- Token cached with expiry check
- Auto-refresh on expiration

**Key Methods:**

```javascript
authenticate()                      // Get JWT token
getAllDesigns()                     // Fetch all templates
getDesignById(id)                   // Get single template
createNewDesign(designData)         // Create blank template
openDesignEditor(designId)          // Duplicate & open editor
openDesignMeEditor(designId)        // Edit template in-place
createOrder(orderData)              // Submit order to printer
getOrderStatus(orderId)             // Check order status
generateProof(...)                  // Generate proof images
```

**PostcardMania API Endpoints Used:**

| PCM Endpoint                           | Purpose            |
| -------------------------------------- | ------------------ |
| `POST /auth/login`                     | Authenticate       |
| `GET /design`                          | List all designs   |
| `GET /design/:id`                      | Get design details |
| `POST /design/custom`                  | Create new design  |
| `GET /design/:id/edit`                 | Open design editor |
| `POST /design/generate-proof/postcard` | Generate proofs    |
| `POST /order/postcard`                 | Create print order |
| `GET /orders/:id`                      | Check order status |

---

### AWS S3 Integration (Planned)

**Purpose:** Store uploaded files and generated proofs

**Configuration:**

```env
AWS_ACCESS_KEY_ID=localstack
AWS_SECRET_ACCESS_KEY=localstack
AWS_REGION=us-east-1
S3_BUCKET=postcard-dev
S3_ENDPOINT=http://localhost:4566  # For local testing with LocalStack
```

**Planned Features:**

- Pre-signed upload URLs for direct browser uploads
- Proof image storage
- CSV mailing list storage
- PDF storage

---

### PayPal Integration (Planned)

**Purpose:** Accept payments before admin approval

**Configuration:**

```env
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=YourPayPalSandboxClientID
PAYPAL_CLIENT_SECRET=YourPayPalSandboxClientSecret
```

**Planned Flow:**

1. User completes order → creates PayPal order
2. User redirects to PayPal → completes payment
3. PayPal webhook → verifies payment
4. Order marked as "paid" → moves to admin queue

**Frontend Package:**

- `@paypal/react-paypal-js` (v8.9.2) - already installed

---

## ⚙️ Business Logic & Workflows

### Order Workflow State Machine

```
┌─────────┐
│  draft  │ ← Initial state when order created
└────┬────┘
     │ User submits order
     ▼
┌──────────────────────┐
│ pending_admin_approval│ ← Waiting in admin queue
└────┬────────┬────────┘
     │        │
     │        │ Admin rejects
     │        ▼
     │   ┌──────────┐
     │   │ rejected │ ← Terminal state
     │   └──────────┘
     │
     │ Admin approves
     ▼
┌───────────────────┐
│ submitted_to_pcm  │ ← Sent to PostcardMania
└───────────────────┘
     │
     │ (Future: track printing/shipping)
     ▼
┌──────────┐
│ approved │ ← Future use
└──────────┘
```

---

### Template Management Workflow

```
1. Admin imports designs from PostcardMania
   ↓
   GET /admin/designs/import
   ↓
   Saves all designs as templates (isPublic: false)
   ↓

2. Admin reviews templates
   ↓
   Sets isPublic: true for customer-facing templates
   ↓

3. Customer creates new design
   ↓
   POST /templates/new
   ↓
   Creates blank design in PostcardMania
   ↓
   Opens editor in iframe/new tab
   ↓
   User designs & saves
   ↓
   Template automatically saved as public
   ↓

4. Customer edits existing template
   ↓
   POST /templates/:id/edit?duplicate=true
   ↓
   Duplicates template in PostcardMania
   ↓
   Opens editor
   ↓
   Saves as new public template
```

---

### Proof Generation Logic

**Input:**

- Template ID (from database) OR custom front/back HTML
- Recipient address (for addressing)
- Return address (optional)
- Size (46, 68, 611, 811, BRO)
- Format (jpg or pdf)

**Process:**

1. Validate inputs (size & recipient required)
2. If templateId → fetch from database → get `pcmDesignId`
3. Build PostcardMania proof payload
4. Call `/design/generate-proof/postcard`
5. Receive front/back image URLs
6. Store proof URLs in order record
7. Return to frontend for display

**Proof Payload Example:**

```json
{
  "designID": 12345,
  "size": "68",
  "format": "jpg",
  "recipient": {
    "firstName": "John",
    "lastName": "Doe",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001"
  },
  "returnAddress": { ... },
  "addressing": {
    "font": "Bradley Hand",
    "fontColor": "Black",
    "exceptionalAddressingType": "resident"
  }
}
```

---

### Order Validation Rules

**Step 1 Validation:**

- Must select a template OR create custom design
- Must specify design size

**Step 2 Validation:**

- Mail date is required (format: YYYY-MM-DD)
- Return address must include:
  - First name, last name
  - Address1, city, state, zip code

**Step 3 Validation:**

- At least 1 recipient required
- Each recipient must have:
  - First name, last name
  - Address1, city, state, zip code

**Step 4 Validation:**

- All checklist items must be checked
- Proofs must be successfully generated

---

### Pricing Logic

**Pricing Table:**

```javascript
[
  { sizeKey: "46", sizeLabel: "4.25 x 6", mailClass: "FirstClass" },
  { sizeKey: "68", sizeLabel: "6 x 8.5", mailClass: "Standard" },
  { sizeKey: "611", sizeLabel: "6 x 11", mailClass: "Standard" },
  { sizeKey: "811", sizeLabel: "8.5 x 11 Letters", mailClass: "Standard" },
  {
    sizeKey: "BRO",
    sizeLabel: "8.5 x 11 Yellow Letters",
    mailClass: "Standard",
  },
];
```

**Calculation (Planned):**

- Base price per piece × quantity
- - Mail class premium (First Class higher)
- - Addons (UV coating, Live stamping)
- - Variable addressing fees
- Total = Subtotal + Tax

---

## 🔐 Security & Authentication

### Admin Authentication

**Method:** JWT (JSON Web Token)

**Flow:**

1. Admin submits username + password
2. Backend verifies against hashed password in database
3. Issues JWT token (valid 7 days)
4. Frontend stores token in `localStorage`
5. All admin requests include `Authorization: Bearer <token>` header
6. Backend middleware verifies token on protected routes

**Password Hashing:**

- Algorithm: bcrypt
- Rounds: 10 (default)
- Stored as `passwordHash` in database

**Protected Routes:**

- All `/api/admin/*` routes
- `/api/templates/:id/public` (toggle visibility)
- `/api/templates/:id` (DELETE)
- `/api/orders` (GET all orders)
- `/api/orders/:id/approve`
- `/api/orders/:id/reject`

---

### Middleware: `adminAuth`

**File:** `api/src/middleware/auth.js`

**Logic:**

```javascript
1. Extract token from Authorization header
2. Verify token with JWT_SECRET
3. Decode payload (contains user ID, username, role)
4. Attach user to req.user
5. Call next() → proceed to route handler
6. If invalid → 401 Unauthorized
```

---

### CORS Configuration

**Allowed Origins:**

- Environment variable: `FRONTEND_URL`
- Default: `http://localhost:5173`
- Production: Set to actual frontend domain

**Settings:**

```javascript
{
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);  // Allow no-origin (mobile, curl)
    if (allowedFrontends.includes("*") || allowedFrontends.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}
```

---

### Environment Variables

**Backend (.env):**

```env
# Server
PORT=5000
FRONTEND_URL=http://localhost:5173

# Database
MONGO_URI=mongodb://127.0.0.1:27017/postcard

# PostcardMania
POSTCARD_MANIA_API_URL=https://v3.pcmintegrations.com/
POSTCARD_MANIA_API_KEY=e5ea57073b7e3613bd97eeb723ed05e0
POSTCARD_MANIA_API_SECRET=NGIzNjgyMTEtMjVjYi00MjI0LWIwY2EtODU0NjI5YjZmNzVj

# Authentication
JWT_SECRET=YourJWTSecretKey
JWT_EXPIRES_IN=7d

# AWS S3 (Planned)
AWS_ACCESS_KEY_ID=localstack
AWS_SECRET_ACCESS_KEY=localstack
AWS_REGION=us-east-1
S3_BUCKET=postcard-dev
S3_ENDPOINT=http://localhost:4566

# PayPal (Planned)
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=YourPayPalSandboxClientID
PAYPAL_CLIENT_SECRET=YourPayPalSandboxClientSecret

# Email (Future)
EMAIL_SERVICE=YourEmailServiceProvider
```

**Frontend (.env):**

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🚀 Deployment & Environment

### Development Setup

**Prerequisites:**

- Node.js 20.19+ or 22.12+ (current: 20.12.2 - needs upgrade for Vite)
- MongoDB (local or Atlas)
- npm 10+

**Installation:**

```bash
# Clone repository
git clone https://github.com/Delpat-Tech/postcard-databaseRus.git
cd postcard-databaseRus

# Install dependencies
npm install

# Set up environment
cp api/.env.example api/.env
# Edit api/.env with your credentials

# Set up admin user
npm run seed-admin

# Run backend
npm run dev:backend

# Run frontend (in new terminal)
npm run dev:frontend
```

---

### Available Scripts

**Backend:**

```bash
npm start                # Production server
npm run dev:backend      # Development with nodemon
npm run seed-admin       # Create admin user
npm run seed-dummy       # Seed dummy data
npm run reset-seed       # Reset database
```

**Frontend:**

```bash
npm run dev:frontend     # Development server (Vite)
npm run build:frontend   # Production build
npm run preview:frontend # Preview production build
```

---

### Deployment Architecture (Planned)

```
┌──────────────────┐
│  Vercel          │  Frontend (React build)
│  (Static Host)   │  Auto-deploy on push to main
└────────┬─────────┘
         │
         │ HTTPS
         ▼
┌──────────────────┐
│  Render          │  Backend (Node.js)
│  (Web Service)   │  Auto-deploy on push to main
└────────┬─────────┘
         │
         │ MongoDB Atlas
         ▼
┌──────────────────┐
│  MongoDB Atlas   │  Database (Cloud)
│  (M0 Free Tier)  │  Restricted IPs
└──────────────────┘
```

**Deployment Checklist:**

- [ ] Set environment variables in Vercel (VITE_API_URL)
- [ ] Set environment variables in Render (all backend vars)
- [ ] Configure MongoDB Atlas IP whitelist
- [ ] Set up custom domain (optional)
- [ ] Configure CORS for production domain
- [ ] Enable HTTPS (automatic on Vercel/Render)
- [ ] Set up CI/CD via GitHub Actions (optional)

---

## 🎯 Key Features & Modules

### Feature Matrix

| Feature                         | Status      | Description                     |
| ------------------------------- | ----------- | ------------------------------- |
| **Admin Authentication**        | ✅ Complete | JWT-based login                 |
| **Template Management**         | ✅ Complete | Import, view, toggle visibility |
| **Design Editor Integration**   | ✅ Complete | Create/edit via PostcardMania   |
| **Order Creation**              | ✅ Complete | Multi-step form                 |
| **Recipient Management**        | ✅ Complete | Manual entry                    |
| **Proof Generation**            | ✅ Complete | Via PostcardMania API           |
| **Admin Approval**              | ✅ Complete | Approve/reject orders           |
| **Order Submission to Printer** | ✅ Complete | PostcardMania integration       |
| **CSV Recipient Upload**        | 🚧 Planned  | Bulk import                     |
| **PayPal Payment**              | 🚧 Planned  | Payment gateway                 |
| **S3 File Storage**             | 🚧 Planned  | Asset management                |
| **Email Notifications**         | 🚧 Planned  | Order confirmations             |
| **CRM Integration**             | 🚧 Planned  | LessAnnoyingCRM                 |
| **Order Tracking**              | 🚧 Planned  | Print/ship status               |
| **Split Testing**               | 🚧 Planned  | A/B test designs                |
| **Drip Campaigns**              | 🚧 Planned  | Scheduled mailings              |

---

### Module Breakdown

#### **1. Authentication Module**

**Files:**

- `api/src/routes/auth.js`
- `api/src/middleware/auth.js`
- `api/src/models/AdminUser.js`

**Features:**

- Admin login with username/password
- JWT token generation
- Token verification middleware
- Password hashing with bcrypt

---

#### **2. Template Module**

**Files:**

- `api/src/routes/templates.js`
- `api/src/models/Template.js`
- `api/src/services/postcard.js`
- `frontend/src/pages/Templates.tsx`

**Features:**

- Import designs from PostcardMania
- Create new designs
- Edit existing designs (duplicate or in-place)
- Toggle public/private visibility
- Generate proofs

**PostcardMania API Calls:**

- `GET /design` - List all designs
- `GET /design/:id` - Get design details
- `POST /design/custom` - Create new design
- `GET /design/:id/edit` - Open editor
- `POST /design/generate-proof/postcard` - Generate proof

---

#### **3. Order Module**

**Files:**

- `api/src/routes/orders.js`
- `api/src/models/Order.js`
- `frontend/src/pages/Order.tsx`
- `frontend/src/pages/steps/*.tsx`

**Features:**

- Multi-step order form
- Draft order creation
- Configuration updates
- Recipient management
- Order submission
- Admin approval/rejection

**Workflow States:**

- Draft → Pending Approval → Submitted to PCM → (Approved/Rejected)

---

#### **4. Admin Module**

**Files:**

- `api/src/routes/admin.js`
- `frontend/src/pages/Admin.tsx`

**Features:**

- Design import from PostcardMania
- Order queue management
- Order approval/rejection
- Template visibility control

**Admin Dashboard Sections:**

- Orders (pending, approved, rejected)
- Templates (all templates with public toggle)
- Design Import (sync from PostcardMania)

---

#### **5. Proof Module**

**Files:**

- `api/src/services/postcard.js` (generateProof method)
- `frontend/src/components/ProofPreview.tsx`

**Features:**

- Generate front/back proofs
- Display high-res proof images
- Zoom functionality
- Error handling & retry

**Input:**

- Template ID or custom front/back
- Recipient address
- Return address
- Size & format

**Output:**

- Front proof URL
- Back proof URL

---

#### **6. File Upload Module** (Planned)

**Files:**

- `api/src/routes/uploads.js`
- AWS S3 integration

**Features:**

- Pre-signed upload URLs
- Direct browser → S3 uploads
- CSV validation
- PDF validation

---

#### **7. Payment Module** (Planned)

**Files:**

- `frontend/src/pages/Checkout.tsx`
- PayPal integration

**Features:**

- PayPal Buttons component
- Server-side order creation
- Payment verification webhook
- Order status update on payment

---

## 📊 Key Business Decisions

### 1. **Admin Approval Required**

- **Decision:** All orders must be admin-approved before printing
- **Rationale:** Quality control, prevent errors, manage costs
- **Impact:** Extra step in workflow, but ensures accuracy

### 2. **Manual Recipients Only (Phase 1)**

- **Decision:** CSV upload not implemented yet
- **Rationale:** Simplify MVP, manual entry covers most use cases
- **Future:** Add CSV bulk import in Phase 2

### 3. **PostcardMania as Sole Printer**

- **Decision:** Direct integration with PostcardMania API
- **Rationale:** Client already uses PostcardMania, proven quality
- **Impact:** Tight coupling, but simplified fulfillment

### 4. **Public vs Private Templates**

- **Decision:** Admin controls which templates are public
- **Rationale:** Curated customer experience, brand consistency
- **Impact:** Manual admin work to toggle visibility

### 5. **No User Accounts (Phase 1)**

- **Decision:** Customers don't create accounts
- **Rationale:** Reduce friction, faster checkout
- **Impact:** No order history for customers (future feature)

### 6. **JWT for Admin Auth**

- **Decision:** Use JWT tokens, not sessions
- **Rationale:** Stateless, works well with separate frontend/backend
- **Impact:** Requires secure token storage in frontend

### 7. **Payment Before Admin Approval** (Planned)

- **Decision:** PayPal payment → then admin approval
- **Rationale:** Reduce unpaid orders, ensure commitment
- **Impact:** Refund process needed for rejected orders

### 8. **Proof Generation via PostcardMania**

- **Decision:** Use PostcardMania API for proofs, not client-side rendering
- **Rationale:** Accurate representation of final print
- **Impact:** Depends on API uptime, slight delay

---

## 🔧 Technical Decisions

### 1. **MongoDB (NoSQL) over PostgreSQL (SQL)**

- **Reason:** Flexible schema for evolving order structure
- **Trade-off:** No strict relational integrity, but easier iteration

### 2. **Zustand over Redux**

- **Reason:** Simpler API, less boilerplate, sufficient for app size
- **Trade-off:** Less ecosystem, but easier learning curve

### 3. **Tailwind CSS over styled-components**

- **Reason:** Utility-first, faster prototyping, smaller bundle
- **Trade-off:** Verbose HTML, but consistent styling

### 4. **Vite over Create React App**

- **Reason:** Faster dev server, better HMR, modern tooling
- **Trade-off:** Newer ecosystem, but industry-standard now

### 5. **Express over NestJS/Fastify**

- **Reason:** Mature, well-documented, flexible
- **Trade-off:** Less opinionated structure, but easier customization

### 6. **Axios over Fetch (backend)**

- **Reason:** Better error handling, request/response interceptors
- **Trade-off:** Extra dependency, but worth convenience

### 7. **Node-fetch v2 over v3**

- **Reason:** CommonJS compatibility (v3 is ESM-only)
- **Trade-off:** Older version, but avoids module system issues

---

## 🎨 UI/UX Patterns

### Design System

**Colors:**

- Primary: Tailwind default blue
- Success: Green
- Error: Red
- Warning: Yellow
- Neutral: Gray scale

**Typography:**

- Font: System fonts (default)
- Headings: Bold, larger sizes
- Body: Regular weight

**Components:**

- Cards for grouping content
- Buttons with hover states
- Form inputs with validation feedback
- Stepper for multi-step forms
- Modal dialogs (future)

**Responsive:**

- Mobile-first approach
- Breakpoints: sm, md, lg, xl
- Grid/flex layouts
- Stack on mobile, side-by-side on desktop

---

### User Experience Flows

**Customer Flow:**

1. Land on home → "Start Order" CTA
2. Browse templates → select or create
3. [If create/edit] → iframe editor → save → back to form
4. Configure order → simple form
5. Add recipients → progressive disclosure
6. Review proofs → checklist interaction
7. Submit → success message

**Admin Flow:**

1. Login → token stored
2. Dashboard → tabs (Orders / Templates)
3. Orders tab → filter by status
4. Click order → modal with details
5. Approve/Reject → confirm dialog
6. Success toast → order removed from queue

---

## 📈 Performance Considerations

### Backend

- **Database Indexing:** `status`, `createdAt`, `pcmDesignId`, `username`
- **API Caching:** PostcardMania token cached until expiry
- **Request Validation:** Early validation to fail fast
- **Error Handling:** Try-catch blocks, meaningful error messages

### Frontend

- **Code Splitting:** Lazy load routes (future)
- **Image Optimization:** Use optimized preview images
- **State Updates:** Batch updates in Zustand
- **API Calls:** Debounce user input (future)

---

## 🐛 Error Handling

### Backend Error Responses

**Format:**

```json
{
  "error": "Human-readable error message"
}
```

**Status Codes:**

- `200` OK
- `201` Created
- `400` Bad Request (validation error)
- `401` Unauthorized (auth failed)
- `404` Not Found
- `500` Internal Server Error

**Error Logging:**

- Console errors with timestamps
- PostcardMania API errors logged with full response

---

### Frontend Error Handling

**Patterns:**

- Try-catch in async functions
- Error state in Zustand store
- Display error messages to user
- Retry buttons for failed API calls

**Example:**

```typescript
try {
  await approveOrder(orderId);
} catch (error) {
  alert("Failed to approve order. Please try again.");
}
```

---

## 🧪 Testing Strategy (Future)

### Backend Tests

- **Unit Tests:** Service methods (proof generation, order formatting)
- **Integration Tests:** API endpoints with test database
- **Tools:** Jest, Supertest

### Frontend Tests

- **Unit Tests:** Utility functions, form validation
- **Component Tests:** React Testing Library
- **E2E Tests:** Playwright or Cypress

---

## 📚 Documentation

**Generated:**

- ✅ This comprehensive overview (`PROJECT_OVERVIEW.md`)
- ✅ API documentation in `api.md`
- ✅ Frontend documentation in `frontend.md`
- ✅ Blueprint in `blueprint.md`

**Needed:**

- [ ] Setup guide (`SETUP.md`)
- [ ] Deployment guide (`DEPLOYMENT.md`)
- [ ] API reference (Swagger/OpenAPI)
- [ ] Admin user manual
- [ ] Customer user guide

---

## 🚦 Current Status

### ✅ Completed Features

- Admin authentication & authorization
- Template management (import, view, create, edit)
- Order creation with validation
- Multi-step order form
- Recipient management
- Proof generation
- Admin approval workflow
- PostcardMania integration (orders, proofs, designs)

### 🚧 In Progress

- Node.js version upgrade (required for Vite 7)
- CORS configuration fixes

### 🔜 Next Steps

1. Upgrade Node.js to 20.19+ or 22.12+
2. Test end-to-end order flow
3. Implement PayPal payment integration
4. Add CSV recipient upload
5. Implement S3 file storage
6. Add email notifications
7. Create customer order history
8. Add order tracking (print/ship status)

---

## 🔒 Security Checklist

- [x] Passwords hashed with bcrypt
- [x] JWT tokens for admin auth
- [x] CORS configured for frontend origin
- [x] Environment variables for secrets
- [x] Input validation on all endpoints
- [ ] Rate limiting (future)
- [ ] HTTPS in production
- [ ] SQL injection prevention (N/A - using MongoDB)
- [ ] XSS prevention (React handles by default)
- [ ] CSRF protection (future - for forms)

---

## 📞 Support & Maintenance

### Common Issues

**Issue:** "Not allowed by CORS"

- **Fix:** Check `FRONTEND_URL` in `.env` matches frontend origin (no trailing slash)

**Issue:** "ERR_REQUIRE_ESM" with node-fetch

- **Fix:** Use node-fetch v2 (`npm install node-fetch@2`)

**Issue:** "Vite requires Node.js version 20.19+"

- **Fix:** Upgrade Node.js or downgrade Vite to v5.x

**Issue:** MongoDB connection fails

- **Fix:** Check MongoDB is running, use `127.0.0.1` instead of `localhost`

---

### Database Maintenance

**Backup:**

```bash
mongodump --uri="mongodb://127.0.0.1:27017/postcard" --out=./backup
```

**Restore:**

```bash
mongorestore --uri="mongodb://127.0.0.1:27017/postcard" ./backup/postcard
```

**Reset:**

```bash
npm run reset-seed
```

---

## 🎓 Learning Resources

### PostcardMania API

- **Docs:** (Contact PostcardMania for official docs)
- **Postman Collection:** `postcard.postman_collection.json`

### Tech Stack Docs

- [React](https://react.dev)
- [Express](https://expressjs.com)
- [MongoDB](https://www.mongodb.com/docs)
- [Mongoose](https://mongoosejs.com)
- [Zustand](https://zustand-demo.pmnd.rs)
- [Tailwind CSS](https://tailwindcss.com)
- [Vite](https://vitejs.dev)

---

## 📝 Changelog

### Version 1.0.0 (Current - Phase 1 MVP)

- Initial release
- Admin authentication
- Template management
- Order creation & submission
- Proof generation
- Admin approval workflow
- PostcardMania integration

---

## 👥 Team & Contact

**Developer:** Delpat Tech  
**Client:** (Your client name)  
**Repository:** https://github.com/Delpat-Tech/postcard-databaseRus  
**Support:** (Your support email)

---

## 📄 License

(Add license information here)

---

**Last Updated:** October 13, 2025  
**Document Version:** 1.0  
**Project Phase:** MVP (Phase 1)
