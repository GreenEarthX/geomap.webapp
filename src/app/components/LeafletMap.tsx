'use client';

import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.awesome-markers/dist/leaflet.awesome-markers.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet-measure/dist/leaflet-measure.css';
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
    id?: number;
    internal_id?: string;
    name?: string;
    status?: string;
    type?: string;
    capacity_mw?: number;
    end_use?: string;
    consumption_tpy?: number;
    start_year?: number;
    city?: string;
    country?: string;
    process?: string;
    secondary_product?: string;
  };
}

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
  const [plantType, setPlantType] = useState('');
  const [selectedPlantName, setSelectedPlantName] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [hydrogenData, setHydrogenData] = useState<Feature[]>([]);
  const [statusTypes, setStatusTypes] = useState<{ sector: string; current_status: string }[]>([]);
  const [legendVisible, setLegendVisible] = useState(true); // Visible by default for web
  const [legendPinned, setLegendPinned] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(true); // Toggle for mobile filters

  const mapRef = useRef<L.Map | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  const statusColorMap: Record<string, string> = {
    cancelled: 'red',
    concept: 'green',
    decommisioned: 'darkgrey',
    demo: 'purple',
    'feasibility study': 'cadetblue',
    feed: 'orange',
    fid: 'darkred',
    'fid/construction': 'darkpurple',
    operational: 'darkgreen',
    'other/unknown': 'grey',
    'under construction': 'blue',
  };

  const handleFindMe = () => {
    if (navigator.geolocation && mapRef.current) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          mapRef.current?.flyTo([latitude, longitude], 18, {
            duration: 0.5,
            easeLinearity: 0.25,
          });

          mapRef.current?.eachLayer(layer => {
            if (layer instanceof L.Marker && layer.getPopup()?.getContent() === 'Your Location') {
              mapRef.current?.removeLayer(layer);
            }
          });

          L.marker([latitude, longitude], {
            icon: L.AwesomeMarkers.icon({
              markerColor: 'blue',
              iconColor: 'white',
              icon: 'user',
              prefix: 'fa',
            }),
          })
            .addTo(mapRef.current!)
            .bindPopup('Your Location')
            .openPopup();
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to retrieve your location. Please ensure location services are enabled.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const filtered = hydrogenData.filter(f => {
    return (
      (search === '' ||
        Object.values(f.properties).some(
          v => typeof v === 'string' && v.toLowerCase().includes(search.toLowerCase())
        )) &&
      (status === '' || f.properties.status === status) &&
      (endUse === '' || f.properties.end_use?.toLowerCase().includes(endUse.toLowerCase())) &&
      (plantType === '' || f.properties.type === plantType) &&
      (selectedCountry === '' || f.properties.country === selectedCountry)
    );
  });

  const plantNames = getUniqueValues(filtered, 'name');
  const countries = getUniqueValues(hydrogenData, 'country');
  const statuses = getUniqueValues(hydrogenData, 'status');
  const endUses = getUniqueValues(hydrogenData, 'end_use');
  const plantTypes = getUniqueValues(hydrogenData, 'type');

  useEffect(() => {
    if (!mapRef.current) return;

    const feature = hydrogenData.find(
      f =>
        (selectedPlantName && f.properties.name === selectedPlantName) ||
        (selectedCountry && f.properties.country === selectedCountry)
    );

    if (feature && feature.geometry.coordinates?.[0] && feature.geometry.coordinates?.[1]) {
      const [lng, lat] = feature.geometry.coordinates;
      mapRef.current.setView([lat, lng], 12);
    }
  }, [selectedPlantName, selectedCountry, hydrogenData]);

  useEffect(() => {
    if (!mapRef.current || !search.trim()) return;

    const match = filtered.find(f =>
      Object.values(f.properties).some(
        v => typeof v === 'string' && v.toLowerCase().includes(search.toLowerCase())
      )
    );

    if (match && match.geometry.coordinates?.[0] && match.geometry.coordinates?.[1]) {
      const [lng, lat] = match.geometry.coordinates;
      mapRef.current.setView([lat, lng], 12);
    }
  }, [search, filtered]);

  useEffect(() => {
    if (document.getElementById('map')?.children.length) return;

    mapRef.current = L.map('map').setView([51.07289, 10.67139], 5);

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

    const productionCluster = L.markerClusterGroup().addTo(mapRef.current!);
    const storageCluster = L.markerClusterGroup().addTo(mapRef.current!);

    const getHydrogenIcon = (status: string | undefined | null, type: string | undefined | null) => {
      const statusKey = status ? status.toLowerCase() : 'other/unknown';
      const color = statusColorMap[statusKey] || statusColorMap['other/unknown'];
      const iconType = type?.toLowerCase() === 'production' ? 'bolt' : 'cube';
      return L.AwesomeMarkers.icon({
        markerColor: color,
        iconColor: 'white',
        icon: iconType,
        prefix: 'fa',
      });
    };

    const fetchAndAddMarkerFromJson = async (data: any) => {
      if (!data || !Array.isArray(data.features)) {
        console.warn('Missing or invalid data for hydrogen');
        return;
      }

      data.features.forEach((feature: Feature) => {
        const coords = feature.geometry?.coordinates;
        const props = feature.properties;

        // Skip if coordinates are null, undefined, empty, or invalid (0, NaN)
        if (
          !coords ||
          !Array.isArray(coords) ||
          coords.length !== 2 ||
          typeof coords[0] !== 'number' ||
          typeof coords[1] !== 'number' ||
          coords[0] === 0 ||
          coords[1] === 0 ||
          isNaN(coords[0]) ||
          isNaN(coords[1])
        ) {
          console.warn('Skipping feature with invalid or missing coordinates:', {
            feature,
            reason:
              !coords
                ? 'Coordinates are null or undefined'
                : !Array.isArray(coords)
                ? 'Coordinates is not an array'
                : coords.length !== 2
                ? 'Coordinates array length is not 2'
                : typeof coords[0] !== 'number' || isNaN(coords[0])
                ? 'Longitude is not a valid number'
                : typeof coords[1] !== 'number' || isNaN(coords[1])
                ? 'Latitude is not a valid number'
                : 'Coordinates are zero (0,0)',
          });
          return;
        }

        const icon = getHydrogenIcon(props.status, props.type);

        const popupHtml = `
          <div class="max-w-xs p-2 text-sm">
            <b>Project Name:</b> ${props.name || 'N/A'}<br>
            <b>Type:</b> ${props.type || 'N/A'}<br>
            <b>Status:</b> ${props.status || 'N/A'}<br>
            <b>Start Year:</b> ${props.start_year || 'N/A'}<br>
            <b>Capacity:</b> ${props.capacity_mw || 'N/A'} MW<br>
            <b>Process:</b> ${props.process || 'N/A'}<br>
            <b>End-use:</b> ${props.end_use || 'N/A'}<br>
            <b>Consumption:</b> ${props.consumption_tpy || 'N/A'} t/y<br>
            <b>City:</b> ${props.city || 'N/A'}<br>
            <b>Country:</b> ${props.country || 'N/A'}<br>
            ${
              props.internal_id
                ? `<button onclick="window.location.href='/plant-form/hydrogen/${props.internal_id}'" class="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">Verify</button>`
                : '<span class="text-red-500 text-xs">No ID available</span>'
            }
          </div>
        `;

        const marker = L.marker([coords[1], coords[0]], { icon })
          .bindTooltip(props.name || 'Unnamed', { sticky: true })
          .bindPopup(popupHtml)
          .on('click', () => {
            const params = new URLSearchParams();
            if (props.name) {
              params.set('plantName', props.name);
            }
            window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
            if (mapRef.current) {
              mapRef.current.setView([coords[1], coords[0]], 12);
            }
          });

        if (props.type?.toLowerCase() === 'production') {
          productionCluster.addLayer(marker);
        } else if (props.type?.toLowerCase() === 'storage') {
          storageCluster.addLayer(marker);
        } else {
          productionCluster.addLayer(marker);
        }
      });
    };

    const fetchData = async () => {
      try {
        const response = await fetch('/api/data');
        const datasets = await response.json();
        setHydrogenData(datasets.hydrogen.features || []);
        await fetchAndAddMarkerFromJson(datasets.hydrogen);

        const statusResponse = await fetch('/api/statuses');
        const statusData = await statusResponse.json();
        if (statusData.statuses) {
          setStatusTypes(statusData.statuses);
        }
      } catch (error) {
        console.error('Error loading datasets:', error);
      }
    };

    fetchData();

    L.control
      .layers(
        baseLayers,
        {
          'Production Plants': productionCluster,
          'Storage Plants': storageCluster,
        },
        { collapsed: true, position: 'topright' }
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

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  const handlePlantNameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPlantName(e.target.value);
    setSelectedCountry('');
    setStatus('');
    setEndUse('');
    setPlantType('');
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCountry(e.target.value);
    setSelectedPlantName('');
    setStatus('');
    setEndUse('');
    setPlantType('');
  };

  useEffect(() => {
    if (selectedPlantName && !plantNames.includes(selectedPlantName)) {
      setSelectedPlantName('');
    }
  }, [plantNames, selectedPlantName]);

  const toggleLegendPin = () => {
    setLegendPinned(prev => !prev);
    setLegendVisible(true); // Show legend when pinning
  };

  const toggleFilters = () => {
    setFiltersVisible(prev => !prev);
  };

  // Hide filters on mobile when clicking/tapping outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (filtersVisible && filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFiltersVisible(false);
      }
    };

    document.addEventListener('click', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [filtersVisible]);

  return (
    <div className="relative w-full h-screen">
      <div id="map" className="w-full h-full z-0"></div>

      {/* Filter Toggle Button (Mobile Only) */}
      <button
        onClick={toggleFilters}
        className="sm:hidden fixed top-4 right-16 z-[600] bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-md hover:bg-blue-700"
      >
        <i className={`fas fa-${filtersVisible ? 'times' : 'filter'}`} />
      </button>

      {/* Filter Controls */}
      <div
        ref={filterRef}
        className={`fixed top-0 left-1/2 -translate-x-1/2 w-10/12 max-w-3xl z-[500] flex flex-col sm:flex-row gap-2 p-2 bg-[rgba(255,255,255,0.7)] text-black rounded-b-lg shadow-md transition-all duration-300 ease-in-out ${
          filtersVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 sm:translate-y-0 sm:opacity-100'
        }`}
      >
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 p-1.5 text-sm border border-gray-300 rounded bg-[rgba(255,255,255,0.7)] text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={selectedPlantName ?? ''}
          onChange={handlePlantNameChange}
          className="p-1.5 text-sm border border-gray-300 rounded bg-[rgba(255,255,255,0.7)] text-black focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-32"
        >
          <option value="">Plant Name</option>
          {plantNames.map(name => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <select
          value={selectedCountry ?? ''}
          onChange={handleCountryChange}
          className="p-1.5 text-sm border border-gray-300 rounded bg-[rgba(255,255,255,0.7)] text-black focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-32"
        >
          <option value="">Country</option>
          {countries.map(country => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
        <select
          value={status ?? ''}
          onChange={e => setStatus(e.target.value)}
          className="p-1.5 text-sm border border-gray-300 rounded bg-[rgba(255,255,255,0.7)] text-black focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-24"
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
          className="p-1.5 text-sm border border-gray-300 rounded bg-[rgba(255,255,255,0.7)] text-black focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-24"
        >
          <option value="">End Use</option>
          {endUses.map(endUseOption => (
            <option key={endUseOption} value={endUseOption}>
              {endUseOption}
            </option>
          ))}
        </select>
        <select
          value={plantType ?? ''}
          onChange={e => setPlantType(e.target.value)}
          className="p-1.5 text-sm border border-gray-300 rounded bg-[rgba(255,255,255,0.7)] text-black focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-24"
        >
          <option value="">Plant Type</option>
          {plantTypes.map(typeOption => (
            <option key={typeOption} value={typeOption}>
              {typeOption}
            </option>
          ))}
        </select>
      </div>

      {/* Legend */}
      <div
        className={`fixed bottom-4 left-4 w-48 p-3 bg-white border-2 border-gray-300 rounded shadow-md z-[600] text-black text-xs transition-all duration-300 ${
          legendPinned || legendVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
        onMouseEnter={() => setLegendVisible(true)}
        onMouseLeave={() => !legendPinned && setLegendVisible(false)}
        onTouchStart={() => setLegendVisible(true)}
        onTouchEnd={() => !legendPinned && setLegendVisible(false)}
      >
        <div className="flex justify-between items-center text-black">
          <strong>Legend</strong>
          <button
            onClick={toggleLegendPin}
            className={`text-sm ${legendPinned ? 'text-blue-600' : 'text-black'}`}
            title={legendPinned ? 'Unpin Legend' : 'Pin Legend'}
          >
            <i className={`fa fa-thumbtack ${legendPinned ? 'rotate-45' : ''}`} />
          </button>
        </div>
        <div className="mt-2 text-black">
          {statusTypes.map(({ sector, current_status }) => (
            <div key={`${sector}-${current_status}`} className="flex items-center mt-1">
              <i
                className={`fa fa-${sector.toLowerCase() === 'production' ? 'bolt' : 'cube'}`}
                style={{ color: statusColorMap[current_status.toLowerCase()] || statusColorMap['other/unknown'], marginRight: 5 }}
              ></i>
              {sector} - {current_status}
            </div>
          ))}
        </div>
        <div className="mt-2 text-xs italic text-black">
          Use the measuring tool on the left to calculate distances
        </div>
      </div>

      {/* Plant List Button */}
      <button
        onClick={() => window.location.href = '/plant-widget'}
        className="fixed top-1/2 right-4 -translate-y-1/2 z-[600] bg-blue-600/80 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm hover:bg-blue-600 transition-colors"
      >
        <span>Plant List</span>
        <i className="fa fa-arrow-right" />
      </button>

      {/* Find Me Button */}
      <button
        onClick={handleFindMe}
        className="fixed bottom-20 right-4 z-[600] bg-white text-blue-600 w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-lg transition-transform hover:scale-105"
        title="Find My Location"
      >
        <i className="fas fa-location-arrow" />
      </button>
    </div>
  );
};

export default LeafletMap;