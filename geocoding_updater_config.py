#!/usr/bin/env python3
"""
Geocoding Updater Script - Configuration Version
This script updates the database with address information (zip, city, street) 
using Google Geocoding API based on existing coordinates.

Before running:
1. Update the database credentials in the DB_CONFIG section below
2. Make sure you have the required packages: pip install psycopg2-binary requests
"""

import psycopg2
import json
import requests
import time
import sys
from typing import Dict, Optional

# ============================================================================
# CONFIGURATION - UPDATE THESE VALUES
# ============================================================================

# Google Geocoding API Configuration
GEOCODING_API_KEY = "AIzaSyByBaep-3_T7sj2i0ZyLO_3NYsMvvzh2w0"
GEOCODING_BASE_URL = "https://maps.googleapis.com/maps/api/geocode/json"

# Database Configuration - UPDATE WITH YOUR CREDENTIALS
DB_CONFIG = {
    'host': 'pg-354cdef1-mohamedbenkedim-ee47.d.aivencloud.com',
    'port': 22032,
    'database': 'defaultdb',
    'user': 'avnadmin',  # Update with your username
    'password': 'YOUR_PASSWORD_HERE',  # *** UPDATE THIS ***
    'sslmode': 'require'  # Add SSL mode for secure connection
}

# Processing Configuration
BATCH_SIZE = 10  # Number of records to process before longer pause
DELAY_BETWEEN_REQUESTS = 0.1  # Delay in seconds between API calls
LIMIT_RECORDS = 50  # Limit number of records to process (remove for all)

# ============================================================================
# FUNCTIONS
# ============================================================================

def get_db_connection():
    """Get database connection"""
    if DB_CONFIG['password'] == 'YOUR_PASSWORD_HERE':
        print("❌ Error: Please update the database password in DB_CONFIG")
        print("   Find the line: 'password': 'YOUR_PASSWORD_HERE'")
        print("   And replace YOUR_PASSWORD_HERE with your actual password")
        sys.exit(1)
    
    try:
        connection = psycopg2.connect(**DB_CONFIG)
        print("✅ Connected to database successfully")
        return connection
    except Exception as e:
        print(f"❌ Error connecting to database: {e}")
        print("\nPlease check your database credentials in DB_CONFIG")
        sys.exit(1)

