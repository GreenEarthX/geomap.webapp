// lib/columns.ts
import { CCUSItem, ProductionItem, StorageItem } from './types2';

export interface Column {
  header: string;
  accessor: (properties: CCUSItem | ProductionItem | StorageItem) => string | number | undefined;
}

export const productionColumns: Column[] = [
  {
    header: 'Plant Name',
    accessor: (p: CCUSItem | ProductionItem | StorageItem) =>
      ('name' in p ? p.name : p.project_name) ?? 'Unknown Feature',
  },
  {
    header: 'Type',
    accessor: (p: CCUSItem | ProductionItem | StorageItem) => p.type,
  },
  {
    header: 'End Use',
    accessor: (p: CCUSItem | ProductionItem | StorageItem) => {
      if (p.type === 'Production') {
        const production = p as ProductionItem;
        return production.end_use?.join(', ') ?? '';
      }
      return '';
    },
  },
  {
    header: 'Status',
    accessor: (p: CCUSItem | ProductionItem | StorageItem) =>
      ('status' in p ? p.status : '') ?? '',
  },
  {
    header: 'Country',
    accessor: (p: CCUSItem | ProductionItem | StorageItem) => p.country ?? '',
  },
  {
    header: 'Technology',
    accessor: (p: CCUSItem | ProductionItem | StorageItem) =>
      ('technology' in p ? p.technology : '') ?? '',
  },
  {
    header: 'Capacity (MW)',
    accessor: (p: CCUSItem | ProductionItem | StorageItem) =>
      'capacity_value' in p ? (p.capacity_value !== null ? p.capacity_value : undefined) : undefined,
  },
  {
    header: 'Date Online',
    accessor: (p: CCUSItem | ProductionItem | StorageItem) =>
      ('date_online' in p ? p.date_online : '') ?? '',
  },
  {
    header: 'Data Verification',
    accessor: (p: CCUSItem | ProductionItem | StorageItem) => undefined,
  },
];

export const storageColumns: Column[] = [
  {
    header: 'Project Name',
    accessor: (p: CCUSItem | ProductionItem | StorageItem) =>
      ('project_name' in p ? p.project_name : '') ?? '',
  },
  {
    header: 'Type',
    accessor: (p: CCUSItem | ProductionItem | StorageItem) => p.type,
  },
  {
    header: 'Status',
    accessor: (p: CCUSItem | ProductionItem | StorageItem) =>
      ('status' in p ? p.status : '') ?? '',
  },
  {
    header: 'Country',
    accessor: (p: CCUSItem | ProductionItem | StorageItem) => p.country ?? '',
  },
  {
    header: 'Storage Capacity (kt/year)',
    accessor: (p: CCUSItem | ProductionItem | StorageItem) =>
      'storage_mass_kt_per_year_value' in p
        ? p.storage_mass_kt_per_year_value !== null
          ? p.storage_mass_kt_per_year_value
          : undefined
        : undefined,
  },
  {
    header: 'Date Online',
    accessor: (p: CCUSItem | ProductionItem | StorageItem) =>
      ('date_online' in p ? p.date_online : '') ?? '',
  },
  {
    header: 'Data Verification',
    accessor: (p: CCUSItem | ProductionItem | StorageItem) => undefined,
  },
];

export const ccusColumns: Column[] = [
  {
    header: 'Plant Name',
    accessor: (p: CCUSItem | ProductionItem | StorageItem) =>
      ('name' in p ? p.name : p.project_name) ?? 'Unknown Feature',
  },
  {
    header: 'Type',
    accessor: (p: CCUSItem | ProductionItem | StorageItem) => p.type,
  },
  {
    header: 'End Use Sector',
    accessor: (p: CCUSItem | ProductionItem | StorageItem) => {
      if (p.type === 'CCUS') {
        const ccus = p as CCUSItem;
        return ccus.end_use_sector?.join(', ') ?? '';
      }
      return '';
    },
  },
  {
    header: 'Status',
    accessor: (p: CCUSItem | ProductionItem | StorageItem) =>
      ('project_status' in p ? p.project_status : '') ?? '',
  },
  {
    header: 'Country',
    accessor: (p: CCUSItem | ProductionItem | StorageItem) => p.country ?? '',
  },
  {
    header: 'Technology Fate',
    accessor: (p: CCUSItem | ProductionItem | StorageItem) =>
      ('technology_fate' in p ? p.technology_fate : '') ?? '',
  },
  {
    header: 'Capture Capacity (MtCO2)',
    accessor: (p: CCUSItem | ProductionItem | StorageItem) =>
      'capacity_value' in p ? (p.capacity_value !== null ? p.capacity_value : undefined) : undefined,
  },
  {
    header: 'Operation Date',
    accessor: (p: CCUSItem | ProductionItem | StorageItem) =>
      ('operation_date' in p ? p.operation_date : '') ?? '',
  },
  {
    header: 'Data Verification',
    accessor: (p: CCUSItem | ProductionItem | StorageItem) => undefined,
  },
];