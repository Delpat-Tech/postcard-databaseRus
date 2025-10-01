# Quick acknowledgement

Goal for Phase 1 (confirmed): a self-contained web app that lets individuals personalize templates or upload print-ready designs, accept payment via PayPal, store orders in MongoDB, and surface pending orders to a password-protected admin for final “Approve” that triggers fulfillment with PostcardMania. Good scope — I’ll map out exactly how to build that MVP.

# What I’m delivering now

Below are the deliverables I’ve prepared for immediate use:

1. Phase 1 Implementation Plan (tasks, owners, acceptance criteria)
2. Data model (MongoDB schemas) for orders, templates, users, mailing lists
3. REST API contract (endpoints, request/response examples)
4. Frontend route/component map and wireframe notes
5. Proof-generation approach and recommended libraries
6. File storage & assets handling recommendation
7. PayPal and PostcardMania integration design (how the flows work)
8. Minimal CI/CD & deployment guidance (Vercel + Render + Atlas)
9. Secure credential-transfer instructions and client checklist

---

# 1 — Phase 1 Implementation Plan (tasks & acceptance)

(Developers = Delpat / your devs; Client = you)

**A. Setup & infra (Dev)**

- Create GitHub repo with branch protections (private).
- Create Render service for backend; create Vercel project for frontend.
- Provision MongoDB Atlas cluster (dev tier).
- Acceptance: repo exists + basic README + CI deploy to dev instances.

**B. Backend API (Dev)**

- Implement auth for admin (password-protected: JWT + hashed password).
- Implement endpoints (see section 3).
- Implement file upload endpoints (PDF/image), store in S3-compatible bucket (or Render attachments) — signed URLs for direct browser upload.
- Implement PayPal server-side order capture verification webhook.
- Acceptance: API passes example curl requests.

**C. Frontend (Dev)**

- React app with routes: /, /templates, /design/:id, /upload, /checkout, /proof, /admin.
- Components: Template selector, Personalization form, PDF uploader, CSV uploader, Proof viewer, Checkout page (PayPal).
- Acceptance: mock data UI shows personalize flow + proof screen.

**D. Proofing & rendering (Dev)**

- Use client-side HTML canvas or server-side headless Chromium (Puppeteer) to render two-sided proof images from user inputs/PDF.
- Acceptance: Proof images generated and displayed prior to PayPal checkout.

**E. Admin Dashboard (Dev)**

- Order queue, order detail modal, approve button triggers POST to printer API.
- Acceptance: Admin can approve/defer; approvals record printer API response.

**F. Integrations (Dev + Client)**

- PayPal: sandbox integration -> client provides credentials for production.
- PostcardMania: test API -> client provides API key.
- CRM (LessAnnoyingCRM): optional; store order contacts and optionally push after approval.
- Acceptance: End-to-end sandbox flow completed.

---

# 2 — MongoDB Schemas (examples)

Below are concise Mongoose-style schema outlines you can drop into the backend.

**Template**

```js
{
  _id: ObjectId,
  name: String,
  previewUrl: String,        // hosted image URL
  templateType: String,      // 'front/back' or 'full'
  sizes: [String],           // e.g. ['6x4', '6x9', '8.5x11']
  createdAt: Date
}
```

**Order**

```js
{
  _id: ObjectId,
  user: {
    name: String,
    email: String
  },
  product: {
    type: String,            // 'postcard' | 'letter'
    size: String,
    quantity: Number,
    priceCents: Number
  },
  design: {
    mode: String,            // 'personalize' | 'upload'
    frontUrl: String,
    backUrl: String,
    pdfUrl: String           // for uploaded print-ready
  },
  mailing: {
    recipient: { name, address1, address2, city, state, zip, country },
    csvUrl: String           // for bulk
  },
  proof: {
    frontProofUrl: String,
    backProofUrl: String,
    approvedByUserAt: Date
  },
  payment: {
    provider: 'paypal',
    paypalOrderId: String,
    status: 'pending'|'paid'|'refunded',
    paidAt: Date
  },
  admin: {
    status: 'pending'|'approved'|'rejected',
    approvedBy: String,
    approvedAt: Date,
    printerJobId: String,
    printerResponse: Object
  },
  createdAt: Date
}
```

**AdminUser**

```js
{
  _id: ObjectId,
  username: String,
  passwordHash: String,
  role: String,
  createdAt: Date
}
```

**MailingList (optional)**

```js
{
  _id: ObjectId,
  name: String,
  csvUrl: String,
  totalRows: Number,
  uploadedBy: ObjectId,
  createdAt: Date
}
```

---

# 3 — REST API contract (key endpoints)

(Example request/response shapes included)

**Auth**

- `POST /api/admin/login` — body `{ username, password }` → returns `{ token }`.

**Templates**

- `GET /api/templates` → list templates
- `POST /api/templates` (admin) → create template `{ name, previewUrl, sizes }`

**Orders**

- `POST /api/orders` — create an order (before payment). Example body:

```json
{
  "user": { "name": "Jane", "email": "jane@example.com" },
  "product": {
    "type": "postcard",
    "size": "6x9",
    "quantity": 100,
    "priceCents": 15000
  },
  "design": { "mode": "upload", "pdfUrl": "https://..." },
  "mailing": { "csvUrl": "https://..." }
}
```

