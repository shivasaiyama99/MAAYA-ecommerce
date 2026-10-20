# Swarna Sarees & Silk Couture — Production E-Commerce Platform

A production-ready e-commerce platform for authentic handloom sarees (Kanjeevaram, Banarasi, Chanderi, Organza), built with **React/Vite**, **Node.js/Express**, **MongoDB Atlas**, and **Cloudinary**.

---

## 🏛️ System Architecture

| Tier | Technology | Hosting Target | Project Root |
| :--- | :--- | :--- | :--- |
| **Frontend** | React 18, Vite, TailwindCSS, Lucide Icons | **Vercel** | `frontend/` |
| **Backend** | Node.js (ESM), Express, Mongoose, Helmet | **Render** | `backend/` |
| **Database** | MongoDB Atlas (Replica Set / M0/M10) | **Atlas Cloud** | Remote Cluster |
| **Media Storage**| Cloudinary CDN (Direct Buffer Uploads) | **Cloudinary** | Remote Asset Cloud |

---

## 📋 Prerequisites

- **Node.js**: `v18.x` or `v20.x` LTS
- **npm**: `v9.x` or higher
- **MongoDB Atlas Account**: Active cluster with database user credentials
- **Cloudinary Account**: Cloud name, API key, and API secret

---

## ⚡ Quickstart (Local Development)

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd sarees-web

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Files

#### Backend (`backend/.env`)
Copy `backend/.env.example` to `backend/.env` and fill in your values:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<db_user>:<db_pass>@cluster0.mongodb.net/sarees_db?retryWrites=true&w=majority
CLIENT_URL=http://localhost:5173
JWT_SECRET=super_secret_jwt_key_at_least_32_characters_long
ADMIN_EMAIL=admin@sareesweb.com
ADMIN_PASSWORD_HASH=your_bcrypt_hash_or_generate_via_bootstrap
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### Frontend (`frontend/.env`)
Copy `frontend/.env.example` to `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Seed Database & Bootstrap Admin

```bash
cd backend

# Populate initial handcrafted sarees into MongoDB
npm run seed:products

# Create or reset administrator account
npm run bootstrap:admin "YourSecureAdminPassword123!"
```

### 4. Run Locally

In separate terminal windows:
```bash
# Backend (http://localhost:5000)
cd backend
npm start

# Frontend (http://localhost:5173)
cd frontend
npm run dev
```

---

## 🧪 Automated Testing & Production Builds

The test suite covers authentication, role-based access control, product CRUD, inventory deduction, cart persistence, guest merging, and transaction safety.

```bash
cd backend

# Run the complete test suite (116 tests)
npm test

# Run individual test suites
npm run test:auth      # Customer registration, RBAC, JWT, rate limiters (30 tests)
npm run test:products  # Saree catalog, SKU uniqueness, Cloudinary upload (30 tests)
npm run test:flow      # Live storefront listing, PDP, real stock decrement (27 tests)
npm run test:orders    # Price tampering rejection, Buy Now, IDOR, stock restore (29 tests)

# Test frontend production build
cd ../frontend
npm run build
```

---

## 🔐 Environment Variables Reference

### Backend (`backend/.env` / Render Environment)

| Variable | Required in Prod | Description | Example |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | **Yes** | Execution mode (`production` enables security headers and strict CORS) | `production` |
| `PORT` | Auto (Render) | Server port (Render automatically provides `10000`) | `10000` |
| `MONGODB_URI` | **Yes** | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster0.mongodb.net/sarees_db` |
| `CLIENT_URL` | **Yes** | Allowed frontend origin(s) for CORS (comma-separated if multiple) | `https://sarees.vercel.app` |
| `JWT_SECRET` | **Yes** | Cryptographically strong 256-bit secret for signing user tokens | `generate via Render or openssl rand -hex 32` |
| `ADMIN_EMAIL` | **Yes** | Designated email for the store administrator | `admin@sareesweb.com` |
| `ADMIN_PASSWORD_HASH` | Optional | Pre-hashed bcrypt password for automated admin initialization | `$2a$10$...` |
| `CLOUDINARY_CLOUD_NAME` | **Yes** | Cloudinary cloud identifier | `your_cloud_name` |
| `CLOUDINARY_API_KEY` | **Yes** | Cloudinary API access key | `123456789012345` |
| `CLOUDINARY_API_SECRET` | **Yes** | Cloudinary API secret | `your_api_secret` |

### Frontend (`frontend/.env` / Vercel Environment)

| Variable | Required in Prod | Description | Example |
| :--- | :---: | :--- | :--- |
| `VITE_API_URL` | **Yes** | Full base URL pointing to the deployed backend's `/api` | `https://sarees-backend.onrender.com/api` |

---

## 🚀 Step-by-Step Real Deployment Guide

