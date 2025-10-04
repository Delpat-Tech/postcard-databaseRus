Got it ✅ — you want me to craft **an exact prompt you can drop into Cursor AI** so it generates your full **frontend with React + Tailwind + stepwise order flow + admin panel**, wired to your requirements.

Here’s the **ready-to-use Cursor AI prompt**:

---

# Cursor AI Prompt

You are building the **frontend for the “Proof & Approve” postcard ordering system** using **React + Vite + Tailwind CSS + React Router**.
This frontend has two sides:

1. **Public Side (Customer Flow)**

   - Stepwise order form.
   - Choose between making a custom template or editing one from PostcardMania’s template library.
   - Users pay via PayPal (mock integration for now).
   - After order completion, the order is sent to the **Admin Panel**.

2. **Admin Panel (Internal Side)**

   - Admin can see all incoming orders.
   - Admin can approve/reject orders.
   - Admin can view templates from PostcardMania’s template list (fetched via static mock JSON for now).
   - Admin decides which templates are made public and available in the step form.

---

## Public Side — Stepwise Form

### Step 1: Select Design

Options:

- Single Design (default)

- Split Testing

- Drip Campaign

- Show design proofs with:

  - Design ID
  - Design Name
  - Design Size

- Include **“Design Your Own”** option.

- Include option to edit an existing template (mocked PostcardMania templates).

### Step 2: Configure Order

Fields:

- **Mail Class** (dropdown, default = First Class)
- **External Reference** (optional text input)
- **Mail Date** (MM/DD/YYYY)
- **Brochure Fold** (radio: Tri-Fold, Bi-Fold)
- **Return Address** (optional fields):

  - First Name, Last Name, Company, Address1, Address2, City, State, Zip Code

### Step 3: Select Recipients

⚠️ Restrict to **Manual Entry Only**.

Fields:

- First Name
- Last Name
- Company (optional)
- Address1
- Address2 (optional)
- City
- State
- Zip Code
- External Reference Number (optional)

Include button: **“Add Recipient”** → show list of recipients below.

### Step 4: Review Order

- **Approval checklist** (all must be checked):

  - All images are displayed correctly
  - No spelling errors
  - All design variables are correct
  - Address block has been mapped correctly
  - (Optional) I don’t want a return address
  - Quantity of items is correct
  - I want to use First Class mailing

- **Estimated Order Cost** section (static placeholder).

- **Order Proof Preview**:

  - If preview loads → show mock proof image.
  - If preview fails → show:

    - Error: “We were unable to generate your proof.”
    - Button: “Click here to try again”
    - Support note

- **Final Action Button:** “Approve & Pay with PayPal”

---

## Admin Panel Features

- Protected route (`/admin`) with login placeholder.
- Orders table: List of all orders with status: `Pending`, `Approved`, or `Rejected`.
- Each order → details page with design info, recipients, and options to **Approve** or **Reject**.
- Template management:

  - Show all PostcardMania templates (mocked static list with `id`, `name`, `size`, `previewUrl`).
  - Toggle **Public/Private** visibility for each template.

---

## Technical Requirements

- Use **React Router v6** for routing.
- Use **Tailwind CSS** for layout (grid-based, cards, buttons).
- Use **React Context or Zustand** for global state (orders, templates, recipients).
- Mock data (no API calls yet).
- Keep **step form navigation** as a progress bar or stepper UI.
- Maintain simple, clean, responsive design.

---

## Pages & Components

**Public Pages:**

- `/` → Home page with CTA “Start Your Order”.
- `/order` → Multi-step form (Step1–Step4).
- `/proof` → Proof preview (if separate).
- `/checkout` → Mock PayPal checkout.

**Admin Pages:**

- `/admin` → Login (static placeholder).
- `/admin/orders` → Orders list.
- `/admin/orders/:id` → Single order detail with Approve/Reject.
- `/admin/templates` → Template management (list with public toggle).

**Shared Components:**

- Navbar (links to Home, Start Order, Admin).
- Stepper (visual progress indicator).
- Form components: Input, Select, Radio, Checkbox, Button, Card.
- OrderSummaryCard.
- RecipientList.
- ProofPreview.

---

## Implementation Notes

- Keep **all step text and checklists exactly as specified**.
- Remove original “Recurring Order” and “Order Addons” steps.
- Layout should remain **grid-based with Tailwind classes**.
- Use placeholders for PayPal and PostcardMania API.
- Store orders in memory for now (Zustand or Context).

---

update frontend based on these requirements.
Do **not skip any step**.
Ensure **all wording, labels, and checklist items are preserved exactly as written**.
