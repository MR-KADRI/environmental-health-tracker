
// L -> leaflet cmds
const map = L.map('map', {
    minZoom: 2,
    maxZoom: 18,
    worldCopyJump: false,
    maxBounds: [[-90, -180], [90, 180]],
    maxBoundsViscosity: 1.0
}).setView([20 , 0], 2) //map centered on world view
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap © CartoDB'
}).addTo(map)
const recentReports = []
let activeLayer = 'airquality'

document.getElementById('btnAirQuality').addEventListener('click', () => {
    setActiveLayer('airquality')
})
document.getElementById('btnFires').addEventListener('click', () => {
    setActiveLayer('fires')
})
document.getElementById('btnDeforestation').addEventListener('click', () => {
    setActiveLayer('deforestation')
    loadDeforestation()
})

function setActiveLayer(layer) {
    activeLayer = layer
    document.querySelectorAll('.topBtn').forEach(btn => btn.classList.remove('active'))
    const btnMap = {
        'airquality': 'btnAirQuality',
        'fires': 'btnFires',
        'deforestation': 'btnDeforestation'
    }
    document.getElementById(btnMap[layer]).classList.add('active')
    document.getElementById('areaInfo').innerHTML = `
        <p class="placeholder">Click anywhere on the map to load data.</p>
    `
}

map.on('click', (e) => {
    const { lat, lng } = e.latlng
    if(activeLayer === 'airquality') {
        loadAirQuality(lat, lng)
    } else if(activeLayer === 'fires') {
        loadFires(lat, lng)
    }
})


    
let currentMarker = null
async function loadAirQuality(lat, lng) {
    document.getElementById('areaInfo').innerHTML = `<p class="placeholder">Loading...</p>`
    try {
        const response = await fetch(
            `http://127.0.0.1:5000/api/airquality?lat=${lat}&lng=${lng}`
        )
        const data = await response.json()
        
        if(data.status !== 'ok') {
            document.getElementById('areaInfo').innerHTML = `<p>No data for this area.</p>`
            return
        }

        const d = data.data
        const aqi = d.aqi
        const city = d.city.name
        const dominant = d.dominentpol
        const iaqi = d.iaqi

        // color code the AQI
        let aqiColor = '#4ecca3'
        let aqiLabel = 'Good'
        if(aqi > 50)  { aqiColor = '#ffd700'; aqiLabel = 'Moderate' }
        if(aqi > 100) { aqiColor = '#ff9500'; aqiLabel = 'Unhealthy for Sensitive' }
        if(aqi > 150) { aqiColor = '#ff4444'; aqiLabel = 'Unhealthy' }
        if(aqi > 200) { aqiColor = '#9b30ff'; aqiLabel = 'Very Unhealthy' }
        if(aqi > 300) { aqiColor = '#7e0023'; aqiLabel = 'Hazardous' }

        if(currentMarker) map.removeLayer(currentMarker)
        currentMarker = L.circleMarker([d.city.geo[0], d.city.geo[1]], {
        color: aqiColor,
        fillColor: aqiColor,
        radius: 10
        }).addTo(map).bindPopup(`<b>${city}</b><br>AQI: ${aqi}`).openPopup()
        
        document.getElementById('areaInfo').innerHTML = `
        
            <p><strong>📍 ${city}</strong></p>
            <p>AQI: <span style="color:${aqiColor}; font-size:20px"><strong>${aqi}</strong></span></p>
            <p style="font-size:14px; color:#ff4444">
            ⚠️ Nearest station with data</p>
            <p>Dominant Pollutant: ${dominant.toUpperCase()}</p>
            <hr/>
            <p>PM2.5: ${iaqi.pm25?.v ?? 'N/A'}</p>
            <p>PM10: ${iaqi.pm10?.v ?? 'N/A'}</p>
            <p>NO2: ${iaqi.no2?.v ?? 'N/A'}</p>
            <p>CO: ${iaqi.co?.v ?? 'N/A'}</p>
            <p>Temperature: ${iaqi.t?.v?.toFixed(1) ?? 'N/A'}°C</p>
            <p>Humidity: ${iaqi.h?.v?.toFixed(1) ?? 'N/A'}%</p>
            <hr/>
            <p style="font-size:12px">Updated: ${d.time.s}</p>
<div style="margin-top:14px">
    <button id="summaryBtn" style="width:100%; margin-bottom:8px">
        Current Situation Summary
    </button>
    <div id="summaryContent" style="
        font-size:15px;
        line-height:1.6;
        color:#f2f2f2;
        background:#1a2535;
        padding:10px;
        border-radius:6px;
        display:none
    "></div>
</div>
<button id="predictBtn" style="width:100%; margin-bottom:8px; background:#1a2535; color:#4ecca3; border: 1px solid #4ecca3;">
    Predicted Situation
</button>
<div id="predictionContent" style="
    font-size:15px;
    line-height:1.6;
    color:#f2f2f2;
    background:#1a2535;
    padding:10px;
    border-radius:6px;
    display:none;
    margin-bottom:8px;
"></div>
    `
    document.getElementById('summaryBtn').addEventListener('click', () => {
    getAISummary(
        city, aqi, dominant,
        iaqi.pm25?.v ?? 0,
        iaqi.pm10?.v ?? 0,
        iaqi.t?.v ?? 0,
        iaqi.h?.v ?? 0
    )
    generateReport(city, aqi, dominant, iaqi.t?.v ?? 0)
    document.getElementById('predictBtn').addEventListener('click', () => {
    getAIPrediction(
        city, aqi, dominant,
        iaqi.pm25?.v ?? 0,
        iaqi.pm10?.v ?? 0,
        iaqi.t?.v ?? 0,
        iaqi.h?.v ?? 0
    )
})
})

    } catch(error) {
        document.getElementById('areaInfo').innerHTML = `<p>Error loading data.</p>`
        console.log("Error:", error)
    }
}

