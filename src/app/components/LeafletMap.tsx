'use client';

import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';

// CSS
import 'leaflet/dist/leaflet.css';
import 'leaflet.awesome-markers/dist/leaflet.awesome-markers.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet-measure/dist/leaflet-measure.css';

// Plugins
import 'leaflet.awesome-markers';
import 'leaflet.markercluster';
import 'leaflet-measure';


export interface Feature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    name: string;
    status: string;
    type: string;
    capacity: string;
    end_use: string;
    sector: string;
    consumption: string;
    commissioning: string;
    location: string;
    description: string;
    website: string;
  };
}

const selectStyle: React.CSSProperties = {
  padding: '6px 10px',
  fontSize: 14,
  border: '1px solid #ccc',
  borderRadius: 4,
  appearance: 'none',
  backgroundColor: 'rgba(255, 255, 255, 0.7)', // semi-transparent
  color: '#000', // black text
  backdropFilter: 'blur(10px)',
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='8' height='5' viewBox='0 0 8 5' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0l4 5 4-5z' fill='%23666'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 10px center',
  backgroundSize: '8px 5px',
};

const getUniqueValues = (features: Feature[], key: keyof Feature['properties']) => {
  return Array.from(new Set(features.map(f => f.properties[key]).filter(Boolean))).sort();
};


