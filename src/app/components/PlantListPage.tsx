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
    type?: string;
    capacity_mw?: number | null;
    end_use?: string;
    start_year?: number | null;
    country?: string;
    process?: string;
  };
}

export default function PlantListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type');
  const [hydrogenPlants, setHydrogenPlants] = useState<Feature[]>([]);
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
      .then(res => res.json())
      .then(data => setHydrogenPlants(data.hydrogen.features || []))
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const filtered = hydrogenPlants.filter(f => {
    const p = f.properties;
    return (
      (!typeParam || p.type === typeParam) &&
      (!search || p.name?.toLowerCase().includes(search.toLowerCase())) &&
      (!filters.status || p.status === filters.status) &&
      (!filters.process || p.process === filters.process) &&
      (!filters.end_use || p.end_use === filters.end_use)
    );
  });

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  const getOptions = (key: keyof Feature['properties']) => [
    ...new Set(hydrogenPlants.map(p => p.properties[key]).filter((v): v is string => typeof v === 'string')),
  ];

  const handleVerify = (internal_id?: string) => {
    if (internal_id) {
      router.push(`/plant-form/hydrogen/${internal_id}`);
    }
  };

  return (
    <div style={{ fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#f5f9fc', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          <Image src="/gex-logo-2.png" alt="GEX Logo" width={50} height={80} />
        </div>
        <h1 style={{ fontSize: 28, margin: '10px 0', color: '#006CB5' }}>GEX Database</h1>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', background: 'white', borderRadius: 10, padding: 20, boxShadow: '0 0 6px rgba(0,0,0,0.05)' }}>
        <input
          type="text"
          placeholder="Search by Plant Name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: 10, border: '1px solid #ccc', borderRadius: 6, width: '100%', marginBottom: 15 }}
        />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'nowrap', justifyContent: 'center' }}>
          <SelectBox label="Status" options={getOptions('status')} value={filters.status} onChange={(v) => handleFilterChange('status', v)} />
          <SelectBox label="Process" options={getOptions('process')} value={filters.process} onChange={(v) => handleFilterChange('process', v)} />
          <SelectBox label="End Use" options={getOptions('end_use')} value={filters.end_use} onChange={(v) => handleFilterChange('end_use', v)} />
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '30px auto', background: 'white', padding: 20, borderRadius: 8, boxShadow: '0 0 6px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#eaf3fb' }}>
            <tr>
              {['Plant Name', 'Type', 'End Use', 'Status', 'Country', 'Process', 'Capacity (MW)', 'Start Year', 'Data Verification'].map((h, i) => (
                <th key={i} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((p, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                <td style={td}>{p.properties.name || 'Not Available'}</td>
                <td style={td}>{p.properties.type || 'Not Available'}</td>
                <td style={td}>{p.properties.end_use || 'Not Available'}</td>
                <td style={td}>{p.properties.status || 'Not Available'}</td>
                <td style={td}>{p.properties.country || 'Not Available'}</td>
                <td style={td}>{p.properties.process || 'Not Available'}</td>
                <td style={td}>{p.properties.capacity_mw ?? 'Not Available'}</td>
                <td style={td}>{p.properties.start_year ?? 'Not Available'}</td>
                <td style={td}>
                  <button
                    style={verifyBtn}
                    onClick={() => handleVerify(p.properties.internal_id)}
                    disabled={!p.properties.internal_id}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = '#006CB5';
                      e.currentTarget.style.color = '#fff';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = '#fff';
                      e.currentTarget.style.color = '#006CB5';
                    }}
                  >
                    Verify
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ textAlign: 'right', marginTop: 12, color: '#555', fontSize: 14 }}>
          Page {page} of {totalPages}
          <button onClick={() => setPage(p => Math.max(1, p - 1))} style={navBtn} disabled={page === 1}>{'<'}</button>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} style={navBtn} disabled={page === totalPages}>{'>'}</button>
        </div>
      </div>

      <button
        onClick={() => router.push('/plant-widget')}
        style={{
          position: 'fixed',
          top: '50%',
          left: 20,
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
        <i className="fa fa-arrow-left" /> <span>Back</span>
      </button>
    </div>
  );
}

const SelectBox = ({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    style={{ padding: 10, borderRadius: 6, border: '1px solid #ccc', minWidth: 160, color: value ? '#000' : '#999' }}
  >
    <option value="">{label}</option>
    {options.map(opt => (
      <option key={opt} value={opt}>{opt}</option>
    ))}
  </select>
);

const th: React.CSSProperties = {
  padding: '10px 12px',
  textAlign: 'left',
  fontWeight: 600,
  fontSize: 14,
  color: '#004970',
};

const td: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: 14,
  color: '#333',
};

const verifyBtn: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: 20,
  border: '1px solid #006CB5',
  backgroundColor: '#fff',
  color: '#006CB5',
  cursor: 'pointer',
  fontSize: 13,
  transition: 'background-color 0.3s ease, color 0.3s ease',
};

const navBtn: React.CSSProperties = {
  marginLeft: 10,
  padding: '4px 10px',
  fontSize: 14,
  border: '1px solid #ccc',
  borderRadius: 4,
  background: '#fff',
  cursor: 'pointer',
};
