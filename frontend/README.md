# Proof & Approve Frontend

A React + TypeScript + Tailwind CSS frontend for the postcard ordering system.

## Features

### Public Side (Customer Flow)

- **Stepwise Order Form** with 4 steps:

  1. **Select Design** - Choose between single design, split testing, or drip campaign
  2. **Configure Order** - Set mail class, external reference, mail date, brochure fold, and return address
  3. **Select Recipients** - Add recipients manually (restricted to manual entry only)
  4. **Review Order** - Complete approval checklist and review order details

- **Design Options**:

  - Design Your Own (custom upload)
  - Edit existing PostcardMania templates

- **Approval Checklist** (all must be checked):

  - All images are displayed correctly
  - No spelling errors
  - All design variables are correct
  - Address block has been mapped correctly
  - (Optional) I don't want a return address
  - Quantity of items is correct
  - I want to use First Class mailing

- **Proof Preview** with error handling
- **PayPal Integration** (mock implementation)

### Admin Panel

- **Orders Management** - View all orders with status (Pending, Approved, Rejected)
- **Order Actions** - Approve or reject pending orders
- **Template Management** - Toggle public/private visibility for PostcardMania templates

## Technical Stack

- **React 19** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Router v6** for routing
- **Zustand** for state management
- **UUID** for unique ID generation

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── FormComponents.tsx    # Input, Select, Radio, Checkbox, Button, Card
│   ├── Navbar.tsx           # Navigation bar
│   ├── OrderSummaryCard.tsx # Order summary display
│   ├── ProofPreview.tsx     # Proof preview with error handling
│   ├── RecipientList.tsx    # Recipients list management
│   └── Stepper.tsx          # Step progress indicator
├── pages/               # Page components
│   ├── Admin.tsx            # Admin dashboard
│   ├── Checkout.tsx         # PayPal checkout
│   ├── Home.tsx             # Landing page
│   ├── Order.tsx            # Multi-step order form
│   └── Proof.tsx            # Digital proof preview
├── store/               # State management
│   └── orderStore.ts        # Zustand store for orders and templates
└── App.tsx              # Main app component with routing
```

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start development server:

   ```bash
   npm run dev:frontend
   ```

3. Open http://localhost:5173 in your browser

## Key Features Implemented

✅ **Stepwise Order Form** - Complete 4-step process as specified
✅ **Admin Panel** - Orders and template management
✅ **Approval Checklist** - All required checklist items
✅ **Proof Preview** - With error handling and retry functionality
✅ **PayPal Integration** - Mock implementation ready for real API
✅ **Template Management** - Public/private toggle for templates
✅ **Responsive Design** - Mobile-friendly Tailwind CSS layout
✅ **State Management** - Zustand store for orders and templates
✅ **TypeScript** - Full type safety throughout the application

## Mock Data

The application includes mock data for:

- PostcardMania templates (3 sample templates)
- Order statuses and management
- Proof generation simulation

## Next Steps

To connect to the backend API:

1. Replace mock data in `orderStore.ts` with API calls
2. Implement real PayPal integration
3. Add authentication for admin panel
4. Connect to PostcardMania API for real templates
