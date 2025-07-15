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

// Define interface for /api/statuses response
interface StatusesResponse {
  statuses: { sector: string; current_status: string }[];
}

// Generic function for cleaning dropdown values
const getUniqueValues = (
  features: GeoJSONFeatureCollection['features'],
  key: keyof ProductionItem | keyof StorageItem | keyof CCUSItem | keyof PortItem | keyof PipelineItem
): string[] => {
  const values = features
    .map((f) => f.properties[key as keyof typeof f.properties])
    .filter(value => value != null)
    .flat(Infinity)
    .map(item =>
      String(item)
        .replace(/[\[\]"]/g, '')
        .trim()
    )
    .filter(v => v !== '')
    .map(v => v.toLowerCase());

  return Array.from(new Set(values)).sort();
};

// ✅ Type-safe function specifically for getting all possible names
const getUniqueNamesForDropdown = (features: GeoJSONFeatureCollection['features']): string[] => {
    const names: string[] = [];
    features.forEach(feature => {
        // Exclude pipelines as requested
        if (feature.properties.type?.toLowerCase() === 'pipeline') {
            return;
        }
        
        const props = feature.properties;
        if ('name' in props && props.name) {
            names.push(props.name);
        }
        if ('project_name' in props && props.project_name) {
            names.push(props.project_name);
        }
    });

    return Array.from(new Set(names.map(name => name.toLowerCase()))).sort();
}


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
    planned: 'lightblue',
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

    let name = '';
    let statusValue = '';
    let endUseValue: string | string[] | null = null;
    let countryValue = '';
    let typeValue = props.type || '';

    switch (props.type?.toLowerCase()) {
      case 'production':
        const prodProps = props as ProductionItem;
        name = prodProps.name || prodProps.project_name || '';
        statusValue = prodProps.status || '';
        endUseValue = prodProps.end_use || null;
        countryValue = prodProps.country || '';
        break;
      case 'storage':
        const storeProps = props as StorageItem;
        name = storeProps.project_name || '';
        statusValue = storeProps.status || '';
        endUseValue = storeProps.end_use || null;
        countryValue = storeProps.country || '';
        break;
      case 'ccus':
        const ccusProps = props as CCUSItem;
        name = ccusProps.name || ccusProps.project_name || '';
        statusValue = ccusProps.project_status || '';
        endUseValue = ccusProps.end_use_sector || null;
        countryValue = ccusProps.country || '';
        break;
      case 'port':
        const portProps = props as PortItem;
        name = portProps.name || portProps.project_name || '';
        statusValue = portProps.status || '';
        countryValue = portProps.country || '';
        break;
      case 'pipeline':
        const pipelineProps = props as PipelineItem;
        name = pipelineProps.pipeline_name || '';
        statusValue = pipelineProps.status || '';
        break;
    }

    const searchMatch =
      search === '' ||
      Object.values(props).some((v) => {
        if (typeof v === 'string') return v.toLowerCase().includes(search.toLowerCase());
        if (Array.isArray(v)) return v.some((item: any) => typeof item === 'string' && item.toLowerCase().includes(search.toLowerCase()));
        if (typeof v === 'object' && v !== null) return JSON.stringify(v).toLowerCase().includes(search.toLowerCase());
        return false;
      });

    const statusMatch = status === '' || (statusValue && statusValue.toLowerCase() === status.toLowerCase());

    const endUseMatch =
      endUse === '' ||
      (endUseValue &&
        (Array.isArray(endUseValue)
          ? endUseValue.some((e) => typeof e === 'string' && e.toLowerCase().includes(endUse.toLowerCase()))
          : typeof endUseValue === 'string' && endUseValue.toLowerCase().includes(endUse.toLowerCase())));

    const plantTypeMatch = plantType === '' || (typeValue && typeValue.toLowerCase() === plantType.toLowerCase());
    const countryMatch = selectedCountry === '' || (countryValue && countryValue.toLowerCase() === selectedCountry.toLowerCase());

    return searchMatch && statusMatch && endUseMatch && plantTypeMatch && countryMatch;
  });

  // ✅ Use the new type-safe function to populate the dropdown
  const uniquePlantNames = getUniqueNamesForDropdown(filtered);
  
  const countries = getUniqueValues(allData, 'country');
  const statuses = Array.from(new Set([...getUniqueValues(allData, 'status'), ...getUniqueValues(allData, 'project_status')])).sort();
  const endUses = Array.from(new Set([...getUniqueValues(allData, 'end_use'), ...getUniqueValues(allData, 'end_use_sector')])).sort();
  const plantTypeValues = getUniqueValues(allData, 'type');


  useEffect(() => {
    if (!mapRef.current || !selectedPlantName) return;

    const feature = allData.find((f) => {
      const props = f.properties;
      const lowerSelectedPlantName = selectedPlantName.toLowerCase();
      // This is now fully type-safe
      if ('name' in props && props.name?.toLowerCase() === lowerSelectedPlantName) return true;
      if ('project_name' in props && props.project_name?.toLowerCase() === lowerSelectedPlantName) return true;
      if ('pipeline_name' in props && props.pipeline_name?.toLowerCase() === lowerSelectedPlantName) return true;
      return false;
    });

    if (feature) {
      if (feature.geometry.type === 'Point') {
        const [lng, lat] = feature.geometry.coordinates as [number, number];
        mapRef.current.setView([lat, lng], 12);
      } else if (feature.geometry.type === 'LineString' && feature.geometry.coordinates?.length > 0) {
        const [lng, lat] = feature.geometry.coordinates[0] as [number, number];
        mapRef.current.setView([lat, lng], 10);
      }
    }
  }, [selectedPlantName, allData]);

  // Main useEffect for map initialization and data fetching
  useEffect(() => {
    if (document.getElementById('map')?.children.length) return;

    mapRef.current = L.map('map').setView([51.07289, 10.67139], 5);

    const baseLayers = {
      Light: L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { attribution: '© OpenStreetMap contributors © CARTO' }),
      Dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '© OpenStreetMap contributors © CARTO' }),
      Satellite: L.layerGroup([
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: 'Tiles © Esri & contributors' }),
        L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', { attribution: 'Labels © Esri' }),
      ]),
      Terrain: L.tileLayer('https://{s}.google.com/vt/lyrs=p&hl=en&x={x}&y={y}&z={z}', { subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], attribution: '© Google Maps' }),
    };
    baseLayers['Satellite'].addTo(mapRef.current!);

    const productionCluster = L.markerClusterGroup().addTo(mapRef.current!);
    const storageCluster = L.markerClusterGroup().addTo(mapRef.current!);
    const ccusCluster = L.markerClusterGroup().addTo(mapRef.current!);
    const portsCluster = L.markerClusterGroup().addTo(mapRef.current!);
    const pipelineLayer = L.featureGroup().addTo(mapRef.current!);

    const fetchData = async () => {
      try {
        const [productionResponse, storageResponse, ccusResponse, portsResponse, statusResponse] = await Promise.all([
          fetch('/api/production'),
          fetch('/api/storage'),
          fetch('/api/ccus'),
          fetch('/api/ports-copy'),
          fetch('/api/statuses'),
        ]);

        const productionData = await productionResponse.json();
        const storageData = await storageResponse.json();
        const ccusData = await ccusResponse.json();
        const portsData = await portsResponse.json();
        const statusData: StatusesResponse = await statusResponse.json();

        const combinedData = [
          ...(productionData.features || []),
          ...(storageData.features || []),
          ...(ccusData.features || []),
          ...(portsData.features || []),
        ].filter(feature => feature.geometry?.coordinates);

        setAllData(combinedData);

        addProductionMarkers(productionData, mapRef.current!, productionCluster, statusColorMap, setSelectedPlantName);
        addStorageMarkers(storageData, mapRef.current!, storageCluster, statusColorMap, setSelectedPlantName);
        addCCUSMarkers(ccusData, mapRef.current!, ccusCluster, statusColorMap, setSelectedPlantName);
        addPortMarkers(portsData, mapRef.current!, portsCluster, statusColorMap, setSelectedPlantName);

        if (statusData.statuses && Array.isArray(statusData.statuses)) {
          const uniqueStatusTypes = Array.from(
            new Map(statusData.statuses.map(s => [`${s.sector}-${s.current_status}`, { sector: s.sector, status: s.current_status }])).values()
          ).sort((a, b) => a.sector.localeCompare(b.sector) || a.status.localeCompare(b.status));
          setStatusTypes(uniqueStatusTypes);
        }
      } catch (error) {
        console.error('Error loading datasets:', error);
      }
    };
    fetchData();

    L.control.layers(baseLayers, {
      'Production Plants': productionCluster,
      'Storage Plants': storageCluster,
      'CCUS Projects': ccusCluster,
      'Ports': portsCluster,
      'Pipelines': pipelineLayer,
    }, { collapsed: true, position: 'topright' }).addTo(mapRef.current!);

    const measureControl = new (L.Control as any).Measure({ position: 'topleft', primaryLengthUnit: 'kilometers', secondaryLengthUnit: 'miles', primaryAreaUnit: 'sqmeters', secondaryAreaUnit: 'acres' });
    mapRef.current!.addControl(measureControl);

    (L.Control as any).Measure.include({
      _setCaptureMarkerIcon: function () { this._captureMarker.options.autoPanOnFocus = false; this._captureMarker.setIcon(L.divIcon({ iconSize: this._map.getSize().multiplyBy(2) })); },
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  const handlePlantNameChange = (e: React.ChangeEvent<HTMLSelectElement>) => setSelectedPlantName(e.target.value);
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => setSelectedCountry(e.target.value);
  const toggleLegendPin = () => setLegendPinned(prev => !prev);
  const toggleFilters = () => setFiltersVisible(prev => !prev);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (window.innerWidth < 640 && filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFiltersVisible(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div className="relative w-full h-screen">
      <div id="map" className="w-full h-full z-0"></div>

      <button onClick={toggleFilters} className="sm:hidden fixed top-4 right-16 z-[600] bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-md hover:bg-blue-700">
        <i className={`fas fa-${filtersVisible ? 'times' : 'filter'}`} />
      </button>
      
      <div ref={filterRef} className={`fixed top-0 left-1/2 -translate-x-1/2 w-11/12 max-w-5xl z-[500] flex flex-col sm:flex-row sm:flex-wrap sm:justify-center gap-2 p-2 bg-[rgba(255,255,255,0.8)] backdrop-blur-sm text-black rounded-b-lg shadow-md transition-all duration-300 ease-in-out ${filtersVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 sm:translate-y-0 sm:opacity-100'}`}>
        <input type="text" placeholder="Search all fields..." value={search} onChange={(e) => setSearch(e.target.value)} className="p-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:flex-grow sm:basis-48" />
        <select value={selectedPlantName} onChange={handlePlantNameChange} className="p-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:flex-grow-[2] sm:basis-60">
          <option value="">Filter by Project Name</option>
          {uniquePlantNames.map((name) => (
            <option key={name} value={name}>
              {name.replace(/\b\w/g, l => l.toUpperCase())}
            </option>
          ))}
        </select>
        <select value={selectedCountry} onChange={handleCountryChange} className="p-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:flex-grow sm:basis-40">
          <option value="">Country</option>
          {countries.map((country) => (
            <option key={country} value={country}>
              {country.replace(/\b\w/g, l => l.toUpperCase())}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="p-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:flex-grow sm:basis-40">
          <option value="">Status</option>
          {statuses.map((statusOption) => (
            <option key={statusOption} value={statusOption}>
              {statusOption.replace(/\b\w/g, l => l.toUpperCase())}
            </option>
          ))}
        </select>
        <select value={endUse} onChange={(e) => setEndUse(e.target.value)} className="p-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:flex-grow sm:basis-40">
          <option value="">End Use</option>
          {endUses.map((endUseOption) => (
            <option key={endUseOption} value={endUseOption}>
              {endUseOption.replace(/\b\w/g, l => l.toUpperCase())}
            </option>
          ))}
        </select>
        <select value={plantType} onChange={(e) => setPlantType(e.target.value)} className="p-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:flex-grow sm:basis-40">
          <option value="">Sector</option>
          {plantTypeValues.map((typeOption) => (
            <option key={typeOption} value={typeOption}>
              {typeOption.replace(/\b\w/g, l => l.toUpperCase())}
            </option>
          ))}
        </select>
      </div>

      <div className={`fixed bottom-4 left-4 w-52 p-3 bg-white border-2 border-gray-300 rounded shadow-md z-[600] text-black text-xs transition-all duration-300 ${legendPinned || legendVisible ? 'opacity-100' : 'opacity-0'}`} onMouseEnter={() => setLegendVisible(true)} onMouseLeave={() => !legendPinned && setLegendVisible(false)}>
        <div className="flex justify-between items-center text-black">
          <strong>Legend</strong>
          <button onClick={toggleLegendPin} className={`text-sm ${legendPinned ? 'text-blue-600' : 'text-black'}`} title={legendPinned ? 'Unpin Legend' : 'Pin Legend'}>
            <i className={`fa fa-thumbtack ${legendPinned ? 'rotate-45' : ''}`} />
          </button>
        </div>
        <div className="mt-2 text-black max-h-48 overflow-y-auto pr-1 custom-scroll">
          {statusTypes.map(({ sector, status }, index) => {
            let icon = 'question';
            if (sector.toLowerCase() === 'production') icon = 'bolt';
            else if (sector.toLowerCase() === 'storage') icon = 'database';
            else if (sector.toLowerCase() === 'ccus') icon = 'leaf';
            else if (sector.toLowerCase() === 'port') icon = 'ship';
            else if (sector.toLowerCase() === 'pipeline') {
              return (
                <div key={`${sector}-${status}-${index}`} className="flex items-center mt-1">
                  <div style={{ width: 18, height: 4, backgroundColor: statusColorMap[status.toLowerCase()] || statusColorMap['other/unknown'], marginRight: 5 }}></div>
                  <span>Pipeline - {status.replace(/\b\w/g, l => l.toUpperCase())}</span>
                </div>
              );
            }
            return (
              <div key={`${sector}-${status}-${index}`} className="flex items-center mt-1">
                <i className={`fa fa-${icon} fa-fw`} style={{ color: statusColorMap[status.toLowerCase()] || statusColorMap['other/unknown'], marginRight: 5 }}></i>
                <span>{`${sector.replace(/\b\w/g, l => l.toUpperCase())} - ${status.replace(/\b\w/g, l => l.toUpperCase())}`}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-2 text-xs italic text-black">Use the measuring tool on the left to calculate distances</div>
      </div>

      <button onClick={() => (window.location.href = '/plant-widget')} className="fixed top-1/2 right-4 -translate-y-1/2 z-[600] bg-blue-600/80 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm hover:bg-blue-600 transition-colors">
        <span>Plant List</span>
        <i className="fa fa-arrow-right" />
      </button>

      <button onClick={handleFindMe} className="fixed bottom-20 right-4 z-[600] bg-white text-blue-600 w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-lg transition-transform hover:scale-105" title="Find My Location">
        <i className="fas fa-location-arrow" />
      </button>
    </div>
  );
};

export default LeafletMap;