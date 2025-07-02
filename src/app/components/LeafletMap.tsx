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
    type: 'Point' | 'LineString';
    coordinates: any;
  };
  properties: {
    id?: number;
    name?: string;
    status?: string;
    type?: string;
    capacity?: string | number;
    capacity_mw?: number;
    end_use?: string;
    sector?: string;
    consumption?: string | number;
    consumption_tpy?: number;
    commissioning?: string;
    location?: string;
    description?: string;
    website?: string;
    start_year?: number;
    last_researched?: string;
    city?: string;
    country?: string;
    process?: string;
    technology?: string;
    coordinates?: string;
    pipeline_nr?: number;
    segment?: string;
    start?: string;
    stop?: string;
    length?: string;
    diameter?: string;
    approx_location_start?: string;
    approx_location_stop?: string;
    country_id?: number | null;
  };
}

const selectStyle: React.CSSProperties = {
  padding: '6px 10px',
  fontSize: 14,
  border: '1px solid #ccc',
  borderRadius: 4,
  appearance: 'none',
  backgroundColor: 'rgba(255, 255, 255, 0.7)',
  color: '#000',
  backdropFilter: 'blur(10px)',
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='8' height='5' viewBox='0 0 8 5' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0l4 5 4-5z' fill='%23666'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 10px center',
  backgroundSize: '8px 5px',
};

const getUniqueValues = (features: Feature[], key: keyof Feature['properties']) => {
  return Array.from(
    new Set(
      features
        .map(f => f.properties[key])
        .filter((v): v is string | number => v !== null && v !== undefined)
    )
  ).sort();
};

