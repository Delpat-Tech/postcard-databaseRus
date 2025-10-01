# Proof & Approve - Frontend (React + Vite)

This is a static frontend skeleton for the MVP, built with React + Vite. No API calls yet — static data is used.

---

## FILE: package.json

{
"name": "proof-approve-frontend",
"version": "1.0.0",
"private": true,
"scripts": {
"dev": "vite",
"build": "vite build",
"preview": "vite preview"
},
"dependencies": {
"react": "^18.2.0",
"react-dom": "^18.2.0",
"react-router-dom": "^6.16.0"
},
"devDependencies": {
"@vitejs/plugin-react": "^4.0.0",
"vite": "^4.4.9"
}
}

---

## FILE: vite.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
plugins: [react()],
})

---

## FILE: index.html

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Proof & Approve</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>

---

## FILE: src/main.jsx

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
<React.StrictMode>
<BrowserRouter>
<App />
</BrowserRouter>
</React.StrictMode>,
)

---

## FILE: src/index.css

body {
margin: 0;
font-family: system-ui, sans-serif;
background: #f9fafb;
}
a {
color: inherit;
text-decoration: none;
}
nav {
padding: 1rem;
background: #2563eb;
color: white;
}
.container {
max-width: 900px;
margin: 0 auto;
padding: 1rem;
}
.card {
background: white;
padding: 1rem;
margin: 1rem 0;
border-radius: 0.5rem;
box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

---

## FILE: src/App.jsx

import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import Templates from './pages/Templates'
import Design from './pages/Design'
import Upload from './pages/Upload'
import Proof from './pages/Proof'
import Checkout from './pages/Checkout'
import Admin from './pages/Admin'

export default function App() {
return (
<>
<nav>
<Link to="/">Proof & Approve</Link> |{' '}
<Link to="/templates">Templates</Link> |{' '}
<Link to="/upload">Upload</Link> |{' '}
<Link to="/admin">Admin</Link>
</nav>
<div className="container">
<Routes>
<Route path="/" element={<Home />} />
<Route path="/templates" element={<Templates />} />
<Route path="/design/:id" element={<Design />} />
<Route path="/upload" element={<Upload />} />
<Route path="/proof" element={<Proof />} />
<Route path="/checkout" element={<Checkout />} />
<Route path="/admin" element={<Admin />} />
</Routes>
</div>
</>
)
}

---

## FILE: src/pages/Home.jsx

export default function Home() {
return (
<div>
<h1>Welcome to Proof & Approve</h1>
<p>Order custom postcards easily. Choose a template or upload your own design.</p>
</div>
)
}

---

## FILE: src/pages/Templates.jsx

import { Link } from 'react-router-dom'

const templates = [
{ id: 1, name: 'Modern Blue', previewUrl: 'https://via.placeholder.com/300x200?text=Modern+Blue' },
{ id: 2, name: 'Minimal White', previewUrl: 'https://via.placeholder.com/300x200?text=Minimal+White' }
]

export default function Templates() {
return (
<div>
<h2>Select a Template</h2>
{templates.map(t => (
<div key={t.id} className="card">
<img src={t.previewUrl} alt={t.name} style={{ maxWidth: '100%' }} />
<h3>{t.name}</h3>
<Link to={`/design/${t.id}`}>Personalize</Link>
</div>
))}
</div>
)
}

---

## FILE: src/pages/Design.jsx

import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function Design() {
const { id } = useParams()
const navigate = useNavigate()
const [title, setTitle] = useState('')
const [text, setText] = useState('')

return (
<div>
<h2>Personalize Template #{id}</h2>
<div className="card">
<label>Front Title:<br />
<input value={title} onChange={e => setTitle(e.target.value)} />
</label>
</div>
<div className="card">
<label>Back Text:<br />
<textarea value={text} onChange={e => setText(e.target.value)} />
</label>
</div>
<button onClick={() => navigate('/proof')}>Preview Proof</button>
</div>
)
}

---

## FILE: src/pages/Upload.jsx

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Upload() {
const [file, setFile] = useState(null)
const [csv, setCsv] = useState(null)
const navigate = useNavigate()

return (
<div>
<h2>Upload Your Design</h2>
<div className="card">
<label>PDF File:
<input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])} />
</label>
</div>
<div className="card">
<label>Mailing List (CSV):
<input type="file" accept=".csv" onChange={e => setCsv(e.target.files[0])} />
</label>
</div>
<button disabled={!file} onClick={() => navigate('/proof')}>Preview Proof</button>
</div>
)
}

---

## FILE: src/pages/Proof.jsx

import { useNavigate } from 'react-router-dom'

export default function Proof() {
const navigate = useNavigate()
return (
<div>
<h2>Digital Proof</h2>
<div className="card">
<img src="https://via.placeholder.com/600x400?text=Front+Preview" alt="Front Proof" />
</div>
<div className="card">
<img src="https://via.placeholder.com/600x400?text=Back+Preview" alt="Back Proof" />
</div>
<button onClick={() => navigate('/checkout')}>Approve & Checkout</button>
</div>
)
}

---

## FILE: src/pages/Checkout.jsx

export default function Checkout() {
return (
<div>
<h2>Checkout</h2>
<p>PayPal button would appear here. (Static demo only)</p>
<button>Pay with PayPal</button>
</div>
)
}

---

## FILE: src/pages/Admin.jsx

export default function Admin() {
const orders = [
{ id: 1, user: 'Jane Doe', product: '6x9 Postcard', status: 'pending' },
{ id: 2, user: 'Acme Inc.', product: '8.5x11 Letter', status: 'pending' }
]
return (
<div>
<h2>Admin Dashboard</h2>
{orders.map(o => (
<div key={o.id} className="card">
<h3>Order #{o.id}</h3>
<p>User: {o.user}</p>
<p>Product: {o.product}</p>
<p>Status: {o.status}</p>
<button>Approve</button>
</div>
))}
</div>
)
}

---

# README.md

# Proof & Approve - Frontend (Static Prototype)

This React + Vite project is a static prototype for Phase 1 frontend. It uses dummy data only (no API calls).

## Features

- Home page
- Template selection
- Personalization form
- Upload flow (PDF + CSV)
- Proof preview
- Checkout placeholder
- Admin dashboard (static orders)

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.
