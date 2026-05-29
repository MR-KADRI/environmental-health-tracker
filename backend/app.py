from flask import Flask, jsonify
from flask_cors import CORS
import requests
from flask import Flask, jsonify, request
from groq import Groq

app = Flask(__name__)
CORS(app)

from dotenv import load_dotenv
import os

load_dotenv()

groq_client = Groq(api_key=os.getenv('GROQ_API_KEY'))

@app.route('/api/airquality')
def air_quality():
    lat = request.args.get('lat')
    lng = request.args.get('lng')

    response = requests.get(
            f'https://api.waqi.info/feed/geo:{lat};{lng}/?token={os.getenv("WAQI_TOKEN")}'
        )
    return jsonify(response.json())

@app.route('/api/summary')
def get_summary():
    city = request.args.get('city')
    aqi = request.args.get('aqi')
    dominant = request.args.get('dominant')
    pm25 = request.args.get('pm25')
    pm10 = request.args.get('pm10')
    temp = request.args.get('temp')
    humidity = request.args.get('humidity')

    prompt = f"""
    You are an enviromental analyst. Give a brief, clear summary of the current air quality situation for {city}.

    Current Data:
    - AQI: {aqi}
    - Dominant Pollutant: {dominant}
    - PM2.5: {pm25}
    - PM10: {pm10}
    - Temperature: {temp}°C
    - Humidity: {humidity}%
    
    In 3-4 sentences explain:
    1. How bad is the air quality right now
    2. What is causing it
    3. Health advice for residents
    
    Be direct and practical. No technical jargon. Give in appropiate lining & spacing between the lines & dont cross more then 7 lines.
    """
    reponse = groq_client.chat.completions.create(
        model ="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}]
    )

    return jsonify({
        "summary": reponse.choices[0].message.content
    })


@app.route('/api/fires')
def get_fires():
    lat = float(request.args.get('lat'))
    lng = float(request.args.get('lng'))

    north = lat + 5
    south = lat - 5
    east = lng + 5
    west = lng - 5

    response = requests.get(
        f'https://firms.modaps.eosdis.nasa.gov/api/area/csv/{os.getenv("NASA_KEY")}/VIIRS_SNPP_NRT/{west},{south},{east},{north}/1'
    )

    lines = response.text.strip().split('\n')
    if len(lines) <=1:
        return jsonify({'fires': []})
    
    headers = lines[0].split(',')
    fires= []

    for line in lines[1:]:
        values = line.split(',')
        if len(values) >=2:
            try:
                fires.append({
                    'lat': float(values[0]),
                    'lng': float(values[1]),
                    'brightness': float(values[2]) if len(values) > 2 else 0
                })
            except:
                continue
    return jsonify({'fires': fires})


@app.route('/api/predict')
def get_prediction():
    city = request.args.get('city')
    aqi = request.args.get('aqi')
    dominant = request.args.get('dominant')
    pm25 = request.args.get('pm25')
    pm10 = request.args.get('pm10')
    temp = request.args.get('temp')
    humidity = request.args.get('humidity')

    prompt = f"""
    You are an environmental scientist making a short-term air quality forecast.
    
    Current data for {city}:
    - AQI: {aqi}
    - Dominant Pollutant: {dominant}
    - PM2.5: {pm25}
    - PM10: {pm10}
    - Temperature: {temp}°C
    - Humidity: {humidity}%
    
    Based on this data, predict the air quality situation for the next 3-7 days.
    Consider:
    1. Seasonal patterns for this region
    2. How current pollutant levels typically evolve
    3. Temperature and humidity effects on air quality
    4. Any likely improvement or deterioration
    
    Give a 3-4 sentence prediction. Be specific about expected changes.
    End with a one-line health recommendation for the coming week.
    No technical jargon. Give in appropiate lining & spacing between the lines & dont cross more then 7 lines.
    """

    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}]
    )

    return jsonify({
        "prediction": response.choices[0].message.content
    })


@app.route('/api/report')
def get_report():
    city = request.args.get('city')
    aqi = request.args.get('aqi')
    dominant = request.args.get('dominant')
    temp = request.args.get('temp')

    prompt = f"""
    Write a 5-sentence environmental snapshot for {city}.
    Current AQI: {aqi}, dominant pollutant: {dominant}, temperature: {temp}°C.
    Be concise and factual. No technical jargon.add some news reports too.
    """

    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}]
    )

    return jsonify({
        "report": response.choices[0].message.content
    })


if __name__ == '__main__':
    app.run(debug=True, port=5000)