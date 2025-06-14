
import { useState, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

export const useSorting = <T>(data: T[], initialSort?: SortConfig, customSortFunctions?: Record<string, (a: T, b: T) => number>) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(initialSort || null);

  const sortedData = useMemo(() => {
    if (!sortConfig || !sortConfig.key) {
      return data;
    }

    return [...data].sort((a, b) => {
      // Usar função customizada se disponível
      if (customSortFunctions && customSortFunctions[sortConfig.key]) {
        const result = customSortFunctions[sortConfig.key](a, b);
        return sortConfig.direction === 'asc' ? result : -result;
      }

      // Usar ordenação padrão
      const aValue = getNestedValue(a, sortConfig.key);
      const bValue = getNestedValue(b, sortConfig.key);

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig, customSortFunctions]);

  const requestSort = (key: string) => {
    let direction: SortDirection = 'asc';
    
    if (sortConfig && sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc';
      } else if (sortConfig.direction === 'desc') {
        direction = null;
      }
    }
    
    setSortConfig(direction ? { key, direction } : null);
  };

  const getSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return '↕️';
    }
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  return {
    sortedData,
    requestSort,
    getSortIcon,
    sortConfig,
  };
};

// Helper function to get nested object values
const getNestedValue = (obj: any, path: string) => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : '';
  }, obj);
};
