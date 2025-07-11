import { ProductionItem, StorageItem, CCUSItem, PortItem, PipelineItem, CCUSReference } from '@/lib/types2';

// Helper function to format field names (e.g., project_name → Project Name)
const formatFieldName = (key: string): string => {
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Helper function to format field values
const formatValue = (value: any): string => {
  if (value === null || value === undefined || value === '') return 'N/A';
  if (Array.isArray(value)) {
    if (value.length === 0) return 'N/A';
    if (value[0] && typeof value[0] === 'object' && 'link' in value[0]) {
      // Handle CCUSReference[] for CCUS, only show links
      return value
        .filter((ref: CCUSReference) => ref.link)
        .map((ref: CCUSReference) => ref.link)
        .join(', ');
    }
    return value.join(', ');
  }
  if (typeof value === 'object') {
    // Handle objects like announced_size or investment
    if ('unit' in value && 'value' in value) {
      return `${value.value} ${value.unit}${value.vessels ? ` (${value.vessels} vessels)` : ''}`;
    }
    if ('costs_musd' in value) {
      return value.costs_musd;
    }
    return JSON.stringify(value);
  }
  return String(value);
};

// Main function to generate popup HTML
export const generatePopupHtml = (
  props: ProductionItem | StorageItem | CCUSItem | PortItem | PipelineItem,
  type: 'Production' | 'Storage' | 'CCUS' | 'Port' | 'Pipeline'
): string => {
  const excludedFields = ['id', 'internal_id', 'ref_id', 'latitude', 'longitude', 'ref'];
  const entries = Object.entries(props).filter(([key, value]) => {
    if (excludedFields.includes(key)) return false; // Exclude specified fields
    return value !== null && value !== undefined && value !== '' && (!Array.isArray(value) || value.length > 0);
  });

  const popupContent = entries
    .map(([key, value]) => {
      return `<b>${formatFieldName(key)}:</b> ${formatValue(value)}`;
    })
    .join('<br>');

  const verifyButton = 'internal_id' in props && props.internal_id
    ? `<button onclick="window.location.href='/plant-form/${type.toLowerCase()}/${props.internal_id}'" class="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">Verify</button>`
    : '<span class="text-red-500 text-xs">No ID available</span>';

  return `
    <div class="max-w-xs p-2 text-sm">
      ${popupContent}
      ${verifyButton}
    </div>
  `;
};