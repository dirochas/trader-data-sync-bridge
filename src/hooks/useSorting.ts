
import { useState, useMemo, useRef, useEffect } from 'react';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

export const useSorting = <T>(data: T[], initialSort?: SortConfig, customSortFunctions?: Record<string, (a: T, b: T) => number>) => {
  const sortConfigRef = useRef<SortConfig | null>(initialSort || null);
  const [sortConfig, setSortConfigState] = useState<SortConfig | null>(initialSort || null);
  
  // Cache inteligente para manter dados estáveis
  const stableDataCache = useRef<T[]>([]);
  const lastValidDataRef = useRef<T[]>([]);

  const setSortConfig = (newConfig: SortConfig | null) => {
    sortConfigRef.current = newConfig;
    setSortConfigState(newConfig);
  };

  useEffect(() => {
    sortConfigRef.current = sortConfig;
  }, [sortConfig]);

  // Função para validar se os dados são confiáveis
  const isDataReliable = (currentData: T[], previousData: T[]) => {
    if (currentData.length === 0) return false;
    if (previousData.length === 0) return true; // Primeira carga sempre aceita
    if (currentData.length !== previousData.length) return true; // Mudança no número de contas

    // Verifica se muitos campos críticos foram zerados simultaneamente
    let suspiciousZeros = 0;
    let totalComparisons = 0;

    currentData.forEach((current, index) => {
      const previous = previousData[index];
      if (previous) {
        const currentObj = current as any;
        const previousObj = previous as any;
        
        // Campos críticos que não devem zerar simultaneamente
        const criticalFields = ['openTrades', 'openPnL', 'balance', 'equity'];
        
        criticalFields.forEach(field => {
          if (currentObj[field] !== undefined && previousObj[field] !== undefined) {
            totalComparisons++;
            // Se campo anterior tinha valor e agora é zero, marca como suspeito
            if (previousObj[field] !== 0 && currentObj[field] === 0) {
              suspiciousZeros++;
            }
          }
        });
      }
    });

    // Se mais de 25% dos campos críticos foram zerados, considera não confiável
    const suspiciousRate = totalComparisons > 0 ? suspiciousZeros / totalComparisons : 0;
    return suspiciousRate < 0.25;
  };

  const sortedData = useMemo(() => {
    const currentSortConfig = sortConfigRef.current;
    
    // Validar se os dados atuais são confiáveis
    let dataToUse: T[];
    
    if (isDataReliable(data, lastValidDataRef.current)) {
      // Dados são confiáveis - atualizar cache
      dataToUse = data;
      stableDataCache.current = [...data];
      lastValidDataRef.current = [...data];
    } else {
      // Dados parecem temporariamente instáveis - usar cache
      dataToUse = stableDataCache.current.length > 0 ? stableDataCache.current : data;
    }
    
    if (!currentSortConfig || !currentSortConfig.key) {
      return dataToUse;
    }

    const result = [...dataToUse].sort((a, b) => {
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

      // Tie-breaker usando ID da conta para estabilidade
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
