'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

interface Feature {
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
    type?: string; // This property is key for the fix
    capacity_mw?: number | null;
    end_use?: string;
    start_year?: number | null;
    country?: string;
    process?: string;
    // Add any other potential properties from your different data types
    project_name?: string; 
  };
}

interface SelectBoxProps {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

export default function PlantListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type');
  const [plantList, setPlantList] = useState<Feature[]>([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    process: '',
    end_use: '',
  });
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetch('/api/data')
      .then((res) => res.json())
      .then((data) => {
        let combined: Feature[] = [];
        if (typeParam === 'CCUS') {
          combined = data.ccus?.features ?? [];
        } else if (typeParam === 'Production' || typeParam === 'Storage' || typeParam === 'Port') {
          // Assuming 'hydrogen' and 'ports' are the sources
          const allFeatures = [
            ...(data.hydrogen?.features ?? []),
            ...(data.ports?.features ?? [])
          ];
          combined = allFeatures.filter(
            (f: Feature) => f.properties.type === typeParam
          );
        } else {
          // This case handles when NO typeParam is present (shows all)
          combined = [
            ...(data.hydrogen?.features ?? []),
            ...(data.ccus?.features ?? []),
            ...(data.ports?.features ?? []),
            // Add any other data sources here
          ];
        }
        setPlantList(combined);
      })
      .catch((error) => console.error('Error fetching data:', error));
  }, [typeParam]);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const filtered = plantList.filter((f) => {
    const p = f.properties;
    const nameMatch = p.name || p.project_name || '';
    return (
      (!search || nameMatch.toLowerCase().includes(search.toLowerCase())) &&
      (!filters.status || p.status === filters.status) &&
      (!filters.process || p.process === filters.process) &&
      (!filters.end_use || p.end_use === filters.end_use)
    );
  });

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  const getOptions = (key: keyof Feature['properties']) => [
    ...new Set(
      plantList
        .map((p) => p.properties[key])
        .filter((v): v is string => typeof v === 'string' && v.trim() !== '')
    ),
  ].sort();

  // ✅ FIXED: Now accepts the specific plant's type
  const handleVerify = (internal_id?: string, plantType?: string) => {
    if (!internal_id || !plantType) return;

    // ✅ FIXED: Uses the passed-in plantType, not the URL's typeParam
    const type = plantType.toLowerCase(); 

    switch (type) {
        case 'production':
            router.push(`/plant-form/production/${internal_id}`);
            break;
        case 'storage':
            router.push(`/plant-form/storage/${internal_id}`);
            break;
        case 'ccus':
            router.push(`/plant-form/ccus/${internal_id}`);
            break;
        case 'port':
            router.push(`/port-form/${internal_id}`);
            break;
        default:
            console.error('Unknown plant type for verification:', plantType);
            break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <div className="text-center mb-6 pt-6">
        <div className="flex justify-center items-center gap-3">
          <Image
            src="/gex-logo-2.png"
            alt="GEX Logo"
            width={50}
            height={80}
            className="h-16 w-auto"
          />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-blue-600 mt-2">
          GEX Database
        </h1>
      </div>

      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-sm p-4 md:p-6 mb-8">
        <input
          type="text"
          placeholder="Search by Plant Name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <SelectBox
            label="Status"
            options={getOptions('status')}
            value={filters.status}
            onChange={(v) => handleFilterChange('status', v)}
          />
          <SelectBox
            label="Process"
            options={getOptions('process')}
            value={filters.process}
            onChange={(v) => handleFilterChange('process', v)}
          />
          <SelectBox
            label="End Use"
            options={getOptions('end_use')}
            value={filters.end_use}
            onChange={(v) => handleFilterChange('end_use', v)}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-sm p-4 md:p-6">
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse">
            <thead className="bg-blue-50">
              <tr>
                {[
                  'Plant Name',
                  'Type',
                  'End Use',
                  'Status',
                  'Country',
                  'Process',
                  'Capacity (MW)',
                  'Start Year',
                  'Data Verification',
                ].map((header, index) => (
                  <th
                    key={index}
                    className={`px-4 py-3 text-left text-sm font-semibold text-blue-800 min-w-[120px] ${
                      header === 'Data Verification' ? 'sticky right-0 bg-blue-50 z-10' : ''
                    }`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((p, index) => (
                <tr
                  key={`${p.properties.internal_id}-${index}`}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {p.properties.name || p.properties.project_name || 'Not Available'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {p.properties.type || 'Not Available'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {p.properties.end_use || 'Not Available'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {p.properties.status || 'Not Available'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {p.properties.country || 'Not Available'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {p.properties.process || 'Not Available'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {p.properties.capacity_mw ?? 'Not Available'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {p.properties.start_year ?? 'Not Available'}
                  </td>
                  <td className="px-4 py-3 text-sm sticky right-0 bg-white z-10">
                    <button
                      className="px-3 py-1.5 border border-blue-600 text-blue-600 rounded-full text-sm hover:bg-blue-600 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      // ✅ FIXED: Pass the specific plant type to the handler
                      onClick={() => handleVerify(p.properties.internal_id, p.properties.type)}
                      disabled={!p.properties.internal_id || !p.properties.type}
                    >
                      Verify
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end items-center mt-4 text-sm text-gray-600">
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="ml-3 px-3 py-1 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {'<'}
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="ml-2 px-3 py-1 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {'>'}
          </button>
        </div>
      </div>

      <button
        onClick={() => router.push('/plant-widget')}
        className="fixed top-1/2 left-4 transform -translate-y-1/2 bg-blue-600/80 text-white border-none rounded-full px-4 py-2 text-sm flex items-center gap-2 hover:bg-blue-600 transition-colors shadow-lg z-50"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        <span>Back</span>
      </button>
    </div>
  );
}

const SelectBox: React.FC<SelectBoxProps> = ({ label, options, value, onChange }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="p-3 border border-gray-300 rounded-md min-w-[140px] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
  >
    <option value="" className="text-gray-500">
      {`All ${label}s`}
    </option>
    {options.map((opt) => (
      <option key={opt} value={opt}>
        {opt}
      </option>
    ))}
  </select>
);