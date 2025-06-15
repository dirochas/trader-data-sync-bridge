
import { useState, useMemo, useRef, useEffect } from 'react';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

export const useSorting = <T>(data: T[], initialSort?: SortConfig, customSortFunctions?: Record<string, (a: T, b: T) => number>) => {
  const sortConfigRef = useRef<SortConfig | null>(initialSort || null);
  const [sortConfig, setSortConfigState] = useState<SortConfig | null>(initialSort || null);
  
  // Cache dos dados anteriores para evitar oscilações
  const previousDataRef = useRef<T[]>([]);
  const stableDataRef = useRef<T[]>([]);

  const setSortConfig = (newConfig: SortConfig | null) => {
    sortConfigRef.current = newConfig;
    setSortConfigState(newConfig);
  };

  useEffect(() => {
    sortConfigRef.current = sortConfig;
  }, [sortConfig]);

  // Função para verificar se os dados são válidos (não zerados temporariamente)
  const isDataStable = (currentData: T[], previousData: T[]) => {
    if (currentData.length !== previousData.length) return true;
    
    // Verifica se há muitos valores zerados suspeitos comparado aos dados anteriores
    let zeroedFields = 0;
    let totalComparisons = 0;
    
    currentData.forEach((current, index) => {
      const previous = previousData[index];
      if (previous) {
        const currentObj = current as any;
        const previousObj = previous as any;
        
        // Verifica campos numéricos que podem ter sido zerados temporariamente
        ['openTrades', 'openPnL', 'dayProfit', 'balance', 'equity'].forEach(field => {
          if (currentObj[field] !== undefined && previousObj[field] !== undefined) {
            totalComparisons++;
            if (currentObj[field] === 0 && previousObj[field] !== 0) {
              zeroedFields++;
            }
          }
        });
      }
    });
    
    // Se mais de 30% dos campos foram zerados, considera instável
    return totalComparisons === 0 || (zeroedFields / totalComparisons) < 0.3;
  };

  const sortedData = useMemo(() => {
    const currentSortConfig = sortConfigRef.current;
    
    // Usa dados estáveis se os atuais parecem temporariamente inconsistentes
    let dataToSort = data;
    if (previousDataRef.current.length > 0 && !isDataStable(data, previousDataRef.current)) {
      dataToSort = stableDataRef.current.length > 0 ? stableDataRef.current : data;
    } else {
      // Atualiza os dados estáveis apenas quando os dados atuais são confiáveis
      stableDataRef.current = [...data];
      previousDataRef.current = [...data];
    }
    
    if (!currentSortConfig || !currentSortConfig.key) {
      return dataToSort;
    }

    const result = [...dataToSort].sort((a, b) => {
      if (customSortFunctions && customSortFunctions[currentSortConfig.key]) {
        const customResult = customSortFunctions[currentSortConfig.key](a, b);
        if (customResult !== 0) {
          return currentSortConfig.direction === 'asc' ? customResult : -customResult;
        }
      } else {
        const aValue = getNestedValue(a, currentSortConfig.key);
        const bValue = getNestedValue(b, currentSortConfig.key);

        if (aValue < bValue) {
          return currentSortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return currentSortConfig.direction === 'asc' ? 1 : -1;
        }
      }

      // Tie-breaker estável usando ID da conta
      const aId = getNestedValue(a, 'id') || getNestedValue(a, 'account_number') || '';
      const bId = getNestedValue(b, 'id') || getNestedValue(b, 'account_number') || '';
      
      return aId < bId ? -1 : aId > bId ? 1 : 0;
    });

    return result;
  }, [data, sortConfig, customSortFunctions]);

  const requestSort = (key: string) => {
    let direction: SortDirection = 'asc';
    
    if (sortConfigRef.current && sortConfigRef.current.key === key) {
      if (sortConfigRef.current.direction === 'asc') {
        direction = 'desc';
      } else if (sortConfigRef.current.direction === 'desc') {
        direction = null;
      }
    }
    
    const newConfig = direction ? { key, direction } : null;
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

const getNestedValue = (obj: any, path: string) => {
  const result = path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : '';
  }, obj);
  
  return result;
};
