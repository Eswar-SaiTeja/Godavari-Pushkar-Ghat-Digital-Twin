# Godavari Pushkar Ghat 3D Digital Twin & Intelligent Simulator
### Rajamahendravaram, Andhra Pradesh, India

An AI-powered 3D Digital Twin and command simulator of the Godavari Pushkar Ghat riverfront corridor, built with **React 18**, **TypeScript**, **Vite**, **CesiumJS**, and **Google Gemini Generative AI**.

Designed for district administration, police command centers, SDRF disaster response, municipal commissioners, and temple festival authorities during the Godavari Pushkaram festival.

---

## 🌟 Key Capabilities & Operational Modules

### 1. 3D Geospatial Command Center (CesiumJS)
- **High-Resolution Riverfront Corridor:** 3D visualization of Pushkar Ghat, Kotilingala Ghat, Markandeya Ghat, Saraswati Ghat, and VIP corridors.
- **Hydrological River Gauge:** CWC Godavari river gauge monitoring (13.80m MSL vs 17.50m Danger threshold) and Dowleswaram Barrage discharge tracking (325,000 cusecs).
- **Landmark Geofencing & Camera Waypoints:** Real-time camera navigation to sacred bathing steps, temples, Road-cum-Rail bridge, and municipal holding areas.
- **GIS Fallback Architecture:** Supports OpenStreetMap raster tiles and WGS84 Ellipsoid terrain with zero-token fallback.

### 2. Multi-Horizon AI Crowd Prediction Engine
- **Configurable Forecast Horizons:** Real-time 15-minute, 30-minute, and 60-minute predictive accumulation modeling.
- **Confidence Bounds:** Displays statistical lower, median, and upper bounds with a 95% Confidence Interval (CI).
- **Crowd Surge & Bottleneck Detection:** Statistical Z-score anomaly scanning across 7 ghat sectors to identify inflow/outflow stalling and tier congestion before stampede thresholds occur.

### 3. A* Evacuation Optimization & Dynamic Routing
- **Clearance Benchmark:** Evaluates multi-path dynamic egress routes from riverfront bathing steps to arterial assembly points.
- **A\* Pathfinding Efficiency:** Delivers +43.1% clearance time improvement by dynamically routing pedestrian cohorts through secondary VIP corridors and Municipal Stadium evacuation routes.
- **Human-in-the-Loop Sign-Off:** Automated actions are placed in a strictly pending state until authorized by a Human Duty Commander.

### 4. MCDA Resource Allocation & Emergency Dispatch
- **Multi-Criteria Decision Analysis (MCDA):** Optimal matching and deployment of 108 Ambulances, APSP Police patrols, NDRF/SDRF water rescue boats, and medical triage camps.
- **Live Travel ETAs:** Calculates road-network routing and arrival ETAs for nearest responders.

### 5. Conversational Command Copilot – JARVIS
- **Multilingual Command Assistant:** Native comprehension and responses in **Telugu (తెలుగు)**, **English**, and **Hindi (हिन्दी)**.
- **Grounded Telemetry:** Direct read-only access to GIS landmarks, simulated crowd counts, active incident severities, and hydrological telemetry.
- **Interactive Map Actions:** Automatically flies the 3D globe camera, illuminates evacuation routes, or highlights active sectors.
- **Voice Input:** Hands-free operational dictation powered by Web Speech API.

### 6. Operations SITREP Reporting & Trilingual Announcements
- **8-Category Situation Reports:** Daily Operations, Crowd Management, Incident Summaries, Dispatch Performance, Resource Utilization, Zone Status, Evacuation Comparisons, and Anomalies.
- **Multi-Format Export:** Instant browser print/PDF styling, structured CSV tables, and raw JSON data.
- **Public Address (PA) Matrix:** Generates trilingual crowd announcements with explicit `DEMONSTRATION ONLY` disclaimers for simulated drills.

### 7. Gemini API Quota Handling & Circuit Breaker Architecture
- **HTTP 429 Resilience:** Detects Google RPC `RESOURCE_EXHAUSTED` errors and parses exact cooldown timestamps.
- **Server-Side Circuit Breaker:** Shields Google's API during quota exhaustion; serves verified local mock models in ~2ms.
- **Exponential Backoff:** Configurable retry for short transient rate limits ($\le 15$s).
- **Manual Retry Action:** Operator-controlled "Retry Connection Now" button with live countdown timers.
- **Transparent SIMULATED Labeling:** Clear visual distinction between live Gemini outputs and deterministic simulator responses.

