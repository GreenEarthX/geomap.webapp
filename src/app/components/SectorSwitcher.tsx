'use client';

import { useRouter } from 'next/navigation';
import { ReactElement } from 'react';

// Updated with values and labels for consistency with the widget page
const SECTORS = [
  { value: 'all', label: 'All Plants' },
  { value: 'Production', label: 'Production Plants' },
  { value: 'CCUS', label: 'CCUS Plants' },
  { value: 'Storage', label: 'Storage Plants' },
  { value: 'ports', label: 'Ports' },
];

/**
 * A client component that provides a dropdown for navigating between different sector list views.
 */
export default function SectorSwitcher(): ReactElement {
  const router = useRouter();

  const handleSectorChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value;

    if (selectedValue === 'all') {
      // Navigates to the list of all plants
      router.push('/plant-list');
    } else if (selectedValue === 'ports') {
      // Navigates to the dedicated ports page
      router.push('/ports');
    } else {
      // Navigates to the plant list, filtered by type (Production, Storage, CCUS)
      router.push(`/plant-list?type=${selectedValue}`);
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6 border border-gray-200 dark:border-gray-700">
      <label htmlFor="sector-switcher" className="block text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
        Explore Infrastructure
      </label>
      <select
        id="sector-switcher"
        onChange={handleSectorChange}
        className="w-full p-3 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        defaultValue="" // Start with a placeholder
      >
        <option value="" disabled>-- Select a category to view --</option>
        {SECTORS.map((sector) => (
          <option key={sector.value} value={sector.value}>
            {sector.label}
          </option>
        ))}
      </select>
    </div>
  );
}