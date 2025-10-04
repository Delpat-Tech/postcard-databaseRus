# Proof & Approve Backend API

A Node.js + Express + MongoDB backend for the postcard ordering system with PostcardMania integration.

## Features

### **Design Management**

- Import designs from PostcardMania API
- Manage template visibility (public/private)
- Create new designs via PostcardMania
- Open design editor for existing templates

### **Order Management**

- Create draft orders
- Update order configuration
- Add recipients manually
- Submit orders for admin approval
- Admin approval/rejection workflow
- Integration with PostcardMania for order fulfillment

### **Admin Workflow**

- Import latest designs from PostcardMania
- Toggle template visibility
- Review and approve/reject orders
- Send approved orders to PostcardMania

## API Endpoints

### **Public Endpoints**

#### Templates

- `GET /api/templates/public` - Get all public templates
- `GET /api/templates/:id` - Get template by ID
- `POST /api/templates/new` - Request new design from PostcardMania
- `POST /api/templates/:id/edit` - Open design editor via PostcardMania

#### Orders

- `POST /api/orders` - Create draft order
- `PUT /api/orders/:id/config` - Update order configuration
- `POST /api/orders/:id/recipients` - Add recipients to order
- `POST /api/orders/:id/submit` - Submit order for admin approval
- `GET /api/orders/:id` - Get order by ID

### **Admin Endpoints**

#### Templates

- `GET /api/templates` - Get all templates (admin only)
- `PUT /api/templates/:id/public` - Toggle template visibility
- `DELETE /api/templates/:id` - Delete template

#### Orders

- `GET /api/orders` - Get all orders (admin only)
- `POST /api/orders/:id/approve` - Approve order and send to PostcardMania
- `POST /api/orders/:id/reject` - Reject order

#### Admin

- `GET /api/admin/designs/import` - Import latest designs from PostcardMania
- `GET /api/admin/orders` - List all orders
- `GET /api/admin/orders/:id` - Get specific order
- `POST /api/admin/orders/:id/approve` - Approve order
- `POST /api/admin/orders/:id/reject` - Reject order

## Database Schema

### **Templates Collection**

```javascript
{
  pcmDesignId: String,    // PostcardMania design ID
  name: String,           // Design name
  size: String,           // Design size (e.g., "6x9")
  previewUrl: String,     // Preview image URL
  isPublic: Boolean,      // Whether template is public
  createdAt: Date,
  updatedAt: Date
}
```

### **Orders Collection**

```javascript
{
  designType: String,     // "single", "split", "drip"
  designId: String,       // Template ID
  designName: String,     // Design name
  designSize: String,     // Design size
  isCustomDesign: Boolean,
  mailClass: String,      // "First Class", "Standard"
  externalReference: String,
  mailDate: String,       // MM/DD/YYYY format
  brochureFold: String,   // "Tri-Fold", "Bi-Fold"
  returnAddress: Object,  // Return address details
  recipients: [Object],   // Array of recipient objects
  status: String,         // "draft", "pending_admin_approval", "submitted_to_pcm", "approved", "rejected"
  pcmOrderId: String,     // PostcardMania order ID
  pcmResponse: Object,    // PostcardMania API response
  createdAt: Date,
  updatedAt: Date
}
```

## Environment Variables

```bash
# Database
MONGO_URI=mongodb://localhost:27017/postcard-database

# PostcardMania API
POSTCARD_MANIA_API_URL=https://api.postcardmania.com
POSTCARD_MANIA_API_KEY=your_api_key_here

# Server
PORT=4000
FRONTEND_URL=http://localhost:5173

# JWT (for admin auth)
JWT_SECRET=your_jwt_secret_here
```

## Getting Started

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start MongoDB:**

   ```bash
   # Make sure MongoDB is running locally or update MONGO_URI
   ```

4. **Seed admin user:**

   ```bash
   npm run seed-admin
   ```

5. **Start the server:**
   ```bash
   npm run dev:backend
   ```

## PostcardMania Integration

The backend acts as a middleware layer between the frontend and PostcardMania:

1. **Design Management:**

   - Imports designs from PostcardMania API
   - Caches them locally with admin-controlled visibility
   - Provides design editor integration

2. **Order Processing:**
   - Stores orders locally in draft state
   - Requires admin approval before sending to PostcardMania
   - Formats order data for PostcardMania API
   - Tracks order status and responses

## Order Flow

1. **User creates order** → `POST /api/orders` (status: "draft")
2. **User configures order** → `PUT /api/orders/:id/config`
3. **User adds recipients** → `POST /api/orders/:id/recipients`
4. **User submits order** → `POST /api/orders/:id/submit` (status: "pending_admin_approval")
5. **Admin reviews order** → `GET /api/admin/orders`
6. **Admin approves order** → `POST /api/admin/orders/:id/approve` (status: "submitted_to_pcm")
7. **Order sent to PostcardMania** → Order processed by PostcardMania

## Error Handling

All API endpoints return consistent error responses:

```javascript
{
  "error": "Error message description"
}
```

HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error
