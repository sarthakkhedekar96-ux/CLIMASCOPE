# CLIMASCOPE – Climate Intelligence & Resilience Platform

Enterprise-grade municipal climate intelligence platform designed for city-level environmental deterioration detection, causal investigation, risk prediction, intervention simulation, budget optimization, and empirical action verification.

---

## 🏛️ System Architecture

CLIMASCOPE is built on a modular full-stack architecture combining high-performance deterministic biophysical computation with a command-center user interface inspired by Bloomberg Terminal and geospatial intelligence systems.

```
CLIMASCOPE/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/       # Versioned API routes
│   │   │   ├── health.py           # Core operational telemetry
│   │   │   ├── wards.py            # Ward registry & GeoJSON boundaries
│   │   │   ├── metrics.py          # Citywide & time-series telemetry
│   │   │   ├── interventions.py    # Knapsack budget optimizer
│   │   │   ├── evidence.py         # Causal Evidence Graph
│   │   │   └── ledger.py           # Climate Action Ledger & verifications
│   │   ├── core/
│   │   │   ├── config.py           # Typed environment settings
│   │   │   └── database.py         # SQLAlchemy engine & PostGIS integration
│   │   ├── models/                 # SQLAlchemy 2.0 ORM models
│   │   │   ├── base.py             # Timestamp & ID mixins
│   │   │   ├── ward.py             # Spatial administrative wards
│   │   │   ├── climate_metric.py   # Radiometric observations & simulations
│   │   │   ├── intervention.py     # Resilience interventions
│   │   │   ├── evidence.py         # Evidence graph nodes & causal edges
│   │   │   └── ledger.py           # Tamper-evident action ledger
│   │   ├── schemas/                # Pydantic v2 data contracts
│   │   ├── services/
│   │   │   └── climate_engine.py   # Deterministic biophysical calculations
│   │   ├── data/
│   │   │   └── seed_data.py        # Municipal demonstration dataset
│   │   └── main.py                 # FastAPI application entrypoint
│   ├── tests/
│   │   └── verify_endpoints.py     # Backend verification test suite
│   ├── requirements.txt            # Python dependencies
│   └── run.py                      # Development runner
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/             # MetricCard, Badge, Ticker, LoadingState
│   │   │   ├── layout/             # Header, WorkflowNavigation, Sidebar, Shell
│   │   │   └── views/              # 7-Stage Core Workflow Views
│   │   │       ├── DetectView.tsx       # Phase 1: Detect
│   │   │       ├── InvestigateView.tsx  # Phase 2: Investigate
│   │   │       ├── PredictView.tsx      # Phase 3: Predict
│   │   │       ├── SimulateView.tsx     # Phase 4: Simulate
│   │   │       ├── PrioritizeView.tsx   # Phase 5: Prioritize
│   │   │       ├── ActView.tsx          # Phase 6: Act
│   │   │       └── VerifyView.tsx       # Phase 7: Verify
│   │   ├── hooks/                  # useWards, telemetry hooks
│   │   ├── services/               # Typed API client
│   │   ├── types/                  # Strict TypeScript API interfaces
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
└── README.md
```

---

## 🧭 The 7 Core Workflow Phases

1. **Detect**: Municipal anomaly detection, land surface temperature anomalies, canopy deficits, and baseline Climate Debt Score calculation.
2. **Investigate**: Causal Evidence Graph connecting root causes (e.g. 85.2% impervious coverage) through biophysical stressors to population impacts.
3. **Predict**: Multi-decadal risk projections downscaled across IPCC SSP2-4.5 and SSP5-8.5 emissions scenarios (2030, 2035, 2040, 2050).
4. **Simulate**: Urban Climate Twin microclimate sandbox modeling localized surface cooling and stormwater attenuation from retrofits in real time.
5. **Prioritize**: Budget-Constrained Intervention Optimizer using multi-attribute knapsack optimization to identify Pareto-optimal capital deployment.
6. **Act**: Municipal work order issuance, contractor deployment tracking, and milestone disbursements.
7. **Verify**: Post-intervention empirical satellite audit calculating Delta NDVI and Delta LST with SHA-256 integrity hash verification.

---

## ⚡ Quickstart & Execution

### 1. Backend Service
```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Run backend test suite
python tests/verify_endpoints.py

# Launch FastAPI development server (runs on port 8000)
python run.py
```
Backend API docs will be available at: `http://localhost:8000/api/v1/docs`

### 2. Frontend Command Center
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (if not already installed)
npm install

# Run Vite development server (runs on port 5173 with proxy to 8000)
npm run dev

# Or build production assets
npm run build
```
Frontend command center will be available at: `http://localhost:5173`
Use hotkeys `1` through `7` to immediately jump between workflow phases.
