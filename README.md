# TidelQ v2.0 – Goa Coastal Safety & Environmental Monitor

TidelQ is a robust AI-driven marine safety monitoring system specifically adapted for the vibrant coastline of Goa, India. Utilizing live satellite endpoints, AI generative reporting, and community-driven incident logs—TidelQ maps over 40 distinct Goan beaches to automatically calculate dynamic hazard conditions in real-time.

## Features & Recent Enhancements

### 1. Expanded Geographic Coverage (40 Beaches)
The core database (`src/lib/db.js`) and live Supabase instance have been drastically expanded to track **40 distinct beaches** stretching simultaneously across both North and South Goa (including Candolim, Palolem, Butterfly Beach, Vagator, Arambol, and many more). Every single beach is intricately hardcoded with its precise latitudinal and longitudinal coordinate maps.

### 2. Live Weather Integrated Scoring
Environmental scoring takes real-world meteorological weather heavily into account!
- **WMO Code Translator**: The `copernicus.js` marine layer intercepts Open-Meteo's raw `weathercode` strings and inherently translates them directly into atmospheric states ("Thunderstorm", "Rain Showers", "Fog").
- **AI Prompt Penalties**: The GPT-4o analysis prompt (`llm.js`) has been strictly instructed to automatically slash the beach safety score by 30+ points during Thunderstorms, inherently rendering dangerous beaches completely unadvisable during storms. Deterministic backend fallbacks obey these exact logic decrements natively as well.

### 3. Real-Time Danger Alerts & Browser Push Notifications
The frontend map constantly polls for the latest safety scores every 10 seconds.
- **Strict Color Zones**: The UI rigorously maps the Beach Safety Scores to three major zones: **Green=Safe (80+)**, **Yellow=Moderate (50-79)**, and **Red=Dangerous (<50)**.
- **Automated Push Notifications**: If a beach score drops abruptly from Safe/Moderate down into the Red Danger zone, the application triggers a native **Browser Push Notification** to warn users in real-time to avoid swimming alongside a critical UI banner.

### 4. Advanced Geofenced Spill-over Alerts
When a high-severity community incident (such as an oil spill or severe thunderstorm) is reported via the `/api/reports/submit` endpoint, the system calculates the haversine distance to the nearest coastlines.
- The 2 closest neighbouring beaches immediately receive an automatic **Spill-over System Alert**, deliberately dropping their score into the Danger Zone to proactively clear those beaches before ocean currents or weather systems physically arrive.

### 5. Interactive UI Search Framework
With dozens of endpoints tracked concurrently, the dashboard incorporates an ultra-responsive Search bar directly into the HTML Sidebar. 
- Integrated seamlessly within `public/js/map.js`, typing immediately triggers functional filtering traversing the active dataset in milliseconds down to the target beach name. 
- Top-level analytical statistics natively update their counts to accurately reflect all 40 beaches deployed.

## Setup & Running Locally

Install the required node modules, ensure your environmental keys point towards your Supabase and OpenAI infrastructure inside `.env.local`, and run:

```bash
# Seed the Supabase database with all 40 coordinates
node --env-file=.env.local scripts/seed_beaches.js

# Launch the Application
npm install
npm run dev
```

Your coastal dashboard will be accessible via `http://localhost:3000`.