def reverse_geocode(latitude: str, longitude: str) -> Optional[Dict]:
    """Get address information from coordinates using Google Geocoding API"""
    params = {
        'latlng': f"{latitude},{longitude}",
        'key': GEOCODING_API_KEY,
        'result_type': 'street_address|route|locality|administrative_area_level_1|country'
    }
    
    try:
        response = requests.get(GEOCODING_BASE_URL, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        if data['status'] == 'OK' and data['results']:
            return extract_address_components(data['results'][0])
        elif data['status'] == 'ZERO_RESULTS':
            return {'street': None, 'city': None, 'zip': None}
        else:
            print(f"   ⚠ Geocoding API returned: {data['status']}")
            return None
            
    except Exception as e:
        print(f"   ❌ Error in geocoding: {e}")
        return None

def extract_address_components(result: Dict) -> Dict:
    """Extract street, city, and zip from geocoding result"""
    address_components = result.get('address_components', [])
    
    address_info = {
        'street': None,
        'city': None,
        'zip': None
    }
    
    for component in address_components:
        types = component.get('types', [])
        
        # Street number and route
        if 'street_number' in types:
            street_number = component['long_name']
            if address_info['street']:
                address_info['street'] = f"{street_number} {address_info['street']}"
            else:
                address_info['street'] = street_number
        elif 'route' in types:
            route = component['long_name']
            if address_info['street']:
                address_info['street'] = f"{address_info['street']} {route}"
            else:
                address_info['street'] = route
        
        # City
        elif 'locality' in types:
            address_info['city'] = component['long_name']
        elif 'administrative_area_level_2' in types and not address_info['city']:
            address_info['city'] = component['long_name']
        elif 'administrative_area_level_1' in types and not address_info['city']:
            address_info['city'] = component['long_name']
        
        # Postal code
        elif 'postal_code' in types:
            address_info['zip'] = component['long_name']
    
    # If no street found, try to use formatted_address
    if not address_info['street']:
        formatted_address = result.get('formatted_address', '')
        if formatted_address:
            parts = formatted_address.split(',')
            if parts:
                address_info['street'] = parts[0].strip()
    
    return address_info

def update_record(cursor, connection, record_id: int, address_info: Dict):
    """Update a record with new address information"""
    try:
        update_query = """
        UPDATE project_map 
        SET data = jsonb_set(
            jsonb_set(
                jsonb_set(data, '{zip}', %s::jsonb),
                '{city}', %s::jsonb
            ),
            '{street}', %s::jsonb
        )
        WHERE id = %s
        """
        
        # Convert to JSON strings for JSONB
        zip_json = json.dumps(address_info['zip'])
        city_json = json.dumps(address_info['city'])
        street_json = json.dumps(address_info['street'])
        
        cursor.execute(update_query, (zip_json, city_json, street_json, record_id))
        connection.commit()
        
        # Format output for better readability
        street_display = address_info['street'] or 'N/A'
        city_display = address_info['city'] or 'N/A'
        zip_display = address_info['zip'] or 'N/A'
        
        print(f"   ✅ Updated: Street: {street_display}, City: {city_display}, ZIP: {zip_display}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Error updating record {record_id}: {e}")
        connection.rollback()
        return False

def main():
    """Main function"""
    print("🚀 Starting geocoding updater...")
    print(f"📊 Configuration: Batch size: {BATCH_SIZE}, Delay: {DELAY_BETWEEN_REQUESTS}s")
    
    # Connect to database
    connection = get_db_connection()
    cursor = connection.cursor()
    
    try:
        # Get records that need geocoding
        limit_clause = f"LIMIT {LIMIT_RECORDS}" if LIMIT_RECORDS else ""
        
        query = f"""
        SELECT id, data, sector
        FROM project_map 
        WHERE data->>'coordinates' IS NOT NULL 
        AND data->'coordinates'->>'latitude' IS NOT NULL 
        AND data->'coordinates'->>'longitude' IS NOT NULL
        AND (
            data->>'zip' IS NULL 
            OR data->>'city' IS NULL 
            OR data->>'street' IS NULL
        )
        ORDER BY id
        {limit_clause}
        """
        
        cursor.execute(query)
        records = cursor.fetchall()
        
        print(f"📋 Found {len(records)} records to process")
        
        if not records:
            print("✅ No records need geocoding updates")
            return
        
        processed = 0
        errors = 0
        
        for i, (record_id, data, sector) in enumerate(records):
            try:
                # Parse the JSONB data
                data_dict = json.loads(data) if isinstance(data, str) else data
                
                # Extract coordinates
                coordinates = data_dict.get('coordinates', {})
                latitude = coordinates.get('latitude')
                longitude = coordinates.get('longitude')
                
                if not latitude or not longitude:
                    print(f"⚠ Record {record_id} has invalid coordinates")
                    continue
                
                print(f"\n📍 Processing record {record_id} ({i+1}/{len(records)}) - Sector: {sector}")
                print(f"   Coordinates: {latitude}, {longitude}")
                
                # Get address information from coordinates
                address_info = reverse_geocode(latitude, longitude)
                
                if address_info:
                    # Update the record
                    if update_record(cursor, connection, record_id, address_info):
                        processed += 1
                    else:
                        errors += 1
                else:
                    print(f"   ⚠ Could not geocode record {record_id}")
                    errors += 1
                
                # Rate limiting - pause between requests
                if (i + 1) % BATCH_SIZE == 0:
                    print(f"   ⏸ Batch complete, pausing for {DELAY_BETWEEN_REQUESTS * 10}s...")
                    time.sleep(DELAY_BETWEEN_REQUESTS * 10)
                else:
                    time.sleep(DELAY_BETWEEN_REQUESTS)
                
            except Exception as e:
                print(f"   ❌ Error processing record {record_id}: {e}")
                errors += 1
                continue
        
        print(f"\n🎉 Processing complete!")
        print(f"✅ Successfully processed: {processed}")
        print(f"❌ Errors: {errors}")
        print(f"📊 Total records processed: {processed + errors}")
        
    except Exception as e:
        print(f"💥 Fatal error: {e}")
    finally:
        cursor.close()
        connection.close()
        print("🔌 Database connection closed")

if __name__ == "__main__":
    main()