const LeafletMap = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [endUse, setEndUse] = useState('');
  const [countries, setCountries] = useState<{ id: number; name: string; iso_code: string }[]>([]);
  const [selectedPlantName, setSelectedPlantName] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  // Fix type of hydrogenData
  const [hydrogenData, setHydrogenData] = useState<Feature[]>([]);
  const [windData, setWindData] = useState<Feature[]>([]);
  const [solarData, setSolarData] = useState<Feature[]>([]);
  const [storageData, setStorageData] = useState<Feature[]>([]);
  const [pipelineData, setPipelineData] = useState<Feature[]>([]);

  const allFeatures = [
    ...hydrogenData,
    ...solarData,
    ...windData,
    ...storageData,
    ...pipelineData,
  ];


      useEffect(() => {
    if (!mapRef.current) return;

    const feature = hydrogenData.find(f =>
      (selectedPlantName && f.properties.name === selectedPlantName) ||
      (selectedLocation && f.properties.location === selectedLocation)
    );

    if (feature) {
      const [lng, lat] = feature.geometry.coordinates;
      mapRef.current.setView([lat, lng], 12);
    }
  }, [selectedPlantName, selectedLocation, hydrogenData]);

  const mapRef = useRef<L.Map | null>(null);



  useEffect(() => {
    if (document.getElementById('map')?.children.length) return;

    mapRef.current = L.map('map').setView([51.07289, 10.67139], 6);


    const baseLayer = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      }
    ).addTo(mapRef.current!);

    // Cluster layers per energy type
    const hydrogenCluster = L.markerClusterGroup().addTo(mapRef.current!);
    const windCluster = L.markerClusterGroup().addTo(mapRef.current!);
    const solarCluster = L.markerClusterGroup().addTo(mapRef.current!);
    const storageCluster = L.markerClusterGroup().addTo(mapRef.current!);
    const pipelineLayer = L.featureGroup().addTo(mapRef.current!);

    // Icons
    const windIcon = L.AwesomeMarkers.icon({
      markerColor: 'green',
      iconColor: 'white',
      icon: 'wind',
      prefix: 'fa',
    });
    const solarIcon = L.AwesomeMarkers.icon({
      markerColor: 'green',
      iconColor: 'white',
      icon: 'solar-panel',
      prefix: 'fa',
    });
    const storageIcon = L.AwesomeMarkers.icon({
      markerColor: 'purple',
      iconColor: 'white',
      icon: 'database',
      prefix: 'fa',
    });
    const pipelineIcon = L.AwesomeMarkers.icon({
      markerColor: 'red',
      iconColor: 'white',
      icon: 'minus',
      prefix: 'fa',
    });

    const getHydrogenIcon = (status: string) => {
      let color = 'gray';
      const lower = status?.toLowerCase() || '';
      if (lower === 'operating') color = 'green';
      else if (lower === 'construction') color = 'orange';
      else if (lower === 'planned') color = 'blue';

      return L.AwesomeMarkers.icon({
        markerColor: color,
        iconColor: 'white',
        icon: 'industry',
        prefix: 'fa',
      });
    };

    const fetchAndAddMarkerFromJson = async (
      data: any,
      layer: L.MarkerClusterGroup | L.FeatureGroup,
      type: string
    ) => {
      if (!data || !Array.isArray(data.features)) {
        console.warn(`Missing or invalid data for ${type}`);
        return;
      }

      data.features.forEach((feature: any) => {
        const coords = feature.geometry.coordinates;
        const props = feature.properties;

        let icon = pipelineIcon;
        if (type === 'hydrogen') icon = getHydrogenIcon(props.status);
        else if (type === 'wind') icon = windIcon;
        else if (type === 'solar') icon = solarIcon;
        else if (type === 'storage') icon = storageIcon;

        let popupHtml = '';
        if (type === 'hydrogen') {
          popupHtml = `
            <b>Project Name:</b> ${props.name || 'N/A'}<br>
            <b>Project Type:</b> ${props.type || 'N/A'}<br>
            <b>Capacity:</b> ${props.capacity || 'N/A'} MW<br>
            <b>End-use:</b> ${props.end_use || 'N/A'}<br>
            <b>Sector:</b> ${props.sector || 'N/A'}<br>
            <b>Consumption:</b> ${props.consumption || 'N/A'} t/y<br>
            <b>Status:</b> ${props.status || 'N/A'}<br>
            <b>Commissioning:</b> ${props.commissioning || 'N/A'}<br>
            <b>Location:</b> ${props.location || 'N/A'}<br>
            <b>Description:</b> ${props.description || 'N/A'}<br>
            <b>Website:</b> ${props.website || 'N/A'}
          `;
        } else if (type === 'solar' || type === 'wind') {
          popupHtml = `
            <b>Project Name:</b> ${props.name || 'N/A'}<br>
            <b>Capacity:</b> ${props.capacity || 'N/A'} MW<br>
            <b>Status:</b> ${props.status || 'N/A'}<br>
            <b>Start Year:</b> ${props.start_year || 'N/A'}<br>
            <b>Last Researched:</b> ${props.last_researched || 'N/A'}
          `;
        } else if (type === 'storage') {
          popupHtml = `
            <b>Project Name:</b> ${props.name || 'N/A'}<br>
            <b>Technology:</b> ${props.technology || 'N/A'}<br>
            <b>Coordinates:</b> ${props.coordinates || 'N/A'}
          `;
        } else if (type === 'pipeline') {
          popupHtml = `
            <b>Pipeline:</b> ${props.name || 'N/A'}<br>
            <b>Length:</b> ${props.length || 'N/A'}<br>
            <b>Diameter:</b> ${props.diameter || 'N/A'}
          `;
        }

        if (type === 'pipeline' && feature.geometry.type === 'LineString') {
          L.polyline(coords.map(([lng, lat]: number[]) => [lat, lng]), {
            color: 'red',
            weight: 4,
          }).bindPopup(popupHtml).addTo(layer);
        } else {
          const marker = L.marker([coords[1], coords[0]], { icon })
            .bindTooltip(props.name || 'Unnamed', { sticky: true })
            .bindPopup(popupHtml);
          (layer as L.MarkerClusterGroup).addLayer(marker);
        }
      });
    };

    // Fetch all datasets once from the unified endpoint
    const fetchData = async () => {
      try {
        const response = await fetch('/api/data');
        const datasets = await response.json();

        setHydrogenData(datasets.hydrogen.features);
        setWindData(datasets.wind.features);
        setSolarData(datasets.solar.features);
        setStorageData(datasets.storage.features);
        setPipelineData(datasets.pipelines.features);

        await fetchAndAddMarkerFromJson(datasets.hydrogen, hydrogenCluster, 'hydrogen');
        await fetchAndAddMarkerFromJson(datasets.wind, windCluster, 'wind');
        await fetchAndAddMarkerFromJson(datasets.solar, solarCluster, 'solar');
        await fetchAndAddMarkerFromJson(datasets.storage, storageCluster, 'storage');
        await fetchAndAddMarkerFromJson(datasets.pipelines, pipelineLayer, 'pipeline');
      } catch (error) {
        console.error('Error loading datasets:', error);
      }
    };


    fetchData();

    // Layers control
    L.control.layers(
      { 'cartodbpositron': baseLayer },
      {
        'Hydrogen Plants': hydrogenCluster,
        'Wind Plants': windCluster,
        'Solar Plants': solarCluster,
        'Storage Facilities': storageCluster,
        'Pipelines': pipelineLayer,
      },
      { collapsed: false, position: 'topright' }
    ).addTo(mapRef.current!);

    // Measurement tool
    const measureControl = new L.Control.Measure({
      position: 'topleft',
      primaryLengthUnit: 'kilometers',
      secondaryLengthUnit: 'miles',
      primaryAreaUnit: 'sqmeters',
      secondaryAreaUnit: 'acres',
    });
    mapRef.current!.addControl(measureControl);

    L.Control.Measure.include({
      _setCaptureMarkerIcon: function () {
        this._captureMarker.options.autoPanOnFocus = false;
        this._captureMarker.setIcon(
          L.divIcon({ iconSize: this._map.getSize().multiplyBy(2) })
        );
      },
    });
  }, []);


  useEffect(() => {
    fetch('/data/hydrogen.json')
      .then(res => res.json())
      .then(data => setHydrogenData(data.features));
  }, []);

  const filtered = hydrogenData.filter(f => {
    return (
      (search === '' || Object.values(f.properties).some(v => v.toLowerCase().includes(search.toLowerCase()))) &&
      (status === '' || f.properties.status === status) &&
      (endUse === '' || f.properties.end_use === endUse)
    );
  });

  const plantNames = getUniqueValues(hydrogenData, 'name');
  const locations = getUniqueValues(hydrogenData, 'location');
  const statuses = getUniqueValues(hydrogenData, 'status');
  const endUses = getUniqueValues(hydrogenData, 'end_use');


  const handleClick = (feature: Feature) => {
  if (mapRef.current) {
    mapRef.current.setView(
      [feature.geometry.coordinates[1], feature.geometry.coordinates[0]],
      12
    );
  }
};

const handlePlantNameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  setSelectedPlantName(e.target.value);
  setSelectedLocation('');
  setStatus('');
  setEndUse('');
};

const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  setSelectedLocation(e.target.value);
  setSelectedPlantName('');
  setStatus('');
  setEndUse('');
};




  useEffect(() => {
    if (!mapRef.current || !search.trim()) return;

    const match = allFeatures.find(f =>
      Object.values(f.properties).some(v =>
        typeof v === 'string' && v.toLowerCase().includes(search.toLowerCase())
      )
    );

    if (match) {
      const [lng, lat] = match.geometry.coordinates;
      mapRef.current.setView([lat, lng], 12);
    }
  }, [search, allFeatures]);



  return (
    <>
      <div id="map" style={{ height: '100vh', width: '100%' }}></div>

      {/* Search UI */}
     <div style={{
        position: 'fixed',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10000,
        display: 'flex',
        gap: 10,
        padding: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.7)', // transparency
        backdropFilter: 'blur(10px)',                // glass effect
        borderRadius: 8,
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        alignItems: 'center',
        width: '90%',
        maxWidth: '1000px',
        color: '#000' // <-- all text inside will be black
      }}>


  {/* Search input */}
  <input
    type="text"
    placeholder="Search..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    style={{
      padding: '6px 12px',
      fontSize: 14,
      border: '1px solid #ccc',
      borderRadius: 4,
      flex: '1',
    }}
  />

  {/* Filter: Plant Name */}
  <select
    value={selectedPlantName} onChange={handlePlantNameChange}
    style={{ ...selectStyle, width: 150 }}
  >
    <option value="">Plant Name</option>
    {plantNames.map((name) => (
      <option key={name} value={name}>{name}</option>
    ))}
  </select>



  {/* Filter: Location */}
  <select
    value={selectedLocation} onChange={handleLocationChange} 
    style={{ ...selectStyle, width: 150 }}
  >
    <option value="">Location</option>
    {locations.map((loc) => (
      <option key={loc} value={loc}>{loc}</option>
    ))}
  </select>



  {/* Filter: Status */}
  <select
    value={status}
    onChange={(e) => setStatus(e.target.value)}
    style={{ ...selectStyle, width: 100 }}
  >
    <option value="">Status</option>
    {statuses.map((statusOption) => (
      <option key={statusOption} value={statusOption}>{statusOption}</option>
    ))}
  </select>


  {/* Filter: End Use */}
  <select
    value={endUse}
    onChange={(e) => setEndUse(e.target.value)}
    style={{ ...selectStyle, width: 100 }}
  >
    <option value="">End Use</option>
    {endUses.map((endUseOption) => (
      <option key={endUseOption} value={endUseOption}>{endUseOption}</option>
    ))}
  </select>
