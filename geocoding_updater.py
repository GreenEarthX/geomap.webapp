import psycopg2
import json
import requests
import time
from typing import Dict, Optional, Tuple
import logging

# Configuration
GEOCODING_API_KEY = "AIzaSyByBaep-3_T7sj2i0ZyLO_3NYsMvvzh2w0"
GEOCODING_BASE_URL = "https://maps.googleapis.com/maps/api/geocode/json"

# Database connection parameters (adjust these according to your database)
DB_CONFIG = {
    'host': 'pg-354cdef1-mohamedbenkedim-ee47.d.aivencloud.com',
    'port': 22032,
    'database': 'defaultdb',
    'user': 'avnadmin',  # Replace with your username
    'password': 'AVNS_LIAdUuPnKxm2SffIFSB'  # Replace with your password
}

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class GeocodingUpdater:
    def __init__(self, db_config: Dict, api_key: str):
        self.db_config = db_config
        self.api_key = api_key
        self.connection = None
        self.cursor = None
        
    def connect_to_database(self):
        """Establish connection to the database"""
        try:
            self.connection = psycopg2.connect(**self.db_config)
            self.cursor = self.connection.cursor()
            logger.info("Successfully connected to database")
        except Exception as e:
            logger.error(f"Error connecting to database: {e}")
            raise
    
    def close_connection(self):
        """Close database connection"""
        if self.cursor:
            self.cursor.close()
        if self.connection:
            self.connection.close()
        logger.info("Database connection closed")
    
    def get_records_with_coordinates(self) -> list:
        """Fetch all records that have coordinates but missing address fields"""
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
        ORDER BY id
        """
        
        try:
            self.cursor.execute(query)
            records = self.cursor.fetchall()
            logger.info(f"Found {len(records)} records to process")
            return records
        except Exception as e:
            logger.error(f"Error fetching records: {e}")
            raise
    
    def reverse_geocode(self, latitude: str, longitude: str) -> Optional[Dict]:
        """
        Use Google Geocoding API to get address information from coordinates
        """
        params = {
            'latlng': f"{latitude},{longitude}",
            'key': self.api_key,
            'result_type': 'street_address|route|locality|administrative_area_level_1|country'
        }
        
        try:
            response = requests.get(GEOCODING_BASE_URL, params=params)
            response.raise_for_status()
            
            data = response.json()
            
            if data['status'] == 'OK' and data['results']:
                return self.extract_address_components(data['results'][0])
            else:
                logger.warning(f"No results found for coordinates: {latitude}, {longitude}")
                return None
                
        except requests.RequestException as e:
            logger.error(f"Error making geocoding request: {e}")
            return None
        except Exception as e:
            logger.error(f"Error processing geocoding response: {e}")
            return None
    
    def extract_address_components(self, result: Dict) -> Dict:
        """
        Extract street, city, and zip from geocoding result
        """
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
            
            # City (locality or administrative_area_level_2)
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
                # Extract first part of formatted address as street
                parts = formatted_address.split(',')
                if parts:
                    address_info['street'] = parts[0].strip()
        
        return address_info
    
    def update_record(self, record_id: int, address_info: Dict):
        """
        Update a record with new address information
        """
        try:
            # Update the JSONB data with new address fields
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
            
            self.cursor.execute(update_query, (zip_json, city_json, street_json, record_id))
            self.connection.commit()
            
            logger.info(f"Updated record {record_id} with address: {address_info}")
            
        except Exception as e:
            logger.error(f"Error updating record {record_id}: {e}")
            self.connection.rollback()
            raise
    
    def process_records(self, batch_size: int = 10, delay: float = 0.1):
        """
        Process all records in batches with rate limiting
        """
        records = self.get_records_with_coordinates()
        
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
                    logger.warning(f"Record {record_id} has invalid coordinates")
                    continue
                
                logger.info(f"Processing record {record_id} ({i+1}/{len(records)}) - Sector: {sector}")
                
                # Get address information from coordinates
                address_info = self.reverse_geocode(latitude, longitude)
                
                if address_info:
                    # Update the record
                    self.update_record(record_id, address_info)
                    processed += 1
                else:
                    logger.warning(f"Could not geocode record {record_id}")
                    errors += 1
                
                # Rate limiting - pause between requests
                if (i + 1) % batch_size == 0:
                    logger.info(f"Processed {i + 1} records, pausing...")
                    time.sleep(delay * 10)  # Longer pause every batch
                else:
                    time.sleep(delay)
                    
            except Exception as e:
                logger.error(f"Error processing record {record_id}: {e}")
                errors += 1
                continue
        
        logger.info(f"Processing complete. Processed: {processed}, Errors: {errors}")
        return processed, errors

def main():
    """Main function to run the geocoding updater"""
    
    # You need to update the password in DB_CONFIG
    if DB_CONFIG['password'] == 'your_password':
        logger.error("Please update the database password in DB_CONFIG")
        return
    
    updater = GeocodingUpdater(DB_CONFIG, GEOCODING_API_KEY)
    
    try:
        # Connect to database
        updater.connect_to_database()
        
        # Process records
        processed, errors = updater.process_records(batch_size=10, delay=0.1)
        
        logger.info(f"Geocoding update completed. Processed: {processed}, Errors: {errors}")
        
    except Exception as e:
        logger.error(f"Fatal error: {e}")
    finally:
        # Close database connection
        updater.close_connection()

if __name__ == "__main__":
    main()
