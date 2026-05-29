Environmental Health Tracker

Real-time environmental monitoring powered by satellite data and AI analysis for future predictions & summary.

Features
- Air Quality — Live AQI data with health metrics
- Forest Fires — NASA VIIRS satellite hotspot detection
- Deforestation — Global Forest Watch tree cover loss mapping
- AI Analysis — Current situation summary and 7-day prediction

Tech Stack
- Frontend: JavaScript, Leaflet.js, HTML/CSS
- Backend: Python, Flask
- APIs: WAQI, NASA FIRMS, Global Forest Watch
- AI: Groq LLM (LLaMA 3.3 70B)

Setup
1. Clone the repo
2. Create "backend/.env" with your API keys
3. Run "pip install -r requirements.txt"
4. Run "python backend/app.py"
5. Open "frontend/index.html" with Live Server

Environment Variables

GROQ_API_KEY=your_key
WAQI_TOKEN=your_key
NASA_KEY=your_key