Response: `{ orderId, paypalCheckoutUrl, proofUrls }` (proofUrls if generated server-side)

- `GET /api/orders/:id` — get order
- `POST /api/orders/:id/paypal-complete` — PayPal server verification webhook to mark order paid
- `POST /api/orders/:id/approve` — admin action to approve and send to printer API. Body `{ adminId }` → returns `{ printerJobId }`

**Uploads (signed URLs)**

- `POST /api/uploads/sign` — returns signed S3 URL for client to upload files directly.

**Webhooks**

- `POST /api/webhooks/paypal` — PayPal webhook to verify payments
- `POST /api/webhooks/printer` — optional printer callback handler

---

# 4 — Frontend Route / Component Map

- `/` — landing / template carousel
- `/templates` — all templates with filters (size)
- `/design/:templateId` — personalize flow (image upload for front, title, back text, optional back image)
- `/upload` — upload print-ready PDF + CSV mailing list
- `/proof` — proof viewer with accept/decline buttons
- `/checkout` — PayPal Checkout integration (client side uses PayPal Buttons; server creates order)
- `/admin/login` — admin login
- `/admin/orders` — order queue
- `/admin/orders/:id` — order detail + Approve button

Wireframe notes: proof viewer shows high-res front/back, zoom, and thumbnails. Approve triggers server-side call which returns printer API result and stores PrinterJobId.

---

# 5 — Proof generation approach (recommendation)

Options:

- **Client-side HTML canvas**: for personalized templates that are assembled from HTML/CSS and images; fast and no server cost.
- **Server-side PDF rendering (Puppeteer)**: for print-ready PDFs or to create consistent PNG proofs (useful when validating uploaded PDF).
- **Hybrid**: client shows immediate canvas preview; server re-renders canonical proof (Puppeteer) before payment for final verification.

Recommendation for Phase 1: implement client-side HTML canvas for template personalization (quick) and use server-side Puppeteer for uploaded PDFs and final canonical proofs.

---

# 6 — File storage & assets

Recommended: AWS S3 (or any S3-compatible bucket) for:

- design templates (images)
- uploaded PDFs
- CSV mailing lists
- generated proofs (PNG)
  Use signed pre-signed upload URLs so browser uploads skip backend file streaming.

If you prefer simpler (Phase 1): Render has file storage options; for production use S3.

---

# 7 — PayPal & PostcardMania flow (high level)

**PayPal (recommended):**

- Backend creates PayPal order (server-side) when user confirms proof.
- Frontend redirects user to PayPal or uses PayPal Buttons.
- On capture, PayPal calls your webhook; backend verifies transaction and marks Order.paid.
- After payment confirmation, order status flows to admin queue.

**PostcardMania (printer API):**

- Admin clicks Approve → backend assembles POST to PostcardMania with required files/URLs and order data.
- Store the returned printer job id on order record.
- Optionally, push recipients to LessAnnoyingCRM after approval (if requested).

I will provide the exact PostcardMania request body template (their API docs required) — you’ll need to supply PostcardMania API key so we can map their required fields precisely.

---

# 8 — CI/CD & Deployment notes

- Frontend: Vercel (automatic deploys on merge to main). Environment variables: REACT_APP_API_URL, PAYPAL_CLIENT_ID (public).
- Backend: Render (service + cron if needed). Environment variables: MONGO_URI, S3 creds, PAYPAL_CLIENT_SECRET, POSTCARDMANIA_KEY.
- MongoDB Atlas: restrict IPs to Render/Vercel (or use Atlas private endpoint).
- Use GitHub Actions for tests if you want additional checks before deploy.

---

# 9 — Security & production checklist (high level)

- Enforce HTTPS.
- Store secrets in environment variables (never in repo).
- Hash admin passwords (bcrypt).
- Validate uploaded PDFs and CSVs (size/type checks).
- Rate limit endpoints (anti-abuse).
- Use CSRF protection on forms that perform state-change actions.

---

# 10 — Client-provided items & how to send them (secure)

Please provide the following to proceed with production connections and final testing:

1. **PostcardMania API Key** — _production & sandbox_ if available.
2. **PayPal**: Sandbox credentials (Client ID & Secret) + Production credentials when ready.
3. **Less Annoying CRM**: API User Code & Token (if you want CRM push).
4. **Design Templates**: a zipped package or hosted URLs with:

   - Preview images (at least 1200px wide).
   - The template crop/margins spec, bleed lines (if any).

5. **Domain name** (if you have one) and DNS access to configure Vercel.
6. **GitHub access**: either invite `delpat-llp` (or your dev user) as a collaborator, or give repo admin once created.
7. **Printer/fulfillment preferences**: e.g., return address, paper stock options — if you have them now.

**How to send credentials securely**

- Preferred: Add secrets to your hosting environment (Render & Vercel) when ready.
- Alternate: Use an encrypted file transfer (1) Send via your password manager's secure share link, or (2) Upload to a secured Google Drive/Dropbox folder and share link (set to expire). Do NOT post API keys in chat.

---

# 11 — Small but important implementation decisions I took now (so you don’t need to decide immediately)

- Use JWT for admin sessions.
- Use S3 pre-signed uploads for files.
- Use Puppeteer on the server to create final proofs from HTML/PDFs.
- Use PayPal server-side order creation + webhook verification before marking paid.
- Use a staging/test PostcardMania key before production send.

---
