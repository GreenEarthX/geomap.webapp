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
import { GeoJSONFeatureCollection, ProductionItem, StorageItem, CCUSItem, PortItem, PipelineItem } from '@/lib/types2';
import { addProductionMarkers } from '@/lib/map/addProductionMarkers';
import { addStorageMarkers } from '@/lib/map/addStorageMarkers';
import { addCCUSMarkers } from '@/lib/map/addCCUSMarkers';
import { addPortMarkers } from '@/lib/map/addPortMarkers';
import { addPipelineMarkers } from '@/lib/map/addPipelineMarkers';

const getUniqueValues = (
  features: GeoJSONFeatureCollection['features'],
  key: keyof ProductionItem | keyof StorageItem | keyof CCUSItem | keyof PortItem | keyof PipelineItem
): string[] => {
  const values = features
    .map((f) => {
      const value = f.properties[key as keyof typeof f.properties];
      if (typeof value === 'string') return value;
      if (typeof value === 'number') return String(value);
      return null;
    })
    .filter((v): v is string => v !== null && v !== '' && v !== 'N/A' && v !== 'Unknown Feature');
  return Array.from(new Set(values)).sort();
};

const LeafletMap = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [endUse, setEndUse] = useState('');
  const [plantType, setPlantType] = useState('');
  const [selectedPlantName, setSelectedPlantName] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [allData, setAllData] = useState<GeoJSONFeatureCollection['features']>([]);
  const [statusTypes, setStatusTypes] = useState<{ sector: string; status: string }[]>([]);
  const [legendVisible, setLegendVisible] = useState(true);
  const [legendPinned, setLegendPinned] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(true);

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

          mapRef.current?.eachLayer((layer) => {
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

  const filtered = allData.filter((f) => {
    const props = f.properties;
    const hasCountry = 'country' in props && props.country;
    const hasEndUse = 'end_use' in props && props.end_use;
    const hasEndUseSector = 'end_use_sector' in props && props.end_use_sector;

    return (
      (search === '' ||
        Object.values(props).some(
          (v) =>
            (typeof v === 'string' && v.toLowerCase().includes(search.toLowerCase())) ||
            (Array.isArray(v) && v.some((item) => typeof item === 'string' && item.toLowerCase().includes(search.toLowerCase()))) ||
            (typeof v === 'object' && v !== null && JSON.stringify(v).toLowerCase().includes(search.toLowerCase()))
        )) &&
      (status === '' || (props.status && props.status.toLowerCase() === status.toLowerCase())) &&
      (endUse === '' ||
        (hasEndUse && props.end_use!.some((e: string) => e.toLowerCase().includes(endUse.toLowerCase()))) ||
        (hasEndUseSector && props.end_use_sector!.toLowerCase().includes(endUse.toLowerCase()))) &&
      (plantType === '' || (props.type && props.type.toLowerCase() === plantType.toLowerCase())) &&
      (selectedCountry === '' || (hasCountry && props.country!.toLowerCase() === selectedCountry.toLowerCase()))
    );
  });

  const plantNames = [
    ...getUniqueValues(filtered, 'name'),
    ...getUniqueValues(filtered, 'pipeline_name'),
  ].filter((name): name is string => typeof name === 'string');
  const countries = getUniqueValues(allData, 'country').filter((country): country is string => typeof country === 'string');
  const statuses = getUniqueValues(allData, 'status').filter((status): status is string => typeof status === 'string');
  const endUses = [
    ...getUniqueValues(allData, 'end_use'),
    ...getUniqueValues(allData, 'end_use_sector'),
  ].filter((endUse): endUse is string => typeof endUse === 'string');
  const plantTypes = getUniqueValues(allData, 'type').filter((type): type is string => typeof type === 'string');

  useEffect(() => {
    if (!mapRef.current || !selectedPlantName) return;

    const feature = allData.find((f) => {
      const props = f.properties;
      return (
        ('name' in props && props.name === selectedPlantName) ||
        ('pipeline_name' in props && props.pipeline_name === selectedPlantName)
      );
    });

    if (feature && feature.geometry.type === 'Point' && feature.geometry.coordinates?.[0] && feature.geometry.coordinates?.[1]) {
      const [lng, lat] = feature.geometry.coordinates as [number, number];
      mapRef.current.setView([lat, lng], 12);
    } else if (feature && feature.geometry.type === 'LineString' && feature.geometry.coordinates?.length > 0) {
      const [lng, lat] = feature.geometry.coordinates[0] as [number, number];
      mapRef.current.setView([lat, lng], 10);
    }
  }, [selectedPlantName, allData]);

  useEffect(() => {
    if (!mapRef.current || !search.trim()) return;

    const match = filtered.find((f) =>
      Object.values(f.properties).some(
        (v) =>
          (typeof v === 'string' && v.toLowerCase().includes(search.toLowerCase())) ||
          (Array.isArray(v) && v.some((item) => typeof item === 'string' && item.toLowerCase().includes(search.toLowerCase()))) ||
          (typeof v === 'object' && v !== null && JSON.stringify(v).toLowerCase().includes(search.toLowerCase()))
      )
    );

    if (match && match.geometry.type === 'Point' && match.geometry.coordinates?.[0] && match.geometry.coordinates?.[1]) {
      const [lng, lat] = match.geometry.coordinates as [number, number];
      mapRef.current.setView([lat, lng], 12);
    } else if (match && match.geometry.type === 'LineString' && match.geometry.coordinates?.length > 0) {
      const [lng, lat] = match.geometry.coordinates[0] as [number, number];
      mapRef.current.setView([lat, lng], 10);
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
    const ccusCluster = L.markerClusterGroup().addTo(mapRef.current!);
    const portsCluster = L.markerClusterGroup().addTo(mapRef.current!);
    const pipelineLayer = L.featureGroup().addTo(mapRef.current!);

    const fetchData = async () => {
  try {
    const [productionResponse, storageResponse, ccusResponse, portsResponse, pipelinesResponse, statusResponse] = await Promise.all([
      fetch('/api/production'),
      fetch('/api/storage'),
      fetch('/api/ccus'),
      fetch('/api/ports'), // This remains the same as it uses the updated route
      fetch('/api/pipelines'),
      fetch('/api/statuses'),
    ]);

    const productionData = await productionResponse.json();
    const storageData = await storageResponse.json();
    const ccusData = await ccusResponse.json();
    const portsData = await portsResponse.json();
    const pipelinesData = await pipelinesResponse.json();
    const statusData = await statusResponse.json();

    const combinedData = [
      ...(productionData.features || []),
      ...(storageData.features || []),
      ...(ccusData.features || []),
      ...(portsData.features || []), // Updated to directly use features
      ...(pipelinesData.pipelines?.features || []),
    ].filter((feature) => {
      const coords = feature.geometry?.coordinates;
      return (
        coords &&
        ((feature.geometry.type === 'Point' &&
          Array.isArray(coords) &&
          coords.length === 2 &&
          typeof coords[0] === 'number' &&
          typeof(coords[1] === 'number' &&
          coords[0] !== 0 &&
          coords[1] !== 0 &&
          !isNaN(coords[0]) &&
          !isNaN(coords[1])) ||
          (feature.geometry.type === 'LineString' &&
            Array.isArray(coords) &&
            coords.length >= 2 &&
            coords.every((c) => Array.isArray(c) && c.length === 2 && typeof c[0] === 'number' && typeof c[1] === 'number')))
      ));
    });

    setAllData(combinedData);

    addProductionMarkers(productionData, mapRef.current!, productionCluster, statusColorMap, setSelectedPlantName);
    addStorageMarkers(storageData, mapRef.current!, storageCluster, statusColorMap, setSelectedPlantName);
    addCCUSMarkers(ccusData, mapRef.current!, ccusCluster, statusColorMap, setSelectedPlantName);
    addPortMarkers(portsData, mapRef.current!, portsCluster, statusColorMap, setSelectedPlantName); // Updated to pass portsData directly
    addPipelineMarkers(pipelinesData.pipelines, mapRef.current!, pipelineLayer, setSelectedPlantName);

    if (statusData.statuses) {
      setStatusTypes(statusData.statuses.map((s: { sector: string; current_status: string }) => ({
        sector: s.sector,
        status: s.current_status,
      })));
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
          'CCUS Projects': ccusCluster,
          'Ports': portsCluster,
          'Pipelines': pipelineLayer,
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
        // @ts-ignore
        this._captureMarker.options.autoPanOnFocus = false;
        // @ts-ignore
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
    const value = e.target.value;
    setSelectedPlantName(value);
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
    setLegendPinned((prev) => !prev);
    setLegendVisible(true);
  };

  const toggleFilters = () => {
    setFiltersVisible((prev) => !prev);
  };

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

      <button
        onClick={toggleFilters}
        className="sm:hidden fixed top-4 right-16 z-[600] bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-md hover:bg-blue-700"
      >
        <i className={`fas fa-${filtersVisible ? 'times' : 'filter'}`} />
      </button>

      <div
        ref={filterRef}
        className={`fixed top-0 left-1/2 -translate-x-1/2 w-11/12 max-w-4xl z-[500] flex flex-col sm:flex-row gap-2 p-2 bg-[rgba(255,255,255,0.7)] text-black rounded-b-lg shadow-md transition-all duration-300 ease-in-out ${
          filtersVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 sm:translate-y-0 sm:opacity-100'
        }`}
      >
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 p-1.5 text-sm border border-gray-300 rounded bg-[rgba(255,255,255,0.7)] text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={selectedPlantName}
          onChange={handlePlantNameChange}
          className="p-1.5 text-sm border border-gray-300 rounded bg-[rgba(255,255,255,0.7)] text-black focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-32"
        >
          <option value="">Project Name</option>
          {plantNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <select
          value={selectedCountry}
          onChange={handleCountryChange}
          className="p-1.5 text-sm border border-gray-300 rounded bg-[rgba(255,255,255,0.7)] text-black focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-32"
        >
          <option value="">Country</option>
          {countries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="p-1.5 text-sm border border-gray-300 rounded bg-[rgba(255,255,255,0.7)] text-black focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-24"
        >
          <option value="">Status</option>
          {statuses.map((statusOption) => (
            <option key={statusOption} value={statusOption}>
              {statusOption}
            </option>
          ))}
        </select>
        <select
          value={endUse}
          onChange={(e) => setEndUse(e.target.value)}
          className="p-1.5 text-sm border border-gray-300 rounded bg-[rgba(255,255,255,0.7)] text-black focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-24"
        >
          <option value="">End Use</option>
          {endUses.map((endUseOption) => (
            <option key={endUseOption} value={endUseOption}>
              {endUseOption}
            </option>
          ))}
        </select>
        <select
          value={plantType}
          onChange={(e) => setPlantType(e.target.value)}
          className="p-1.5 text-sm border border-gray-300 rounded bg-[rgba(255,255,255,0.7)] text-black focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-24"
        >
          <option value="">Sector</option>
          {plantTypes.map((typeOption) => (
            <option key={typeOption} value={typeOption}>
              {typeOption}
            </option>
          ))}
        </select>
      </div>

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
        <div className="mt-2 text-black max-h-48 overflow-y-auto pr-1 custom-scroll">
          {statusTypes.map(({ sector, status }) => {
            let icon = 'question';
            if (sector.toLowerCase() === 'production') icon = 'bolt';
            else if (sector.toLowerCase() === 'storage') icon = 'database';
            else if (sector.toLowerCase() === 'ccus') icon = 'leaf';
            else if (sector.toLowerCase() === 'port') icon = 'ship';
            else if (sector.toLowerCase() === 'pipeline') {
              return (
                <div key={`${sector}-${status}`} className="flex items-center mt-1">
                  <div style={{ width: 18, height: 4, backgroundColor: 'red', marginRight: 5 }}></div>
                  <span>Pipeline - {status}</span>
                </div>
              );
            }

            return (
              <div key={`${sector}-${status}`} className="flex items-center mt-1">
                <i
                  className={`fa fa-${icon}`}
                  style={{
                    color: statusColorMap[status.toLowerCase()] || statusColorMap['other/unknown'],
                    marginRight: 5,
                  }}
                ></i>
                <span>{sector} - {status}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-2 text-xs italic text-black">
          Use the measuring tool on the left to calculate distances
        </div>
      </div>

      <button
        onClick={() => (window.location.href = '/plant-widget')}
        className="fixed top-1/2 right-4 -translate-y-1/2 z-[600] bg-blue-600/80 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm hover:bg-blue-600 transition-colors"
      >
        <span>Plant List</span>
        <i className="fa fa-arrow-right" />
      </button>

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
