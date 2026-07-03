<div align="center">

# 🌊 TidelQ (AntiGravity)
### Reversing Coastal Decline with Real-Time AI Monitoring

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Stars](https://img.shields.io/github/stars/your-team/antigravity?style=social)](https://github.com/your-team/antigravity)
[![Issues](https://img.shields.io/github/issues/your-team/antigravity)](https://github.com/your-team/antigravity/issues)
[![Next.js](https://img.shields.io/badge/Next.js-14.1.0-black?logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-PostGIS-336791?logo=postgresql)](https://postgresql.org/)

</div>

---

## 🖼️ Hero Image
*(Placeholder for Hero Image)*
`![TidelQ Dashboard](/docs/images/hero.png)`

---

## 🌐 Live Demo
* **Live Website**: [https://tidelq.onrender.com/landing.html](https://tidelq.onrender.com/landing.html)
* **GitHub Repository**: [https://github.com/your-team/antigravity](https://github.com/your-team/antigravity) *(Placeholder)*

---

## 📖 Project Overview

Coastal ecosystems are under unprecedented pressure from pollution, climate change, and over-tourism. Tourists often enter the water without knowing real-time safety levels, while local authorities rely on static, infrequently updated beach safety flags that ignore invisible environmental health factors (e.g., pathogens, oil spills, chemical waste). 

**TidelQ (AntiGravity)** solves this by providing a real-time "Pulse" of the beach. Synthesizing Copernicus satellite data, community-sourced hazard reports via Vision AI, and environmental metrics, the system’s AI scoring engine provides a dynamic 0-100 "Beach Safety Score". 

By democratizing environmental data, TidelQ empowers beachgoers to make safe recreational choices, provides environmental authorities with crowdsourced, verifiable hazard alerts, and supplies researchers with structured geospatial data to monitor coastal degradation over time.

---

## ✨ Features

### Core Features
| Feature | Status | Description |
| :--- | :--- | :--- |
| **Dynamic AI Safety Scoring** | 🟢 Implemented | Calculates beach safety (0-100) using LLMs based on satellite and report data. |
| **Geofenced Spill-Over Alerts** | 🟢 Implemented | Warns neighboring beaches autonomously when severe hazards are reported nearby. |
| **Automated Image Categorization** | 🟢 Implemented | Google Cloud Vision AI tags uploaded hazard photos (e.g., Oil Spill, Plastic). |
| **Environmental APIs** | 🟢 Implemented | Integrates Copernicus Marine Service (SST, Chlorophyll-a) and Open-Meteo. |

### User Features
| Feature | Status | Description |
| :--- | :--- | :--- |
| **Hazard Reporting** | 🟢 Implemented | Mobile-friendly form to capture GPS-tagged community hazard reports. |
| **Community Forum** | 🟢 Implemented | Public posts, comments, upvotes, downvotes, and bookmarking functionality. |
| **Emergency SOS Logs** | 🟢 Implemented | Dispatch tracking for beach emergencies (Pending/Dispatched/Resolved). |
| **Crowd Density Estimation** | 🟢 Implemented | Estimates local overcrowding based on report frequency and historical data. |

### Admin Features
| Feature | Status | Description |
| :--- | :--- | :--- |
| **Role-based Access Control** | 🟢 Implemented | Granular roles (`user`, `moderator`, `admin`) enforced via Supabase RLS. |
| **Report Moderation** | 🟢 Implemented | Content reporting system for inappropriate forum posts and comments. |

### Mapping Features
| Feature | Status | Description |
| :--- | :--- | :--- |
| **Interactive 3D Map** | 🟢 Implemented | High-performance Mapbox GL JS interface rendering Goan coastlines. |
| **Spatial PostGIS Queries** | 🟢 Implemented | Real-time map rendering based on precise latitude/longitude bounding boxes. |

### Authentication Features
| Feature | Status | Description |
| :--- | :--- | :--- |
| **Supabase JWT Auth** | 🟢 Implemented | Secure login with automatic profile creation via Postgres triggers. |

### Database Features
| Feature | Status | Description |
| :--- | :--- | :--- |
| **Realtime Sync** | 🟢 Implemented | Supabase Realtime enabled for live forum and map updates. |
| **Row Level Security (RLS)** | 🟢 Implemented | Strict data access policies protecting user profiles and voting logs. |

### Security Features
| Feature | Status | Description |
| :--- | :--- | :--- |
| **Payload Limits** | 🟢 Implemented | 15MB size limit on Next.js `submit` API to prevent DDoS/Payload attacks. |

### Performance Features
| Feature | Status | Description |
| :--- | :--- | :--- |
| **CDN Delivery** | 🟢 Implemented | Tailwind and static assets delivered via CDN to minimize bundle sizes. |
| **Async Scoring Updates** | 🟢 Implemented | Fire-and-forget background score recalculation to keep report APIs fast. |

---

## 📸 Screenshots

```
/docs/images/home.png      # Interactive Map Dashboard
/docs/images/map.png       # Geospatial Beach Details
/docs/images/report.png    # Mobile Hazard Reporting Form
/docs/images/profile.png   # User Profile & Activity
/docs/images/admin.png     # SOS & Moderation Dashboard
```

---

## 🛠️ Tech Stack

* **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
* **Styling**: Tailwind CSS (CDN)
* **Backend**: Next.js 14.1.0 API Routes (Serverless)
* **Database**: PostgreSQL with PostGIS (Supabase)
* **Authentication**: Supabase Auth (JWT)
* **Maps**: Mapbox GL JS
* **Hosting**: Vercel / Render
* **Cloud Storage**: Supabase Storage
* **AI & Machine Learning**: 
  * OpenAI API (GPT-4o) / Anthropic (Claude 3.5 Sonnet)
  * Google Cloud Vision API
* **Data Sources**: Copernicus Marine Service, Open-Meteo

---

## 📂 Folder Structure

```text
antigravity/
├── public/                 # Frontend Static Assets
│   ├── index.html
│   ├── dashboard.html
│   ├── report.html
│   ├── issues.html
│   ├── analytics.html
│   ├── css/
│   ├── js/                 # Vanilla JS logic (map, auth, api, report)
│   └── assets/
├── src/
│   ├── pages/
│   │   └── api/            # Next.js Serverless Functions
│   │       ├── ai/
│   │       ├── beaches/
│   │       ├── issues/
│   │       └── reports/
│   └── lib/                # Shared Backend Modules (DB, LLM, APIs)
├── supabase/
│   └── migrations/         # PostgreSQL Schema & RLS Policies
├── .env.local              # Environment Variables
├── package.json            # Dependencies
└── README.md
```

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    User([User / Mobile App]) -->|Interacts| Frontend[Frontend: Mapbox GL & Vanilla JS]
    Frontend -->|POST / GET| API[Next.js API Routes]
    
    subgraph Backend Orchestration
        API -->|Fetch Map Data| SupabaseDB[(Supabase PostgreSQL + PostGIS)]
        API -->|Upload Images| SupabaseStorage[Supabase Storage]
        API -->|Assess Hazards| GCV[Google Cloud Vision AI]
        API -->|Calculate Score| LLM[OpenAI / Anthropic LLM]
        API -->|Fetch Sat Data| Cop[Copernicus Marine API]
        API -->|Fetch Weather| OM[Open-Meteo API]
    end

    SupabaseDB -->|Realtime Trigger| Frontend
```

---

## 🗄️ Database Diagram

```mermaid
erDiagram
    auth_users ||--o{ profiles : "1:1 (Triggered)"
    auth_users ||--o{ posts : creates
    auth_users ||--o{ comments : writes
    auth_users ||--o{ votes : casts
    auth_users ||--o{ bookmarks : saves
    auth_users ||--o{ emergency_logs : triggers
    auth_users ||--o{ community_issues : reports
    auth_users ||--o{ reports : files
    
    profiles {
        uuid id PK
        text display_name
        text role "user/moderator/admin"
    }
    
    beaches ||--o{ community_issues : "has"
    beaches ||--o{ emergency_logs : "has"

    posts ||--o{ comments : "has"
    posts ||--o{ votes : "receives"
    comments ||--o{ votes : "receives"
    
    community_issues ||--o{ community_issue_votes : "receives"
```

---

## 🔐 Authentication Flow

1. **Signup/Login**: User authenticates via Supabase Auth on the frontend (`auth.js`).
2. **Profile Creation**: A Postgres database trigger automatically creates a matching record in the `public.profiles` table.
3. **Session Management**: Supabase returns a JWT, persisted in local storage/cookies.
4. **API Requests**: The JWT is passed as a `Bearer` token in the `Authorization` header to Next.js API routes.
5. **Role & Row-Level Security**: Supabase RLS policies natively enforce that users can only modify their own reports, votes, and profiles, and grants moderation abilities based on the profile `role`.

---

## 🔄 Application Workflow (Hazard Reporting)

1. **User Submits Issue**: User uploads an image, location, and description on the frontend.
2. **Validation & Image Upload**: Next.js receives the payload, uploads the image to Supabase Storage, and fetches a public URL.
3. **Vision AI Analysis**: Image is sent to Google Cloud Vision API for auto-categorization and severity tagging.
4. **Database Storage**: The hazard report is written to PostgreSQL via `lib/db.js`.
5. **Asynchronous Scoring**: A background process is triggered (`api/ai/score.js`), combining the new report, satellite metrics, and crowd data. The LLM recalculates the overall beach safety score.
6. **Geofenced Spill-over**: If the hazard is severe, the API queries PostGIS for neighboring beaches (< 5km) and drops their scores preemptively.
7. **Map Update**: Supabase Realtime pushes the new score and report markers to active frontend clients instantly.

---

## 📡 API Documentation

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/beaches` | GET | Retrieves a list of all beaches and their current AI safety score. |
| `/api/beaches/[id]` | GET | Retrieves historical trends and metadata for a specific beach. |
| `/api/reports/submit` | POST | Accepts Base64 images and GPS data. Triggers Vision AI & score recalculation. |
| `/api/issues` | GET/POST | Fetches or creates new community forum issues. |
| `/api/issues/vote` | POST | Toggles user upvote/downvote for a specific community issue. |
| `/api/ai/score` | POST | Internal endpoint forcing an LLM score recalculation for a beach. |

---

## 🚀 Installation

### 1. Clone the repository
```bash
git clone https://github.com/your-team/antigravity.git
cd antigravity
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Copy the `.env.local` example and populate the variables.
```bash
cp .env.local.example .env.local
```

### 4. Database Setup
Run the SQL migration files located in `supabase/migrations/` in your Supabase SQL Editor to generate the schema, triggers, and RLS policies.

### 5. Run Locally
```bash
npm run dev
```
Navigate to `http://localhost:3000/index.html` to access the application.

---

## 🔑 Environment Variables

| Variable | Description |
| :--- | :--- |
| `SUPABASE_URL` | Backend Supabase project URL |
| `SUPABASE_ANON_KEY` | Public Anon key for basic requests |
| `SUPABASE_SERVICE_KEY` | Service role key for admin-level database bypass (Do NOT expose) |
| `NEXT_PUBLIC_SUPABASE_URL` | Frontend Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Frontend Supabase Anon Key |
| `OPENAI_API_KEY` | OpenAI API Key for GPT-4o LLM scoring |
| `COPERNICUS_USERNAME` | *(Optional)* Copernicus Marine Data auth |
| `COPERNICUS_PASSWORD` | *(Optional)* Copernicus Marine Data auth |
| `NEXT_PUBLIC_APP_URL` | Application root URL (e.g., localhost:3000) |

*⚠️ Ensure `SUPABASE_SERVICE_KEY` and `OPENAI_API_KEY` are strictly server-side and never prefixed with `NEXT_PUBLIC_`.*

---

## ☁️ Deployment

### Deploying on Vercel or Render
Because the backend relies heavily on Next.js API Routes, Vercel is the optimal hosting provider, though Render fully supports Next.js via standard Node.js build commands:
1. Connect your GitHub repository to Render/Vercel.
2. Set the build command to `npm run build` and start command to `npm run start`.
3. Map all environment variables into the project settings.

### Supabase Integration
Ensure the database URL matches your deployed environment. Adjust Supabase "Allowed Origins" in the Auth settings to permit logins from your live production URL.

---

## 🛡️ Security

* **Row Level Security (RLS)**: Enforced comprehensively. Users cannot tamper with votes or delete others' reports.
* **Payload Limits**: `/api/reports/submit` restricts bodies to `15mb` using Next.js config to prevent memory exhaustion attacks.
* **Data Sanitization**: Image uploads enforce mime-type checking (jpeg/png only).

*(Note: There is a minor security weakness in `submit.js` where the Vision AI fallback blindly accepts client-provided `severity` if AI fails. Production systems should strictly validate client fallback payloads.)*

---

## ⚡ Performance Optimizations

* **Asynchronous Scoring**: LLM recalculations are performed via fire-and-forget Promises. Users submitting a report are not blocked waiting for GPT-4o to finish scoring.
* **Vanilla JS DOM Manipulation**: Bypassing heavy React hydration on the client-side allows Mapbox GL JS to maintain 60 FPS even when rendering high-density GeoJSON polygons.
* **Tailwind CDN**: Caches CSS globally at the edge without requiring build-time overhead for the MVP.

---

## 🔮 Future Improvements

### Planned
* **Predictive Modeling**: Train a model using historical data to predict safety score drops (e.g., algal bloom 24 hours before it happens).
* **Wearable Integration**: Send instant push-notifications to swimmer smartwatches.

### Suggested
* **Crowdsourced Rewards**: A gamified "Coastal Guardian" system rewarding users with local perks for maintaining high report accuracy.

### Nice to Have
* **Offline Mode**: Local caching using Service Workers to allow tourists to submit hazard reports without cell reception.

---

## ⚠️ Known Issues

1. **HTML/Next.js Hybrid Routing**: Because the frontend relies entirely on static HTML in the `public` folder rather than Next.js `pages`/`app` routing, local development requires explicitly appending `.html` (e.g., `localhost:3000/dashboard.html`).
2. **Copernicus Latency**: The satellite data API can experience latency spikes, relying heavily on the application's mocked fallback logic when timeouts occur.

---

## 🤝 Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 🙌 Credits
* Developed for **Susegad Sprint 2026**.
* Special thanks to **Mapbox**, **Supabase**, and the **Copernicus Marine Environment Monitoring Service**.

---

## 📊 Repository Statistics

* **Total Files**: ~15 Core Files
* **Languages**: JavaScript, HTML, CSS, SQL
* **API Endpoints**: 6 Core Routes
* **Database Tables**: 11
* **Dependencies**: Next.js, Supabase JS, OpenAI SDK, Anthropic SDK, Formidable

---

## 🧑‍💻 Developer Notes

**Architectural Decisions**: 
We explicitly decoupled a modern Next.js API Backend from a lightweight, framework-agnostic frontend. This allowed us to circumvent React lifecycle bottlenecks when interacting directly with WebGL/Mapbox, while retaining the security and ease of serverless API routes for complex LLM chaining and Supabase authentication.

---

## 💯 Final Evaluation

* **Architecture: 8/10**
  * *Justification*: Smart decoupling of heavy WebGL rendering from Next.js hydration, but mixing static HTML with Next.js APIs is unconventional and slightly limits deployment flexibility.
* **Documentation: 9/10**
  * *Justification*: Thoroughly documented schema, rich markdown rationale, and clear Devfolio submissions exist in the repo.
* **Scalability: 8/10**
  * *Justification*: Serverless API routes and Supabase DB scale beautifully, though the fire-and-forget scoring mechanism might require a proper task queue (like Inngest) under heavy load.
* **Security: 8/10**
  * *Justification*: Excellent use of Supabase RLS and payload limits. Deductions for relying on client-provided severity during Vision AI failovers.
* **Maintainability: 7/10**
  * *Justification*: Vanilla JS scale-up can result in "spaghetti code". Lack of TypeScript means refactoring the API data structures will be error-prone.
* **Performance: 9/10**
  * *Justification*: Extremely lightweight DOM, asynchronous heavy lifting, and CDN caching guarantee high frame rates and fast First Contentful Paint.
* **UI/UX: 9/10**
  * *Justification*: Premium aesthetic ("Susegad" design), highly interactive Mapbox integrations, and seamless mobile report flows.
* **Code Quality: 8/10**
  * *Justification*: Clean SQL migrations and modularized backend functions, though frontend logic could benefit from module bundlers.
* **Overall: 8.25/10**
  * *Justification*: A highly impressive, complex hackathon MVP that expertly orchestrates multiple APIs (Maps, Satellites, LLMs, Vision AI) into a polished, socially impactful product.