</div>



      {/* Legend */}
      <div style={{
        position: 'fixed',
        bottom: 20,
        left: 50,
        width: 220,
        border: '2px solid grey',
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 5,
        zIndex: 9999,
        fontSize: 14,
        color: 'black',
        fontWeight: 'normal',
      }}>
        <strong>Legend</strong>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 5 }}>
          <i className="fa fa-industry" style={{ color: 'green', marginRight: 5 }}></i>Hydrogen - Operating
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 5 }}>
          <i className="fa fa-industry" style={{ color: 'orange', marginRight: 5 }}></i>Hydrogen - Construction
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 5 }}>
          <i className="fa fa-industry" style={{ color: 'blue', marginRight: 5 }}></i>Hydrogen - Planned
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 5 }}>
          <i className="fa fa-wind" style={{ color: 'green', marginRight: 5 }}></i>Wind Plant
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 5 }}>
          <i className="fa fa-solar-panel" style={{ color: 'green', marginRight: 5 }}></i>Solar Plant
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 5 }}>
          <i className="fa fa-database" style={{ color: 'purple', marginRight: 5 }}></i>Storage Facility
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 5 }}>
          <div style={{ width: 18, height: 4, backgroundColor: 'red', marginRight: 5 }}></div>Pipeline
        </div>
        <div style={{ marginTop: 10, fontSize: 12, fontStyle: 'italic' }}>
          Use the measuring tool on the left to calculate distances
        </div>
        
      </div>
      {/* Switch to Plant List Button */}
      <button
        onClick={() => window.location.href = '/plant-list'}
        style={{
          position: 'fixed',
          top: '50%',
          right: 20,
          transform: 'translateY(-50%)',
          zIndex: 10000,
          background: 'rgba(0, 108, 181, 0.8)',
          color: '#fff',
          border: 'none',
          borderRadius: '50px',
          padding: '10px 16px',
          fontSize: 14,
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          transition: 'background 0.3s ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0, 108, 181, 1)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0, 108, 181, 0.8)')}
      >
        <span>Plant List</span>
        <i className="fa fa-arrow-right" />
      </button>
    </>
  );
};

export default LeafletMap;
