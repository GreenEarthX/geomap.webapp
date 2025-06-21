'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface Feature {
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
    secondary_product?: string;
  };
}

export default function PlantListPage() {
  const [hydrogenPlants, setHydrogenPlants] = useState<Feature[]>([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    location: '',
    status: '',
    production: '',
    end_use: '',
  });
  const [page, setPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(data => setHydrogenPlants(data.hydrogen.features || []));
  }, []);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const filtered = hydrogenPlants.filter(f => {
    const p = f.properties;
    return (
      (!search || p.name?.toLowerCase().includes(search.toLowerCase())) &&
      (!filters.location || p.location === filters.location) &&
      (!filters.status || p.status === filters.status) &&
      (!filters.production || p.sector === filters.production) &&
      (!filters.end_use || p.end_use === filters.end_use)
    );
  });

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  const getOptions = (key: keyof Feature['properties']) => [
    ...new Set(hydrogenPlants.map(p => p.properties[key]).filter((v): v is string => typeof v === 'string')),
  ];

  return (
    <div style={{ fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#f5f9fc', minHeight: '100vh' }}>
      {/* Top Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px' }}>
        <div style={{ flex: 1 }}></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button style={authButton}>Login</button>
          <button style={authButton}>Sign Up</button>
        </div>
      </div>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          <Image src="/gex-logo-2.png" alt="GEX Logo" width={50} height={80} />
        </div>
        <h1 style={{ fontSize: 28, margin: '10px 0', color: '#006CB5' }}>GEX Database</h1>
      </div>

      {/* Filters */}
      <div style={{ maxWidth: 1100, margin: '0 auto', background: 'white', borderRadius: 10, padding: 20, boxShadow: '0 0 6px rgba(0,0,0,0.05)' }}>
        <input
          type="text"
          placeholder="Search by Plant Name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: 10, border: '1px solid #ccc', borderRadius: 6, width: '100%', marginBottom: 15 }}
        />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'nowrap', justifyContent: 'center' }}>
          <SelectBox label="Location" options={getOptions('location')} value={filters.location} onChange={(v) => handleFilterChange('location', v)} />
          <SelectBox label="Status" options={getOptions('status')} value={filters.status} onChange={(v) => handleFilterChange('status', v)} />
          <SelectBox label="Production" options={getOptions('sector')} value={filters.production} onChange={(v) => handleFilterChange('production', v)} />
          <SelectBox label="End Use" options={getOptions('end_use')} value={filters.end_use} onChange={(v) => handleFilterChange('end_use', v)} />
        </div>
      </div>

      {/* Table */}
      <div style={{ maxWidth: 1100, margin: '30px auto', background: 'white', padding: 20, borderRadius: 8, boxShadow: '0 0 6px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#eaf3fb' }}>
            <tr>
              {['Plant Name', 'Type', 'End Use', 'Status', 'Address', 'Production', 'Secondary Product', 'Data Verification'].map((h, i) => (
                <th key={i} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((p, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                <td style={td}>{p.properties.name}</td>
                <td style={td}>{p.properties.type || 'Not Available'}</td>
                <td style={td}>{p.properties.end_use || 'Not Available'}</td>
                <td style={td}>{p.properties.status}</td>
                <td style={td}>{p.properties.location}</td>
                <td style={td}>{p.properties.sector || 'Not Available'}</td>
                <td style={td}>{p.properties.secondary_product || 'Not Available'}</td>
                <td style={td}><button style={verifyBtn}>Verify</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ textAlign: 'right', marginTop: 12, color: '#555', fontSize: 14 }}>
          Page {page} of {totalPages}
          <button onClick={() => setPage(p => Math.max(1, p - 1))} style={navBtn} disabled={page === 1}>&lt;</button>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} style={navBtn} disabled={page === totalPages}>&gt;</button>
        </div>
      </div>

      {/* Back to Map Button */}
      <button
        onClick={() => window.location.href = '/'}
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
        <i className="fa fa-arrow-left" /> <span>Map</span>
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

const authButton: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: 6,
  backgroundColor: '#006CB5',
  color: '#fff',
  border: 'none',
  cursor: 'pointer',
};
