Now we’re moving into the **backend design**. Based on your updated step flow and integration with **PostcardMania**, here’s a structured backend plan. I’ll map out the **roles, flow, database, and API interactions** (using your provided `postcard.postman_collection` as the reference for all PostcardMania API calls).

---

## Backend Architecture

### **Actors**

1. **Admin**

   - Imports design templates from PostcardMania.
   - Decides which templates to make **public**.
   - Reviews/approves orders before sending them to PostcardMania.

2. **Public User**

   - Goes through the 4-step order flow:
     **Select Design → Configure Order → Select Recipients → Review Order**.
   - Can:

     - Use existing public templates.
     - Request a **new design template** from PostcardMania.
     - Edit an existing design (via PostcardMania design editor API).

---

## Backend Flow

### **1. Design Management**

- **Admin → PostcardMania**:

  - GET all design templates from PostcardMania (API call).
  - Store in local DB (with metadata: design_id, name, size, preview_url, etc.).
  - Admin sets `is_public = true` for templates available to users.

- **User → Select Design**:

  - Fetch only templates where `is_public = true`.
  - If user clicks **New Design**, backend requests PostcardMania API to create a new template.
  - If user clicks **Edit Design**, backend calls PostcardMania **Design Editor API** using `design_id`.

---

### **2. Configure Order**

- User selects:

  - Mail class (First Class, etc.)
  - Mail date
  - Brochure fold
  - Return address

- Backend validates + stores in `orders` table (status = `draft`).

---

### **3. Select Recipients (Manual Only)**

- User manually enters recipients.
- Backend saves each record to `recipients` table linked to the order.
- Validate address format before finalization.

---

### **4. Review & Submit Order**

- User reviews order summary.

- On submit:

  - Order status = `pending_admin_approval`.

- **Admin → Approves Order**:

  - Backend packages order data (design_id, configuration, recipients, etc.).
  - Sends **Create Order API request** to PostcardMania.
  - Updates order status = `submitted_to_pcm`.

---

## Database Schema (simplified)

### **designs**

| id | pcm_design_id | name | size | preview_url | is_public | created_at |

### **orders**

| id | user_id | design_id | mail_class | mail_date | brochure_fold | return_address | status | created_at |

### **recipients**

| id | order_id | first_name | last_name | company | address1 | address2 | city | state | zip | external_ref |

### **admins**

| id | name | email | role | created_at |

---

## 🔌 API Endpoints (Backend → Frontend)

### **Public Endpoints**

- `GET /designs/public` → list of public templates

- `POST /designs/new` → request new design from PCM

- `POST /designs/:id/edit` → open design editor via PCM

- `POST /orders` → create draft order

- `PUT /orders/:id/config` → update configuration

- `POST /orders/:id/recipients` → add recipients manually

- `POST /orders/:id/submit` → move order to pending approval

### **Admin Endpoints**

- `GET /admin/designs/import` → fetch latest designs from PCM
- `PUT /admin/designs/:id/public` → toggle visibility
- `GET /admin/orders` → list pending orders
- `POST /admin/orders/:id/approve` → send order to PCM

---

## 🔄 Integration with PostcardMania

- Use the **API definitions from `postcard.postman_collection`**:

  - **Design APIs** → fetch, create, edit
  - **Order APIs** → submit finalized orders

- Backend acts as a **middleware layer**:

  - Caches templates locally
  - Handles order/recipient persistence
  - Only sends _approved_ orders to PCM

---

This design ensures:

- Admin fully controls what templates are public.
- Users can order only from **approved templates**.
- All orders are **admin-approved** before going to PostcardMania.
- API calls are isolated in one integration layer (easy to maintain).

---