const LeafletMap = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [endUse, setEndUse] = useState('');
  const [selectedPlantName, setSelectedPlantName] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
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

  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const feature = hydrogenData.find(
      f =>
        (selectedPlantName && f.properties.name === selectedPlantName) ||
        (selectedLocation && f.properties.city === selectedLocation)
    );

    if (feature) {
      const [lng, lat] = feature.geometry.coordinates;
      mapRef.current.setView([lat, lng], 12);
    }
  }, [selectedPlantName, selectedLocation, hydrogenData]);

  useEffect(() => {
    if (document.getElementById('map')?.children.length) return;

    mapRef.current = L.map('map').setView([51.07289, 10.67139], 6);

    const baseLayers = {
      Light: L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO',
      }),
      Dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO',
      }),
      Satellite: L.layerGroup([
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Tiles © Esri & contributors',
        }),
        L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Labels © Esri',
        }),
      ]),
      Terrain: L.tileLayer('https://{s}.google.com/vt/lyrs=p&hl=en&x={x}&y={y}&z={z}', {
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '© Google Maps',
      }),
    };

    baseLayers['Light'].addTo(mapRef.current!);

    const hydrogenCluster = L.markerClusterGroup().addTo(mapRef.current!);
    const windCluster = L.markerClusterGroup().addTo(mapRef.current!);
    const solarCluster = L.markerClusterGroup().addTo(mapRef.current!);
    const storageCluster = L.markerClusterGroup().addTo(mapRef.current!);
    const pipelineLayer = L.featureGroup().addTo(mapRef.current!);

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

    const getHydrogenIcon = (status: string | undefined | null) => {
      let color = 'gray';
      const lower = typeof status === 'string' ? status.toLowerCase() : '';

      if (['operation', 'operating'].includes(lower)) color = 'green';
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

      data.features.forEach((feature: Feature) => {
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
            <b>Status:</b> ${props.status || 'N/A'}<br>
            <b>Start Year:</b> ${props.start_year || 'N/A'}<br>
            <b>Capacity:</b> ${props.capacity_mw || 'N/A'} MW<br>
            <b>Process:</b> ${props.process || 'N/A'}<br>
            <b>End-use:</b> ${props.end_use || 'N/A'}<br>
            <b>Consumption:</b> ${props.consumption_tpy || 'N/A'} t/y<br>
            <b>City:</b> ${props.city || 'N/A'}<br>
            <b>Country:</b> ${props.country || 'N/A'}<br>
            ${
              props.id
                ? `<button onclick="window.location.href='/plant-form/hydrogen/${props.id}'" style="margin-top: 10px; padding: 5px 10px; background: #006cb5; color: white; border: none; border-radius: 4px; cursor: pointer;">Verify</button>`
                : '<span style="color: red; font-size: 12px;">No ID available</span>'
            }
          `;
        } else if (type === 'solar') {
          popupHtml = `
            <b>Project Name:</b> ${props.name || 'N/A'}<br>
            <b>Capacity:</b> ${props.capacity_mw || 'N/A'} MW<br>
            <b>Status:</b> ${props.status || 'N/A'}<br>
            <b>Start Year:</b> ${props.start_year || 'N/A'}<br>
            <b>Last Researched:</b> ${props.last_researched || 'N/A'}<br>
            ${
              props.id
                ? `<button onclick="window.location.href='/plant-form/solar/${props.id}'" style="margin-top: 10px; padding: 5px 10px; background: #006cb5; color: white; border: none; border-radius: 4px; cursor: pointer;">Verify</button>`
                : '<span style="color: red; font-size: 12px;">No ID available</span>'
            }
          `;
        } else if (type === 'wind') {
          popupHtml = `
            <b>Project Name:</b> ${props.name || 'N/A'}<br>
            <b>Capacity:</b> ${props.capacity_mw || 'N/A'} MW<br>
            <b>Status:</b> ${props.status || 'N/A'}<br>
            <b>Start Year:</b> ${props.start_year || 'N/A'}<br>
            <b>Last Researched:</b> ${props.last_researched || 'N/A'}<br>
            ${
              props.id
                ? `<button onclick="window.location.href='/plant-form/wind/${props.id}'" style="margin-top: 10px; padding: 5px 10px; background: #006cb5; color: white; border: none; border-radius: 4px; cursor: pointer;">Verify</button>`
                : '<span style="color: red; font-size: 12px;">No ID available</span>'
            }
          `;
        } else if (type === 'storage') {
          popupHtml = `
            <b>Project Name:</b> ${props.name || 'N/A'}<br>
            <b>Technology:</b> ${props.technology || 'N/A'}<br>
            <b>Location:</b> ${props.location || 'N/A'}<br>
            <b>Start Year:</b> ${props.start_year || 'N/A'}<br>
            ${
              props.id
                ? `<button onclick="window.location.href='/plant-form/storage/${props.id}'" style="margin-top: 10px; padding: 5px 10px; background: #006cb5; color: white; border: none; border-radius: 4px; cursor: pointer;">Verify</button>`
                : '<span style="color: red; font-size: 12px;">No ID available</span>'
            }
          `;
        } else if (type === 'pipeline') {
          popupHtml = `
            <b>Pipeline #:</b> ${props.pipeline_nr || 'N/A'}<br>
            <b>Segment:</b> ${props.segment || 'N/A'}<br>
            <b>Start:</b> ${props.start || 'N/A'}<br>
            <b>Stop:</b> ${props.stop || 'N/A'}<br>
            <b>Start Location:</b> ${props.approx_location_start || 'N/A'}<br>
            <b>Stop Location:</b> ${props.approx_location_stop || 'N/A'}<br>
            ${
              props.id
                ? `<button onclick="window.location.href='/plant-form/pipeline/${props.id}'" style="margin-top: 10px; padding: 5px 10px; background: #006cb5; color: white; border: none; border-radius: 4px; cursor: pointer;">Verify</button>`
                : '<span style="color: red; font-size: 12px;">No ID available</span>'
            }
          `;
        }

        if (type === 'pipeline' && feature.geometry.type?.toLowerCase() === 'linestring') {
          let latlngs: [number, number][] = [];

          if (
            Array.isArray(coords) &&
            coords.length === 2 &&
            coords.every(c => Array.isArray(c) && typeof c[0] === 'number' && typeof c[1] === 'number' && (c[0] !== 0 || c[1] !== 0))
          ) {
            latlngs = coords.map(([lng, lat]: [number, number]) => [lat, lng]);
          } else if (props.start && props.stop) {
            const parseCoord = (str: string): [number, number] | null => {
              const parts = str.split(',').map(s => parseFloat(s.trim()));
              return parts.length === 2 && parts.every(p => !isNaN(p)) ? [parts[0], parts[1]] : null;
            };

            const startCoord = parseCoord(props.start);
            const stopCoord = parseCoord(props.stop);

            if (startCoord && stopCoord) {
              latlngs = [startCoord, stopCoord];
            }
          }

          if (latlngs.length === 2) {
            L.polyline(latlngs, {
              color: 'red',
              weight: 4,
            })
              .bindPopup(popupHtml)
              .addTo(layer);
          } else {
            console.warn('Skipping invalid pipeline segment:', feature);
          }
        } else if (feature.geometry.type === 'Point') {
          if (
            Array.isArray(coords) &&
            coords.length === 2 &&
            typeof coords[0] === 'number' &&
            typeof coords[1] === 'number'
          ) {
            const marker = L.marker([coords[1], coords[0]], { icon })
              .bindTooltip(props.name || 'Unnamed', { sticky: true })
              .bindPopup(popupHtml);
            (layer as L.MarkerClusterGroup).addLayer(marker);
          } else {
            console.warn('Invalid Point coordinates:', feature);
          }
        }
      });
    };

    const fetchData = async () => {
      try {
        const response = await fetch('/api/data');
        const datasets = await response.json();

        setHydrogenData(datasets.hydrogen.features || []);
        setWindData(datasets.wind.features || []);
        setSolarData(datasets.solar.features || []);
        setStorageData(datasets.storage.features || []);
        setPipelineData(datasets.pipelines.features || []);

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

    L.control
      .layers(
        baseLayers,
        {
          'Hydrogen Plants': hydrogenCluster,
          'Wind Plants': windCluster,
          'Solar Plants': solarCluster,
          'Storage Facilities': storageCluster,
          Pipelines: pipelineLayer,
        },
        { collapsed: false, position: 'topright' }
      )
      .addTo(mapRef.current!);

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

  const filtered = hydrogenData.filter(f => {
    return (
      (search === '' ||
        Object.values(f.properties).some(
          v => typeof v === 'string' && v.toLowerCase().includes(search.toLowerCase())
        )) &&
      (status === '' || f.properties.status === status) &&
      (endUse === '' || f.properties.end_use === endUse)
    );
  });

  const plantNames = getUniqueValues(hydrogenData, 'name');
  const locations = getUniqueValues(hydrogenData, 'city');
  const statuses = getUniqueValues(hydrogenData, 'status');
  const endUses = getUniqueValues(hydrogenData, 'end_use');

  const handleClick = (feature: Feature) => {
    if (mapRef.current) {
      mapRef.current.setView([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], 12);
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
      Object.values(f.properties).some(
        v => typeof v === 'string' && v.toLowerCase().includes(search.toLowerCase())
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

      <div
        style={{
          position: 'fixed',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10000,
          display: 'flex',
          gap: 10,
          padding: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(10px)',
          borderRadius: 8,
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          alignItems: 'center',
          width: '90%',
          maxWidth: '1000px',
          color: '#000',
        }}
      >
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: '6px 12px',
            fontSize: 14,
            border: '1px solid #ccc',
            borderRadius: 4,
            flex: '1',
          }}
        />
        <select
          value={selectedPlantName ?? ''}
          onChange={handlePlantNameChange}
          style={{ ...selectStyle, width: 150 }}
        >
          <option value="">Plant Name</option>
          {plantNames.map(name => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <select
          value={selectedLocation ?? ''}
          onChange={handleLocationChange}
          style={{ ...selectStyle, width: 150 }}
        >
          <option value="">Location</option>
          {locations.map(loc => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>
        <select
          value={status ?? ''}
          onChange={e => setStatus(e.target.value)}
          style={{ ...selectStyle, width: 100 }}
        >
          <option value="">Status</option>
          {statuses.map(statusOption => (
            <option key={statusOption} value={statusOption}>
              {statusOption}
            </option>
          ))}
        </select>
        <select
          value={endUse ?? ''}
          onChange={e => setEndUse(e.target.value)}
          style={{ ...selectStyle, width: 100 }}
        >
          <option value="">End Use</option>
          {endUses.map(endUseOption => (
            <option key={endUseOption} value={endUseOption}>
              {endUseOption}
            </option>
          ))}
        </select>
      </div>

      <div
        style={{
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
        }}
      >
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