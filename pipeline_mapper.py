import json
import psycopg2
from datetime import datetime
import sys

def connect_to_database():
    """Establish connection to PostgreSQL database"""
    try:
        conn = psycopg2.connect(
            host="localhost",
            port=5434,
            user="postgres",
            password="medbnk000",
            database="geomap_db"
        )
        return conn
    except psycopg2.Error as e:
        print(f"Error connecting to database: {e}")
        sys.exit(1)

def load_json_data(file_path):
    """Load data from JSON file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)
        return data
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error loading JSON file: {e}")
        sys.exit(1)

def insert_pipeline_data(conn, json_data):
    """Insert pipeline data into project_map table"""
    cursor = conn.cursor()

    # Fixed values
    file_link = "https://services9.arcgis.com/xSsJeibXqRtsnmY7/ArcGIS/rest/services/Hydrogen_Infrastructure_Map_WFL1/FeatureServer/7"
    sector = "Pipeline"
    active = 1
    created_at = datetime.now()

    # SQL insert statement
    insert_query = """
    INSERT INTO project_map (internal_id, data, file_link, tab, line, created_at, sector, active)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """

    features = json_data.get('features', [])
    inserted_count = 0

    for line_number, feature in enumerate(features, 1):
        # Skip if type is "Feature" as requested (though we still process the data)
            # Extract internal_id from Project_Na in properties
        properties = feature.get('properties', {})
        internal_id = properties.get('Project_Na', f'Unknown_Project_{line_number}')

            # Convert feature object to JSON string for data column
        data_json = json.dumps(feature)

        try:
            cursor.execute(insert_query, (
                internal_id,        # internal_id
                data_json,          # data (JSON object as string)
                file_link,          # file_link
                "",                 # tab (empty as requested)
                line_number,        # line (object number in JSON)
                created_at,         # created_at
                sector,             # sector
                active              # active
            ))
            inserted_count += 1
            print(f"Inserted record {inserted_count}: {internal_id}")

        except psycopg2.Error as e:
            print(f"Error inserting record {line_number}: {e}")
            conn.rollback()
            return False

    # Commit all changes
    conn.commit()
    cursor.close()
    print(f"\nSuccessfully inserted {inserted_count} records into project_map table")
    return True

def main():
    """Main function to execute the pipeline mapping"""
    print("Starting pipeline data mapping to PostgreSQL...")

    # Load JSON data
    json_data = load_json_data('pipelines.json')
    print(f"Loaded JSON file with {len(json_data.get('features', []))} features")

    # Connect to database
    conn = connect_to_database()
    print("Connected to database successfully")

    try:
        # Insert data
        success = insert_pipeline_data(conn, json_data)

        if success:
            print("Pipeline mapping completed successfully!")
        else:
            print("Pipeline mapping failed!")

    finally:
        conn.close()
        print("Database connection closed")

if __name__ == "__main__":
    main()