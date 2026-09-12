# 🌾 CGM Gujarat Platform
## AI-Powered Cotton & Groundnut Market Linkage Platform

> **Hackathon-ready MVP** built with IBM Bob, IBM Granite LLM, and IBM Cloud  
> Connects cotton and groundnut farmers in Gujarat with buyers through AI-powered market intelligence

---

## 📋 Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [AI Agents](#ai-agents)
- [Setup & Local Development](#setup--local-development)
- [IBM Cloud Deployment](#ibm-cloud-deployment)
- [Demo Credentials](#demo-credentials)
- [API Reference](#api-reference)
- [Mock Data Layer](#mock-data-layer)
- [Roadmap](#roadmap)

---

## Overview

The CGM Gujarat Platform is a full-stack web application that digitizes the cotton and groundnut supply chain in Gujarat, India. It connects farmers directly with buyers, provides AI-powered market intelligence, and eliminates information asymmetry using **IBM Granite LLM** for reasoning.

**Languages supported:** English + Gujarati (ગુજરાતી)

---

## Features

### 🌾 Farmer Portal
- Add crop listings (cotton/groundnut) with quality, quantity, price, location
- Upload crop photos for AI quality grading
- View live/mock mandi prices with 30-day chart
- AI price forecast (7-day trend with SELL NOW / STORE / WAIT recommendation)
- Storage & Selling Advisor with net-gain analysis
- Receive and respond to buyer offers
- Income dashboard with AI insights

### 🏢 Buyer Portal
- Add purchase requirements with quality/price/location criteria
- Browse available farmer listings with filters
- AI Buyer-Farmer Matching (scored compatibility)
- Send offers to farmers
- Track offer status and completed transactions

### ⚙️ Admin Portal
- User management (enable/disable farmers and buyers)
- Crop listings overview
- Add mandi price data manually
- View all platform transactions
- AI Agent activity logs

---

## Architecture

```
cotton-groundnut-platform/
├── backend/                    # Node.js + Express + SQLite
│   ├── src/
│   │   ├── index.js           # Express server entry point
│   │   ├── db/
│   │   │   ├── database.js    # SQLite schema + init
│   │   │   └── seed.js        # Demo data seeder
│   │   ├── agents/
│   │   │   ├── granite.js     # IBM Granite LLM integration
│   │   │   ├── mandiForecasting.js
│   │   │   ├── buyerFarmerMatching.js
│   │   │   ├── storageAdvisor.js
│   │   │   ├── qualityGrading.js
│   │   │   └── incomeDashboard.js
│   │   ├── routes/
│   │   │   ├── auth.js        # Login / Register
│   │   │   ├── farmer.js      # Farmer APIs
│   │   │   ├── buyer.js       # Buyer APIs
│   │   │   ├── admin.js       # Admin APIs
│   │   │   ├── mandi.js       # Mandi price APIs
│   │   │   └── ai.js          # AI agent APIs
│   │   └── middleware/
│   │       └── auth.js        # JWT authentication
│   ├── .env.example
│   └── package.json
│
├── frontend/                   # React + Vite + TailwindCSS
│   ├── src/
│   │   ├── App.jsx            # Route definitions
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── hooks/
│   │   │   └── useApi.js      # Axios instance with JWT
│   │   ├── i18n/
│   │   │   └── translations.js # English + Gujarati
│   │   ├── components/
│   │   │   └── AppLayout.jsx  # Sidebar navigation
│   │   └── pages/
│   │       ├── LoginPage.jsx
│   │       ├── RegisterPage.jsx
│   │       ├── farmer/        # 9 farmer pages
│   │       ├── buyer/         # 5 buyer pages
│   │       └── admin/         # 5 admin pages
│   └── package.json
│
└── README.md
```

---

## AI Agents

All agents use **IBM Granite LLM** (via `@ibm-cloud/watsonx-ai` SDK) and automatically fall back to deterministic mock mode when credentials are not configured.

| Agent | Purpose | Endpoint |
|-------|---------|----------|
| **Mandi Price Forecasting** | Analyzes 30-day price history, predicts 7-day trend | `POST /api/ai/forecast` |
| **Buyer-Farmer Matching** | Scores and ranks farmer listings against buyer requirements | `POST /api/ai/match` |
| **Storage & Selling Advisor** | Calculates net gain for 1–4 week storage scenarios | `POST /api/ai/storage-advice` |
| **Quality Grading** | Grades crop image + notes as Grade A/B/C | `POST /api/ai/quality-grade` |
| **Income Dashboard** | Summarizes earnings, inventory, provides actionable insights | `GET /api/ai/income-dashboard` |

---

## Setup & Local Development

### Prerequisites
- Node.js 18+
- npm 9+

### 1. Clone / extract the project

```bash
cd cotton-groundnut-platform
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your IBM watsonx.ai credentials (optional for mock mode)
# IBM_WATSONX_API_KEY=your_key
# IBM_WATSONX_PROJECT_ID=your_project_id

# Seed demo data
npm run seed

# Start development server
npm run dev
```

Backend runs on: `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs on: `http://localhost:3000`  
(Requests to `/api/*` are proxied to `http://localhost:5000`)

### 4. Production Build

```bash
# Build frontend
cd frontend && npm run build

# The dist/ folder can be served as static files
# Or configure Express to serve it:
# app.use(express.static(path.join(__dirname, '../../frontend/dist')))
```

---

## IBM Cloud Deployment

### Option A: IBM Code Engine (Recommended for Hackathon)

#### 1. Prerequisites
- IBM Cloud account with Code Engine access
- IBM Container Registry (or Docker Hub)
- IBM watsonx.ai project with Granite model access

#### 2. Create IBM watsonx.ai Project
```bash
# Login to IBM Cloud
ibmcloud login

# Create watsonx.ai project via UI at:
# https://dataplatform.cloud.ibm.com/wx/home

# Get your Project ID and API key
ibmcloud resource service-keys --instance-name "Watson Machine Learning"
```

#### 3. Set Environment Variables in .env

```
IBM_WATSONX_API_KEY=your_actual_api_key
IBM_WATSONX_PROJECT_ID=your_project_id
IBM_WATSONX_URL=https://us-south.ml.cloud.ibm.com
GRANITE_MODEL_ID=ibm/granite-13b-chat-v2
JWT_SECRET=your_secure_random_secret_here
NODE_ENV=production
FRONTEND_URL=https://your-code-engine-app.us-south.codeengine.appdomain.cloud
```

#### 4. Build and Push Docker Image

Create `backend/Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "src/index.js"]
```

```bash
# Build and push to IBM Container Registry
ibmcloud cr login
docker build -t us.icr.io/your-namespace/cgm-backend:latest ./backend
docker push us.icr.io/your-namespace/cgm-backend:latest
```

#### 5. Deploy to Code Engine

```bash
# Create Code Engine project
ibmcloud ce project create --name cgm-gujarat-platform

# Deploy backend
ibmcloud ce application create \
  --name cgm-backend \
  --image us.icr.io/your-namespace/cgm-backend:latest \
  --cpu 0.5 --memory 1G \
  --port 5000 \
  --env IBM_WATSONX_API_KEY=$IBM_WATSONX_API_KEY \
  --env IBM_WATSONX_PROJECT_ID=$IBM_WATSONX_PROJECT_ID \
  --env JWT_SECRET=$JWT_SECRET \
  --env NODE_ENV=production

# Get the URL
ibmcloud ce application get --name cgm-backend
```

#### 6. Deploy Frontend to IBM Cloud Object Storage (Static Site)

```bash
# Build frontend
cd frontend
VITE_API_URL=https://your-backend-url npm run build

# Upload to COS static website bucket
ibmcloud cos put-bucket-website --bucket cgm-frontend --website-configuration file://website.json
ibmcloud cos upload-part --bucket cgm-frontend --local-path ./dist
```

### Option B: IBM Kubernetes Service (IKS)

```bash
# Create cluster
ibmcloud ks cluster create classic --name cgm-cluster --zone dal10

# Deploy using kubectl
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

### Option C: Quick Deploy to IBM Cloud Foundry

```bash
# Create manifest.yml in backend/
cat > backend/manifest.yml << EOF
applications:
- name: cgm-gujarat-platform
  memory: 256M
  buildpack: nodejs_buildpack
  command: node src/index.js
  env:
    IBM_WATSONX_API_KEY: your_key
    IBM_WATSONX_PROJECT_ID: your_project_id
    JWT_SECRET: your_secret
    NODE_ENV: production
EOF

cd backend
ibmcloud cf push
```

---

## Demo Credentials

All demo accounts use password: **`password123`**

| Role | Phone | Name |
|------|-------|------|
| Admin | 9000000000 | Admin User |
| Farmer | 9876543210 | Ramesh Patel (Gondal, Rajkot) |
| Farmer | 9876543211 | Bhavesh Mer (Upleta, Rajkot) |
| Farmer | 9876543212 | Haresh Solanki (Keshod, Junagadh) |
| Farmer | 9876543213 | Dinesh Koli (Mahuva, Bhavnagar) |
| Farmer | 9876543214 | Kantibhai Vala (Bagasara, Amreli) |
| Farmer | 9876543215 | Jayesh Nakum (Jodiya, Jamnagar) |
| Buyer | 9876500001 | Ashok Cotton Traders (Ahmedabad) |
| Buyer | 9876500002 | Saurashtra Oil Mills (Rajkot) |
| Buyer | 9876500003 | Gujarat Agro Exports (Surat) |

---

## API Reference

### Authentication
```
POST /api/auth/register    - Register new user
POST /api/auth/login       - Login (returns JWT)
GET  /api/auth/me          - Get current user
```

### Farmer APIs (requires farmer role)
```
GET    /api/farmer/profile
PUT    /api/farmer/profile
GET    /api/farmer/listings
POST   /api/farmer/listings      (multipart with optional image)
PUT    /api/farmer/listings/:id
GET    /api/farmer/offers
POST   /api/farmer/offers/:id/respond  { action: 'accept'|'reject' }
GET    /api/farmer/transactions
```

### Buyer APIs (requires buyer role)
```
GET    /api/buyer/profile
PUT    /api/buyer/profile
GET    /api/buyer/requirements
POST   /api/buyer/requirements
GET    /api/buyer/listings       (filterable: crop_type, district, min_quality, max_price)
POST   /api/buyer/offers
GET    /api/buyer/offers
GET    /api/buyer/transactions
```

### Mandi APIs (authenticated)
```
GET    /api/mandi/prices    ?crop_type=cotton&district=Rajkot&days=30
GET    /api/mandi/latest
GET    /api/mandi/districts
GET    /api/mandi/summary
```

### AI APIs (authenticated)
```
POST   /api/ai/forecast          { crop_type, district }
POST   /api/ai/match             { requirement_id }
POST   /api/ai/storage-advice    { crop_type, district, quantity, current_price, storage_type }
POST   /api/ai/quality-grade     (multipart: crop_type, manual_notes, image)
GET    /api/ai/income-dashboard
```

---

## Mock Data Layer

When `IBM_WATSONX_API_KEY` is not set, all AI agents run in **mock mode**:

- **Mandi Forecasting**: Uses linear regression on seeded historical data
- **Buyer-Farmer Matching**: Uses rule-based scoring (crop, quality, price, location)  
- **Storage Advisor**: Uses price trend calculation with static storage cost tables
- **Quality Grading**: Returns randomized A/B/C grades with realistic explanations
- **Income Dashboard**: Computes all figures from local database

To switch to live IBM Granite:
1. Create an IBM Cloud account
2. Provision Watson Machine Learning
3. Create a watsonx.ai project
4. Add your API key and project ID to `.env`
5. Restart the backend — no other code changes needed

---

## Roadmap

- [ ] Integration with official AGMARKNET mandi price API
- [ ] SMS notifications via IBM Cloud SMS (farmers without smartphones)
- [ ] Multi-language: Hindi support
- [ ] Crop quality certification with QR code
- [ ] Logistics integration (truck booking)
- [ ] Government scheme eligibility checker
- [ ] Mobile app (React Native)
- [ ] IBM Cloud Monitoring + logging integration

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js, Express.js |
| Database | SQLite (via better-sqlite3) |
| AI/LLM | IBM Granite 13B Chat v2 (watsonx.ai) |
| Frontend | React 18, Vite, TailwindCSS |
| Charts | Recharts |
| Icons | Lucide React |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Deployment | IBM Code Engine / IBM Cloud Foundry |

---

## License

MIT License – Built for IBM Hackathon 2024

---

*🌾 CGM Gujarat Platform – Empowering Gujarat farmers with AI-driven market intelligence*  
*Powered by IBM Granite LLM · IBM Cloud · IBM Bob*