map.on('click', (e) => {
    const { lat, lng } = e.latlng
    const layer = document.getElementById('dataLayer').value
    
    document.getElementById('areaInfo').innerHTML = `<p>Loading data...</p>`
    
    if(layer === 'airquality') {
        loadAirQuality(lat, lng)
    }
})

async function getAISummary(city, aqi, dominant, pm25, pm10, temp, humidity) {
    document.getElementById('summaryContent').style.display = 'block'
    document.getElementById('summaryContent').innerHTML = 'Analyzing...'
    document.getElementById('summaryContent').innerHTML = 'Analyzing...'
    
    try {
        const params = new URLSearchParams({city, aqi, dominant, pm25, pm10, temp, humidity})
        const response = await fetch(`http://127.0.0.1:5000/api/summary?${params}`)
        const data = await response.json()
        
        document.getElementById('summaryContent').innerHTML = data.summary
    } catch(error) {
        document.getElementById('summaryContent').innerHTML = 'Failed to load summary.'
    }
}

let fireMarkers = []
async function loadFires(lat, lng){
    fireMarkers.forEach(m => map.removeLayer(m))
    fireMarkers = []
    document.getElementById('areaInfo').innerHTML = `<p class = "placeholder">Loading...</p>`

    try{
        const response = await fetch(
            `http://127.0.0.1:5000/api/fires?lat=${lat}&lng=${lng}`
        )
        const data = await response.json()
        if(data.fires.length == 0){
            document.getElementById('areaInfo'.innerHTML = `
                <p class = "placeholder"> No active fires detected in this area.</p>`)
            return
        }
        data.fires.forEach(fire => {
            const marker = L.circleMarker([fire.lat, fire.lng],{
                color: '#ff4444',
                fillColor: '#ff4444',
                fillOpacity: 0.7,
                radius: Math.min(fire.brightness / 50, 12)
            }).addTo(map)
            .bindPopup(`Fire Detected<br>Brightness: ${fire.brightness}K`
            )
            fireMarkers.push(marker)
        })

         document.getElementById('areaInfo').innerHTML = `
            <p><strong>🔥 Active Fires Detected</strong></p>
            <p style="font-size:13px; margin-top:8px">
                Found <span style="color:#ff4444; font-weight:700">${data.fires.length}</span> 
                fire hotspots within 550km
            </p>
            <p style="font-size:12px; color:#7a8a9a; margin-top:8px">
                Data source: NASA VIIRS satellite (last 24hrs)
            </p>
            <p style="font-size:12px; color:#7a8a9a; margin-top:4px">
                Circle size = fire intensity
            </p>
        `

    } catch(error) {
        document.getElementById('areaInfo').innerHTML = `<p class="placeholder">Error loading fire data.</p>`
        console.log(error)
    }
    }


let deforestationLayer = null
function loadDeforestation(){
    if(deforestationLayer){
        map.removeLayer(deforestationLayer)
        deforestationLayer = null
        document.getElementById('areaInfo').innerHTML = `
        <p class="placeholder">Deforestation layer removed.</p>`
        return
    }
    deforestationLayer = L.tileLayer(
        'https://tiles.globalforestwatch.org/umd_tree_cover_loss/v1.10/tcd_30/{z}/{x}/{y}.png',
        {
            opacity: 0.7,
            attribution: '© Global Forest Watch'
        }
    ).addTo(map)
     document.getElementById('areaInfo').innerHTML = `
        <p><strong>🌳 Deforestation Layer Active</strong></p>
        <p style="font-size:12px; color:#7a8a9a; margin-top:8px">
            Showing tree cover loss 2001-2023
        </p>
        <p style="font-size:12px; color:#ff4444; margin-top:4px">
            ● Pink/Red areas = forest loss
        </p>
        <p style="font-size:12px; color:#7a8a9a; margin-top:4px">
            Source: Hansen/UMD/Google/USGS/NASA
        </p>
        <p style="font-size:12px; color:#4ecca3; margin-top:8px">
            Click Deforestation again to remove layer.
        </p>
    `
}
    
async function getAIPrediction(city, aqi,dominant, pm25, pm10,temp, humidity) {
    document.getElementById('predictionContent').style.display = 'block'
    document.getElementById('predictionContent').innerHTML = 'Analyzing trends...'

    try{
        const params = new URLSearchParams({city, aqi, dominant, pm25, pm10, temp, humidity})
        const response = await fetch(`http://127.0.0.1:5000/api/predict?${params}`)
        const data = await response.json()

        document.getElementById('predictionContent').innerHTML = data.prediction

    } catch(error){
        document.getElementById('predictionContent').innerHTML = 'Failed to load prediction'
    }
    
}

async function generateReport(city, aqi, dominant, temp) {
    try{
            const params = new URLSearchParams({city, aqi, dominant, temp})
        const response = await fetch(`http://127.0.0.1:5000/api/report?${params}`)
        const data = await response.json()

        recentReports.unshift({
            city,
            aqi,
            dominant,
            report: data.report,
            time: new Date().toLocaleTimeString()
        })

        if(recentReports.length > 6) recentReports.pop()

        document.getElementById('reportsList').innerHTML = recentReports.map(r => `
            <div class="report-card">
                <div class="report-city">📍 ${r.city}</div>
                <div class="report-aqi">AQI: <strong>${r.aqi}</strong> — ${r.dominant.toUpperCase()}</div>
                <div class="report-summary">${r.report}</div>
                <div class="report-time">${r.time}</div>
            </div>
        `).join('')

    } catch(error) {
        console.log('Report error:', error)
    }
}   
    
    
