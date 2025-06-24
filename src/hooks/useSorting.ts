
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

  // Função de tie-breaker mais robusta
  const getTieBreaker = (obj: any): string => {
    // Prioridade: account > id > account_number > qualquer identificador único
    const identifiers = [
      obj.account,
      obj.id, 
      obj.account_number,
      obj.accountNumber,
      obj.name,
      obj.ticket,
      obj.vps,
      obj.server
    ];
    
    for (const identifier of identifiers) {
      if (identifier && typeof identifier === 'string' && identifier.trim() !== '') {
        return identifier.toString();
      }
      if (identifier && typeof identifier === 'number') {
        return identifier.toString();
      }
    }
    
    // Fallback final - usar índice baseado no JSON stringificado
    return JSON.stringify(obj).substring(0, 50);
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
      // Mesmo sem ordenação, aplicar tie-breaker para estabilidade
      return [...dataToUse].sort((a, b) => {
        const aTieBreaker = getTieBreaker(a);
        const bTieBreaker = getTieBreaker(b);
        return aTieBreaker.localeCompare(bTieBreaker);
      });
    }

    const result = [...dataToUse].sort((a, b) => {
      let comparison = 0;
      
      if (customSortFunctions && customSortFunctions[currentSortConfig.key]) {
        comparison = customSortFunctions[currentSortConfig.key](a, b);
      } else {
        const aValue = getNestedValue(a, currentSortConfig.key);
        const bValue = getNestedValue(b, currentSortConfig.key);

        // Comparação numérica para números
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        }
        // Comparação de strings
        else if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue);
        }
        // Comparação mista - números sempre vêm antes de strings
        else if (typeof aValue === 'number' && typeof bValue === 'string') {
          comparison = -1;
        }
        else if (typeof aValue === 'string' && typeof bValue === 'number') {
          comparison = 1;
        }
        // Comparação para valores undefined/null
        else {
          const aStr = String(aValue || '');
          const bStr = String(bValue || '');
          comparison = aStr.localeCompare(bStr);
        }
      }

      // Se há empate na ordenação principal, aplicar tie-breaker SEMPRE
      if (comparison === 0) {
        const aTieBreaker = getTieBreaker(a);
        const bTieBreaker = getTieBreaker(b);
        comparison = aTieBreaker.localeCompare(bTieBreaker);
      }
      
      return currentSortConfig.direction === 'asc' ? comparison : -comparison;
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
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
  
  return result;
};