### Phase 1: MongoDB Atlas Configuration
1. Navigate to [cloud.mongodb.com](https://cloud.mongodb.com).
2. **Database Access**:
   - Create a dedicated user (e.g. `sarees_prod_user`).
   - Grant **Read and write to any database** or restrict to the `sarees_db` database.
3. **Network Access**:
   - In **Network Access**, add an IP Access entry.
   - For Render web services (dynamic outbound IPs), add `0.0.0.0/0` (Allow Access from Anywhere) with a strong database user password.
4. **Connection String**:
   - Under **Clusters** -> **Connect** -> **Drivers**, copy the URI:
     `mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/sarees_db?retryWrites=true&w=majority`

---

### Phase 2: Deploy Backend to Render

1. Push your repository to GitHub.
2. Sign in to [dashboard.render.com](https://dashboard.render.com).
3. Click **New +** -> **Web Service**.
4. Connect your GitHub repository.
5. Configure the service settings:
   - **Name**: `sarees-backend` (or your preferred name)
   - **Region**: Choose the region closest to your customers (e.g., Singapore / Frankfurt)
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` (or Starter for 0s cold-starts)
6. Add **Environment Variables** in the Render Dashboard:
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: `<Your MongoDB Atlas URI from Phase 1>`
   - `CLIENT_URL`: `https://your-frontend-project.vercel.app` *(update once Vercel is created)*
   - `JWT_SECRET`: Click **Generate** or use an OpenSSL 32-byte secret
   - `ADMIN_EMAIL`: `admin@sareesweb.com`
   - `CLOUDINARY_CLOUD_NAME`: `<your_cloud_name>`
   - `CLOUDINARY_API_KEY`: `<your_api_key>`
   - `CLOUDINARY_API_SECRET`: `<your_api_secret>`
7. Under **Health Check Path**, enter: `/api/health`.
8. Click **Create Web Service**. Wait for the deployment to finish.
9. Note your backend URL: `https://sarees-backend.onrender.com`. Test health at: `https://sarees-backend.onrender.com/api/health`.

---

### Phase 3: Bootstrap Administrator in Production

To create the production administrator without exposing any public web registration routes:

**Option A (Using Render Shell)**:
1. In the Render Dashboard for your service, open the **Shell** tab.
2. Run:
   ```bash
   npm run bootstrap:admin "YourProductionStrongPassword!"
   ```
3. Optionally seed initial products:
   ```bash
   npm run seed:products
   ```

**Option B (From Local Terminal targeting Atlas)**:
```bash
cd backend
MONGODB_URI="<your_production_atlas_uri>" npm run bootstrap:admin "YourProductionStrongPassword!"
```

---

### Phase 4: Deploy Frontend to Vercel

1. Sign in to [vercel.com](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository.
4. In the configuration screen:
   - **Project Name**: `sarees-frontend`
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** and select `frontend`.
   - **Build and Output Settings**:
     - Build Command: `npm run build`
     - Output Directory: `dist`
     - Install Command: `npm install`
5. Under **Environment Variables**, add:
   - `VITE_API_URL`: `https://sarees-backend.onrender.com/api` *(replace with your actual Render URL from Phase 2)*
6. Click **Deploy**.
7. Once deployed, Vercel provides your live URL (e.g. `https://sarees-frontend.vercel.app`).
8. Notice that `frontend/vercel.json` already includes SPA rewrites (`/(.*) -> /index.html`), ensuring deep page refreshes like `/shop/123` or `/admin/dashboard` work cleanly without 404s.

---

### Phase 5: Final Production Linking & Verification

1. Go back to **Render Dashboard** -> **Environment**.
2. Update `CLIENT_URL` to your exact Vercel production domain:
   ```
   CLIENT_URL=https://sarees-frontend.vercel.app
   ```
   *(If you also have a custom domain like `https://swarnasarees.com`, supply both comma-separated: `https://sarees-frontend.vercel.app,https://swarnasarees.com`)*.
3. Render will redeploy with strict production CORS locked to your Vercel frontend.

---

## 🛡️ Production Readiness & Security Checklist

- [x] **Database Isolation**: No hardcoded database credentials in codebase; `MONGODB_URI` read from environment.
- [x] **Secure Admin**: No public admin registration endpoint; admin provisioned strictly via CLI bootstrap.
- [x] **CORS Enforcement**: Strict origin validation; no localhost or wildcards in production.
- [x] **Security Headers**: `helmet` enabled with cross-origin resource policy.
- [x] **Brute-Force & Rate Limiting**: `express-rate-limit` with `trust proxy: 1` on login, registration, and global `/api`.
- [x] **Error Sanitization**: Error handler masks internal 500 stacks in production.
- [x] **Sensitive Data Redaction**: Production logger redacts passwords, tokens, cookies, and database URIs.
- [x] **File Upload Restrictions**: Multer memory storage, 5MB limit, and MIME type validation.
- [x] **Price Tampering Defense**: Totals recalculated from database prices; client prices discarded.
- [x] **Inventory Safeguards**: Atomic stock decrements on purchase; stock restored on order cancellation.
- [x] **IDOR Protection**: Order queries verify customer ownership or administrative privileges.
- [x] **Vercel SPA Routing**: `frontend/vercel.json` rewrite rules configured.
- [x] **Cold Start Resilience**: Axios timeout extended to 45s with descriptive retry messages.
- [x] **Dependencies Clean**: 0 production vulnerabilities across backend and frontend dependencies.

---

## 📞 Support & Maintenance

For questions or production assistance, visit the store administrator portal at `/admin/dashboard` or review backend health at `/api/health`.
