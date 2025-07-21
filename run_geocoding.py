#!/usr/bin/env python3
"""
Geocoding Updater Script
This script updates the database with address information (zip, city, street) 
using Google Geocoding API based on existing coordinates.
"""

import psycopg2
import json
import requests
import time
import sys
from typing import Dict, Optional

# Configuration
GEOCODING_API_KEY = "AIzaSyByBaep-3_T7sj2i0ZyLO_3NYsMvvzh2w0"
GEOCODING_BASE_URL = "https://maps.googleapis.com/maps/api/geocode/json"

def get_db_connection():
    """Get database connection - update with your credentials"""
    try:
        connection = psycopg2.connect(
            host='pg-354cdef1-mohamedbenkedim-ee47.d.aivencloud.com',
            port=22032,
            database='defaultdb',
            user='avnadmin',  # Update with your username
            password='AVNS_LIAdUuPnKxm2SffIFSB'  # Update with your password
        )
        return connection
    except Exception as e:
        print(f"Error connecting to database: {e}")
        sys.exit(1)

def reverse_geocode(latitude: str, longitude: str) -> Optional[Dict]:
    """Get address information from coordinates using Google Geocoding API"""
    # Check if coordinates are 0,0 - return null values
    if float(latitude) == 0.0 and float(longitude) == 0.0:
        print(f"Coordinates are 0,0 - keeping address fields as null")
        return {
            'street': None,
            'city': None,
            'zip': None
        }
    
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
        else:
            print(f"No results found for coordinates: {latitude}, {longitude}")
            return None
            
    except Exception as e:
        print(f"Error in geocoding: {e}")
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
        
        print(f"✓ Updated record {record_id} - Street: {address_info['street']}, City: {address_info['city']}, ZIP: {address_info['zip']}")
        
    except Exception as e:
        print(f"✗ Error updating record {record_id}: {e}")
        connection.rollback()
        raise

def main():
    """Main function"""
    print("Starting geocoding updater...")
    
    # Connect to database
    connection = get_db_connection()
    cursor = connection.cursor()
    
    try:
        # Get ALL records that need geocoding from ALL sectors
        query = """
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
        ORDER BY sector, id
        """
        
        cursor.execute(query)
        records = cursor.fetchall()
        
        print(f"Found {len(records)} records to process from ALL sectors")
        
        if not records:
            print("No records need geocoding updates")
            return
        
        processed = 0
        errors = 0
        skipped_zero_coords = 0
        
        # Group records by sector for better logging
        sector_counts = {}
        for _, _, sector in records:
            sector_counts[sector] = sector_counts.get(sector, 0) + 1
        
        print("Records by sector:")
        for sector, count in sector_counts.items():
            print(f"  {sector}: {count} records")
        print()
        
        for i, (record_id, data, sector) in enumerate(records):
            try:
                # Parse the JSONB data
                data_dict = json.loads(data) if isinstance(data, str) else data
                
                # Extract coordinates
                coordinates = data_dict.get('coordinates', {})
                latitude = coordinates.get('latitude')
                longitude = coordinates.get('longitude')
                
                if not latitude or not longitude:
                    print(f"⚠ Record {record_id} ({sector}) has invalid coordinates")
                    continue
                
                print(f"Processing record {record_id} ({i+1}/{len(records)}) - Sector: {sector}")
                print(f"  Coordinates: {latitude}, {longitude}")
                
                # Get address information from coordinates
                address_info = reverse_geocode(latitude, longitude)
                
                if address_info:
                    # Update the record
                    update_record(cursor, connection, record_id, address_info)
                    processed += 1
                    
                    # Check if coordinates were 0,0
                    if float(latitude) == 0.0 and float(longitude) == 0.0:
                        skipped_zero_coords += 1
                else:
                    print(f"⚠ Could not geocode record {record_id} ({sector})")
                    errors += 1
                
                # Rate limiting - pause between requests (only for real API calls)
                if not (float(latitude) == 0.0 and float(longitude) == 0.0):
                    time.sleep(0.1)  # 100ms delay to respect API limits
                
            except Exception as e:
                print(f"✗ Error processing record {record_id} ({sector}): {e}")
                errors += 1
                continue
        
        print(f"\nProcessing complete for ALL sectors!")
        print(f"✓ Successfully processed: {processed}")
        print(f"✗ Errors: {errors}")
        print(f"⚠ Records with 0,0 coordinates (kept as null): {skipped_zero_coords}")
        
        # Final sector summary
        print(f"\nProcessed records from sectors: {', '.join(sector_counts.keys())}")
        
    except Exception as e:
        print(f"Fatal error: {e}")
    finally:
        cursor.close()
        connection.close()
        print("Database connection closed")

if __name__ == "__main__":
    main()
