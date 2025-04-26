from flask import Flask, render_template, request, jsonify
import pandas as pd
import os
from pathlib import Path

app = Flask(__name__)

def get_latest_data():
    data_dir = Path('data')
    csv_files = list(data_dir.glob('tunisie_booking_hotels_*.csv'))
    
    if not csv_files:
        return pd.DataFrame()
    
    # Sort by modification time, newest first
    latest_file = max(csv_files, key=lambda p: p.stat().st_mtime)
    return pd.read_csv(latest_file)


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/hotels')
def get_hotels():
    df = get_latest_data()

    if df.empty:
        return jsonify({"error": "No data available"})
    
    name_query = request.args.get('Name', '').lower()
    min_price = request.args.get('min_price', None)
    max_price = request.args.get('max_price', None)
    rate_query = request.args.get('Rate', None)
    destination_query = request.args.get('Destination', '').lower()

    if name_query:
        df = df[df['Name'].str.lower().str.contains(name_query)]

    if min_price or max_price:
        df['numeric_price'] = df['Price'].str.extract(r'(\d+(?:\.\d+)?)').astype(float)

        if min_price:
            df = df[df['numeric_price'] >= float(min_price)]
        if max_price:
            df = df[df['numeric_price'] <= float(max_price)]

    if rate_query:
        df['numeric_rate'] = df['Rate'].astype(str).str.extract(r'(\d+(?:\.\d+)?').astype(float)

        df = df[df['numeric_rate'] >= float(rate_query)]

    if destination_query:
        df = df[df['Destination'].str.lower().str.contains(destination_query)]
     
    destinations = sorted(df['Destination'].unique().tolist())

    hotels = df.to_dict('records')

    return jsonify({
        "hotels": hotels,
        "destinations": destinations
    })

if __name__ == '__main__':
    app.run(debug=True)





