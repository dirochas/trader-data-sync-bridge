
import { useState, useMemo, useRef, useEffect } from 'react';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

export const useSorting = <T>(data: T[], initialSort?: SortConfig, customSortFunctions?: Record<string, (a: T, b: T) => number>) => {
  // Usar useRef para manter o estado de ordenação persistente
  const sortConfigRef = useRef<SortConfig | null>(initialSort || null);
  const [sortConfig, setSortConfigState] = useState<SortConfig | null>(initialSort || null);

  // Função para atualizar o estado de ordenação
  const setSortConfig = (newConfig: SortConfig | null) => {
    console.log('🔄 setSortConfig called with:', newConfig);
    sortConfigRef.current = newConfig;
    setSortConfigState(newConfig);
  };

  // Manter a referência sincronizada com o estado
  useEffect(() => {
    sortConfigRef.current = sortConfig;
  }, [sortConfig]);

  const sortedData = useMemo(() => {
    const currentSortConfig = sortConfigRef.current;
    
    if (!currentSortConfig || !currentSortConfig.key) {
      return data;
    }

    const result = [...data].sort((a, b) => {
      // Usar função customizada se disponível
      if (customSortFunctions && customSortFunctions[currentSortConfig.key]) {
        const result = customSortFunctions[currentSortConfig.key](a, b);
        return currentSortConfig.direction === 'asc' ? result : -result;
      }

      // Usar ordenação padrão
      const aValue = getNestedValue(a, currentSortConfig.key);
      const bValue = getNestedValue(b, currentSortConfig.key);

      if (aValue < bValue) {
        return currentSortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return currentSortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return result;
  }, [data, sortConfig, customSortFunctions]);

  const requestSort = (key: string) => {
    console.log('🎯 requestSort called for key:', key);
    
    let direction: SortDirection = 'asc';
    
    if (sortConfigRef.current && sortConfigRef.current.key === key) {
      if (sortConfigRef.current.direction === 'asc') {
        direction = 'desc';
      } else if (sortConfigRef.current.direction === 'desc') {
        direction = null;
      }
    }
    
    const newConfig = direction ? { key, direction } : null;
    console.log('💫 Setting new config:', newConfig);
    setSortConfig(newConfig);
  };

  const getSortIcon = (columnKey: string) => {
    if (!sortConfigRef.current || sortConfigRef.current.key !== columnKey) {
      return '↕️';
    }
    return sortConfigRef.current.direction === 'asc' ? '↑' : '↓';
  };

  return {
    sortedData,
    requestSort,
    getSortIcon,
    sortConfig: sortConfigRef.current,
  };
};

// Helper function to get nested object values
const getNestedValue = (obj: any, path: string) => {
  const result = path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : '';
  }, obj);
  
  return result;
};