---

## 🛠️ Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, KaTeX Math rendering
- **3D Geospatial Engine:** CesiumJS v1.146.0, `vite-plugin-cesium`
- **AI Backend Gateway:** Node.js HTTP router, `@google/genai` (Official Google Gen AI SDK)
- **Database Dependency:** **Zero External Database** (Zero SQL/NoSQL setup required)
- **Persistence:** Browser `localStorage` for report history and HUD layouts; server in-memory sliding-window caches
- **Production Hosts:** Vercel (Frontend & Serverless API) / Render & Railway & Fly.io (Standalone AI Server)

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js v18.0.0 or higher
- npm v9.0.0 or higher

### Installation

1. Clone repository:
```bash
git clone https://github.com/Eswar-SaiTeja/Godavari-Pushkar-Ghat-Digital-Twin.git
cd Godavari-Pushkar-Ghat-Digital-Twin
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment (Optional - works in offline Mock Mode without keys):
```bash
cp server/.env.example server/.env
# Edit server/.env and add your GEMINI_API_KEY if desired:
# GEMINI_API_KEY=your_key_here
# GEMINI_MODEL=gemini-3.5-flash
```

4. Start development server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📦 Production Build & Deployment

### Build Command
```bash
npm run build
```
Generates production assets in `dist/`, including minified bundles and CesiumJS assets.

### Standalone Production Server
```bash
npm start
# Listens on http://0.0.0.0:5174 (or process.env.PORT)
```

### Deploying Frontend to Vercel + Backend to Render (Recommended Architecture)

#### Step 1: Deploy Backend to Render
1. Open [Render Dashboard](https://dashboard.render.com/) and click **New +** $\rightarrow$ **Web Service** (or **Blueprint** using `render.yaml`).
2. Connect your GitHub repository: `Eswar-SaiTeja/Godavari-Pushkar-Ghat-Digital-Twin`.
3. Configure Service:
   - **Name**: `godavari-twin-backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm run start`
   - **Health Check Path**: `/health`
4. Add Environment Variables in Render:
   - `GEMINI_API_KEY`: `<Your Google Gemini API Key>`
   - `GEMINI_MODEL`: `gemini-2.5-flash`
   - `CORS_ORIGIN`: `*` (or your Vercel domain once deployed)
5. Click **Deploy Web Service**. Render provides a URL (e.g. `https://godavari-twin-backend.onrender.com`).

#### Step 2: Deploy Frontend to Vercel
1. Open [Vercel Dashboard](https://vercel.com/new) and import `Eswar-SaiTeja/Godavari-Pushkar-Ghat-Digital-Twin`.
2. Framework Preset: **Vite** (Root Directory: `./`).
3. Add Environment Variable in Vercel:
   - `VITE_API_BASE_URL`: `https://godavari-twin-backend.onrender.com` (your Render URL from Step 1)
4. Click **Deploy**. Vercel serves the high-performance 3D React/Cesium application globally with edge caching.

---

### Alternative: All-in-One Vercel Full-Stack
If you prefer deploying everything on Vercel without a separate Render service:
1. Import repository into Vercel.
2. Add `GEMINI_API_KEY` and `GEMINI_MODEL=gemini-2.5-flash` in Vercel Environment Variables.
3. Deploy! The serverless AI functions (`api/ai/*`) handle all requests directly.

---

## 🧪 Automated QA Verification Suites

Run the complete 55-test verification suite:
```bash
npx tsx scripts/verify_gemini_ai_layer.ts
npx tsx scripts/verify_predictive_intelligence.ts
npx tsx scripts/verify_ai_reporting_and_announcements.ts
npx tsx scripts/verify_gooey_and_overview.ts
```

---

## 🔒 Security & Data Integrity

- `GEMINI_API_KEY` is strictly managed server-side and excluded from version control (`.gitignore`).
- Zero secret keys or `VITE_` credentials exist in compiled frontend client bundles.
- All simulated and synthetic telemetry is explicitly labeled as `SIMULATED` to prevent real-world confusion.

---

## 📄 License

Developed for the Godavari Pushkar Ghat 3D Digital Twin & Intelligent Simulator Project. All rights reserved.
