'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function PlantTypeWidgetsPage() {
  const router = useRouter();

  const cards = [
    {
      title: 'Production Plants',
      image: '/plants/production-plant.png',
      color: '#006CB5',
      onClick: () => router.push('/plant-list?type=Production'),
    },
    {
      title: 'Storage Plants',
      image: '/plants/storage-plant.png',
      color: '#009688',
      onClick: () => router.push('/plant-list?type=Storage'),
    },
    {
      title: 'All Plants',
      image: '/plants/all-plants.png',
      color: '#673AB7',
      onClick: () => router.push('/plant-list'),
    },
  ];

  return (
    <div style={{ fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#f3f7fa', minHeight: '100vh', padding: '40px 20px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div
          style={{
            width: 80,
            height: 80,
            margin: '0 auto',
            position: 'relative',
          }}
        >
          <Image
            src="/gex-logo-2.png"
            alt="GEX Logo"
            fill
            style={{ objectFit: 'contain' }}
            priority
          />
        </div>
        <h1 style={{ fontSize: 32, marginTop: 20, color: '#004970' }}>Explore Hydrogen Plants</h1>
        <p style={{ fontSize: 16, color: '#555' }}>Select a plant category to view details</p>
      </div>

      {/* Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, maxWidth: 1000, margin: '0 auto' }}>
        {cards.map((card, i) => (
          <div
            key={i}
            onClick={card.onClick}
            style={{
              background: card.color,
              borderRadius: 16,
              color: 'white',
              cursor: 'pointer',
              overflow: 'hidden',
              transition: 'transform 0.3s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <div style={{ height: 160, position: 'relative' }}>
              <Image src={card.image} alt={card.title} layout="fill" objectFit="cover" />
            </div>
            <div style={{ padding: 20, fontSize: 20, fontWeight: 600, textAlign: 'center' }}>{card.title}</div>
          </div>
        ))}
      </div>

      {/* Back to Map Button */}
      <button
        onClick={() => router.push('/')}
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
