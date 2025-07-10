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
    type: 'Point' | 'LineString';
    coordinates: [number, number] | [number, number][];
  };
  properties: {
    id?: number;
    internal_id?: string;
    name?: string; // Maps to project_name for ports
    pipeline_name?: string; // For pipelines
    status?: string;
    type?: string; // 'production', 'storage', 'ccus', 'port', or 'pipeline'
    capacity_mw?: number; // For hydrogen/CCUS
    capacity_kt_y?: number | null; // For ports
    announced_size?: { unit: string; value: number; vessels?: number; capacity_per_vessel?: number }; // For ports
    end_use?: string; // For hydrogen/CCUS
    trade_type?: string; // For ports
    consumption_tpy?: number; // For hydrogen/CCUS
    start_year?: number;
    city?: string;
    country?: string;
    process?: string;
    secondary_product?: string;
    partners?: string; // For ports
    investment?: { costs_musd: string }; // For ports
    segment_id?: string; // For pipelines
    segment_order?: number; // For pipelines
    start_location?: string; // For pipelines
    stop_location?: string; // For pipelines
    pipeline_number?: string; // For pipelines
    infrastructure_type?: string; // For pipelines
    total_segments?: number; // For pipelines
  };
}

const getUniqueValues = (features: Feature[], key: keyof Feature['properties']) => {
  return Array.from(
    new Set(
      features
        .map((f) => f.properties[key])
        .filter((v): v is string | number => v !== null && v !== undefined && v !== '' && v !== 'N/A' && v !== 'Unknown Feature')
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
  const [allData, setAllData] = useState<Feature[]>([]);
  const [statusTypes, setStatusTypes] = useState<{ sector: string; current_status: string }[]>([]);
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
    return (
      (search === '' ||
        Object.values(f.properties).some(
          (v) => typeof v === 'string' && v.toLowerCase().includes(search.toLowerCase())
        )) &&
      (status === '' || (f.properties.status && f.properties.status.toLowerCase() === status.toLowerCase())) &&
      (endUse === '' || (f.properties.end_use && f.properties.end_use.toLowerCase().includes(endUse.toLowerCase()))) &&
      (plantType === '' || (f.properties.type && f.properties.type.toLowerCase() === plantType.toLowerCase())) &&
      (selectedCountry === '' || (f.properties.country && f.properties.country.toLowerCase() === selectedCountry.toLowerCase()))
    );
  });

  const plantNames = getUniqueValues(filtered, 'name');
  const countries = getUniqueValues(allData, 'country');
  const statuses = getUniqueValues(allData, 'status');
  const endUses = getUniqueValues(allData, 'end_use');
  const plantTypes = getUniqueValues(allData, 'type');

  useEffect(() => {
    if (!mapRef.current || !selectedPlantName) return;

    const feature = allData.find((f) => f.properties.name === selectedPlantName || f.properties.pipeline_name === selectedPlantName);

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
        (v) => typeof v === 'string' && v.toLowerCase().includes(search.toLowerCase())
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

    const getHydrogenIcon = (status: string | undefined | null, type: string | undefined | null) => {
      const statusKey = status ? status.toLowerCase() : 'other/unknown';
      const color = statusColorMap[statusKey] || statusColorMap['other/unknown'];

      let iconName = 'question';
      if (type?.toLowerCase() === 'production') iconName = 'bolt';
      else if (type?.toLowerCase() === 'storage') iconName = 'database';
      else if (type?.toLowerCase() === 'ccus') iconName = 'leaf';
      else if (type?.toLowerCase() === 'port') iconName = 'ship';

      return L.AwesomeMarkers.icon({
        markerColor: color,
        iconColor: 'white',
        icon: iconName,
        prefix: 'fa',
      });
    };

    const fetchAndAddMarkerFromJson = async (data: any, datasetType: 'hydrogen' | 'ccus' | 'ports' | 'pipelines') => {
      if (!data || !Array.isArray(data.features)) {
        console.warn(`Missing or invalid data for ${datasetType}`);
        return;
      }

      data.features.forEach((feature: Feature) => {
        const coords = feature.geometry?.coordinates;
        const props = feature.properties;

        if (datasetType === 'pipelines' && feature.geometry.type === 'LineString') {
          if (
            Array.isArray(coords) &&
            coords.length >= 2 &&
            coords.every((c: any) => Array.isArray(c) && c.length === 2 && typeof c[0] === 'number' && typeof c[1] === 'number')
          ) {
            const latlngs = (coords as [number, number][]).map(([lng, lat]) => [lat, lng] as [number, number]);
            const polyline = L.polyline(latlngs, {
              color: 'red',
              weight: 4,
            })
              .bindPopup(`
                <div class="max-w-xs p-2 text-sm">
                  From ${props.start_location || 'N/A'} to ${props.stop_location || 'N/A'}
                </div>
              `)
              .on('click', () => {
                const params = new URLSearchParams();
                if (props.pipeline_name) {
                  params.set('plantName', props.pipeline_name);
                  setSelectedPlantName(props.pipeline_name);
                }
                window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
                if (mapRef.current && latlngs.length > 0) {
                  mapRef.current.setView(latlngs[0], 10);
                }
              });
            pipelineLayer.addLayer(polyline);
          } else {
            console.warn(`Skipping pipeline feature with invalid coordinates:`, { feature });
          }
        } else if (feature.geometry.type === 'Point') {
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
            console.warn(`Skipping ${datasetType} feature with invalid or missing coordinates:`, {
              feature,
              reason: !coords
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

          const pointCoords = coords as [number, number];
          const icon = getHydrogenIcon(props.status, props.type);

          const popupHtml = `
            <div class="max-w-xs p-2 text-sm">
              <b>Project Name:</b> ${props.name || 'N/A'}<br>
              <b>Type:</b> ${props.type || 'N/A'}<br>
              <b>Status:</b> ${props.status || 'N/A'}<br>
              ${
                props.type?.toLowerCase() === 'port'
                  ? `
                    <b>Trade Type:</b> ${props.trade_type || 'N/A'}<br>
                    <b>Capacity:</b> ${
                      props.announced_size?.value
                        ? `${props.announced_size.value} ${props.announced_size.unit}${
                            props.announced_size.vessels ? ` (${props.announced_size.vessels} vessels)` : ''
                          }`
                        : 'N/A'
                    }<br>
                    <b>Partners:</b> ${props.partners || 'N/A'}<br>
                    <b>Investment:</b> ${props.investment?.costs_musd || 'N/A'}<br>
                  `
                  : `
                    <b>Start Year:</b> ${props.start_year || 'N/A'}<br>
                    <b>Capacity:</b> ${props.capacity_mw || 'N/A'} MW<br>
                    <b>Process:</b> ${props.process || 'N/A'}<br>
                    <b>End-use:</b> ${props.end_use || 'N/A'}<br>
                    <b>Consumption:</b> ${props.consumption_tpy || 'N/A'} t/y<br>
                  `
              }
              <b>City:</b> ${props.city || 'N/A'}<br>
              <b>Country:</b> ${props.country || 'N/A'}<br>
              ${
                props.internal_id
                  ? `<button onclick="window.location.href='${
                      props.type?.toLowerCase() === 'port' ? `/port-form/${props.internal_id}` : `/plant-form/hydrogen/${props.internal_id}`
                    }'" class="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">Verify</button>`
                  : '<span class="text-red-500 text-xs">No ID available</span>'
              }
            </div>
          `;

          const marker = L.marker([pointCoords[1], pointCoords[0]], { icon })
            .bindTooltip(props.name || 'Unnamed', { sticky: true })
            .bindPopup(popupHtml)
            .on('click', () => {
              const params = new URLSearchParams();
              if (props.name) {
                params.set('plantName', props.name);
                setSelectedPlantName(props.name);
              }
              window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
              if (mapRef.current) {
                mapRef.current.setView([pointCoords[1], pointCoords[0]], 12);
              }
            });

          if (props.type?.toLowerCase() === 'production') {
            productionCluster.addLayer(marker);
          } else if (props.type?.toLowerCase() === 'storage') {
            storageCluster.addLayer(marker);
          } else if (props.type?.toLowerCase() === 'ccus') {
            ccusCluster.addLayer(marker);
          } else if (props.type?.toLowerCase() === 'port') {
            portsCluster.addLayer(marker);
          } else {
            productionCluster.addLayer(marker);
          }
        }
      });
    };

    const fetchData = async () => {
      try {
        const dataResponse = await fetch('/api/data');
        const datasets = await dataResponse.json();
        const hydrogenAndCcusData = [...(datasets.hydrogen?.features || []), ...(datasets.ccus?.features || [])].filter(
          (feature: Feature) => {
            const coords = feature.geometry?.coordinates;
            return (
              coords &&
              Array.isArray(coords) &&
              coords.length === 2 &&
              typeof coords[0] === 'number' &&
              typeof coords[1] === 'number' &&
              coords[0] !== 0 &&
              coords[1] !== 0 &&
              !isNaN(coords[0]) &&
              !isNaN(coords[1])
            );
          }
        );

        const portsResponse = await fetch('/api/data/ports');
        const portsData = await portsResponse.json();
        const portsValidData = (portsData.ports?.features || []).filter(
          (feature: Feature) => {
            const coords = feature.geometry?.coordinates;
            return (
              coords &&
              Array.isArray(coords) &&
              coords.length === 2 &&
              typeof coords[0] === 'number' &&
              typeof coords[1] === 'number' &&
              coords[0] !== 0 &&
              coords[1] !== 0 &&
              !isNaN(coords[0]) &&
              !isNaN(coords[1])
            );
          }
        );

        const pipelinesResponse = await fetch('/api/data/pipelines');
        const pipelinesData = await pipelinesResponse.json();
        const pipelinesValidData = (pipelinesData.pipelines?.features || []).filter(
          (feature: Feature) => {
            const coords = feature.geometry?.coordinates;
            return (
              coords &&
              Array.isArray(coords) &&
              coords.length >= 2 &&
              coords.every((c: any) => Array.isArray(c) && c.length === 2 && typeof c[0] === 'number' && typeof c[1] === 'number')
            );
          }
        );

        const combinedData = [...hydrogenAndCcusData, ...portsValidData, ...pipelinesValidData];
        setAllData(combinedData);

        await Promise.all([
          fetchAndAddMarkerFromJson(datasets.hydrogen, 'hydrogen'),
          fetchAndAddMarkerFromJson(datasets.ccus, 'ccus'),
          fetchAndAddMarkerFromJson(portsData.ports, 'ports'),
          fetchAndAddMarkerFromJson(pipelinesData.pipelines, 'pipelines'),
        ]);

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
          {statusTypes.map(({ sector, current_status }) => {
            let icon = 'question';
            if (sector.toLowerCase() === 'production') icon = 'bolt';
            else if (sector.toLowerCase() === 'storage') icon = 'database';
            else if (sector.toLowerCase() === 'ccus') icon = 'leaf';
            else if (sector.toLowerCase() === 'port') icon = 'ship';
            else if (sector.toLowerCase() === 'pipeline') {
              return (
                <div key={`${sector}-${current_status}`} className="flex items-center mt-1">
                  <div style={{ width: 18, height: 4, backgroundColor: 'red', marginRight: 5 }}></div>
                  <span>Pipeline</span>
                </div>
              );
            }

            return (
              <div key={`${sector}-${current_status}`} className="flex items-center mt-1">
                <i
                  className={`fa fa-${icon}`}
                  style={{
                    color: statusColorMap[current_status.toLowerCase()] || statusColorMap['other/unknown'],
                    marginRight: 5,
                  }}
                ></i>
                <span>{sector} - {current_status}</span>
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
