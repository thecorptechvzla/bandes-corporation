import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Supplier, GoldBar, CastingLot, Transaction } from '../types';
import { INITIAL_SUPPLIERS, INITIAL_GOLD_BARS, INITIAL_LOTS, INITIAL_TRANSACTIONS } from './gold-initial-data';

interface GoldTraceabilityContextType {
  suppliers: Supplier[];
  goldBars: GoldBar[];
  castingLots: CastingLot[];
  transactions: Transaction[];
  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  addGoldBar: (bar: Omit<GoldBar, 'analytical' | 'expected' | 'analyticalAg' | 'status' | 'available' | 'processId' | 'egresadoG' | 'egresoId' | 'createdAt' | 'recovered'>) => { success: boolean; error?: string };
  addGoldBarsBulk: (bars: Omit<GoldBar, 'analytical' | 'expected' | 'analyticalAg' | 'status' | 'available' | 'processId' | 'egresadoG' | 'egresoId' | 'createdAt' | 'recovered'>[]) => { success: boolean; addedCount: number; error?: string };
  deleteGoldBar: (code: string) => void;
  createCastingLot: (barCodes: string[], moldCode: string, operator: string) => { success: boolean; lotId?: string; error?: string };
  completeCastingLot: (lotId: string, recoveredWeight: number) => { success: boolean; error?: string };
  createEgreso: (clientId: string, selectedLotIds: string[], reference: string, customWeights?: Record<string, number>) => { success: boolean; error?: string };
  resetData: () => void;
}

const GoldTraceabilityContext = createContext<GoldTraceabilityContextType | undefined>(undefined);

export const GoldTraceabilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    if (typeof window === 'undefined') return INITIAL_SUPPLIERS;
    const version = localStorage.getItem('bandes_version_v4');
    if (version !== 'v4') {
      localStorage.setItem('bandes_version_v4', 'v4');
      localStorage.setItem('bandes_suppliers', JSON.stringify(INITIAL_SUPPLIERS));
      localStorage.setItem('bandes_gold_bars', JSON.stringify(INITIAL_GOLD_BARS));
      localStorage.setItem('bandes_casting_lots', JSON.stringify(INITIAL_LOTS));
      localStorage.setItem('bandes_transactions', JSON.stringify(INITIAL_TRANSACTIONS));
      return INITIAL_SUPPLIERS;
    }
    const saved = localStorage.getItem('bandes_suppliers');
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIERS;
  });

  const [goldBars, setGoldBars] = useState<GoldBar[]>(() => {
    if (typeof window === 'undefined') return INITIAL_GOLD_BARS;
    const saved = localStorage.getItem('bandes_gold_bars');
    return saved ? JSON.parse(saved) : INITIAL_GOLD_BARS;
  });

  const [castingLots, setCastingLots] = useState<CastingLot[]>(() => {
    if (typeof window === 'undefined') return INITIAL_LOTS;
    const saved = localStorage.getItem('bandes_casting_lots');
    return saved ? JSON.parse(saved) : INITIAL_LOTS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    if (typeof window === 'undefined') return INITIAL_TRANSACTIONS;
    const saved = localStorage.getItem('bandes_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const persistTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const persist = useCallback(() => {
    if (typeof window === 'undefined') return;
    clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      try {
        localStorage.setItem('bandes_suppliers', JSON.stringify(suppliers));
        localStorage.setItem('bandes_gold_bars', JSON.stringify(goldBars));
        localStorage.setItem('bandes_casting_lots', JSON.stringify(castingLots));
        localStorage.setItem('bandes_transactions', JSON.stringify(transactions));
      } catch {
        // localStorage quota exceeded or unavailable — silently skip
      }
    }, 300);
  }, [suppliers, goldBars, castingLots, transactions]);

  useEffect(() => {
    persist();
    return () => clearTimeout(persistTimer.current);
  }, [persist]);

  const addSupplier = (supplierData: Omit<Supplier, 'id'>) => {
    const newId = `SUP-${String(suppliers.length + 1).padStart(2, '0')}`;
    const newSupplier: Supplier = {
      ...supplierData,
      id: newId,
    };
    setSuppliers((prev) => [...prev, newSupplier]);
  };

  const addGoldBar = (barData: Omit<GoldBar, 'analytical' | 'expected' | 'analyticalAg' | 'status' | 'available' | 'processId' | 'egresadoG' | 'egresoId' | 'createdAt' | 'recovered'>) => {
    // Check if code is unique (case insensitive)
    const upperCode = barData.code.toUpperCase();
    if (goldBars.some((b) => b.code.toUpperCase() === upperCode)) {
      return { success: false, error: `El código de barra "${upperCode}" ya existe.` };
    }

    const FA = barData.grossWeight * (barData.ley / 1000);
    const FE = FA * 0.99;
    const FinoAg = barData.grossWeight * ((barData.leyAg || 0) / 1000);

    const newBar: GoldBar = {
      ...barData,
      code: upperCode,
      analytical: Number(FA.toFixed(2)),
      expected: Number(FE.toFixed(2)),
      analyticalAg: Number(FinoAg.toFixed(2)),
      recovered: null,
      available: true,
      status: 'INGRESADO',
      processId: null,
      egresadoG: 0,
      egresoId: null,
      createdAt: new Date().toISOString(),
    };

    setGoldBars((prev) => [newBar, ...prev]);

    // Automatically record an IN transaction for this ingot
    const supplier = suppliers.find((s) => s.id === barData.supplierId);
    const newTx: Transaction = {
      id: `TX-${Date.now()}`,
      type: 'IN',
      clientName: supplier ? supplier.name : 'Client Desconocido',
      clientId: barData.supplierId,
      weight: barData.grossWeight,
      barsCount: 1,
      barCodes: [upperCode],
      date: new Date().toISOString(),
      reference: `AUT-IN-${upperCode.split('-').pop() || 'TX'}`,
      status: 'CONFIRMADO',
    };

    setTransactions((prev) => [newTx, ...prev]);

    return { success: true };
  };

  const addGoldBarsBulk = (barsData: Omit<GoldBar, 'analytical' | 'expected' | 'analyticalAg' | 'status' | 'available' | 'processId' | 'egresadoG' | 'egresoId' | 'createdAt' | 'recovered'>[]) => {
    const added: GoldBar[] = [];
    const duplicates: string[] = [];

    // Filter duplicates first
    barsData.forEach((barData) => {
      const upperCode = barData.code.toUpperCase();
      if (
        goldBars.some((b) => b.code.toUpperCase() === upperCode) ||
        added.some((b) => b.code === upperCode)
      ) {
        duplicates.push(upperCode);
      } else {
        const FA = barData.grossWeight * (barData.ley / 1000);
        const FE = FA * 0.99;
        const FinoAg = barData.grossWeight * ((barData.leyAg || 0) / 1000);

        added.push({
          ...barData,
          code: upperCode,
          analytical: Number(FA.toFixed(2)),
          expected: Number(FE.toFixed(2)),
          analyticalAg: Number(FinoAg.toFixed(2)),
          recovered: null,
          available: true,
          status: 'INGRESADO',
          processId: null,
          egresadoG: 0,
          egresoId: null,
          createdAt: new Date().toISOString(),
        });
      }
    });

    if (added.length === 0) {
      return { success: false, addedCount: 0, error: 'Todos los códigos de barra del lote ya existen o están duplicados.' };
    }

    setGoldBars((prev) => [...added, ...prev]);

    // Create a aggregated IN transaction for this bulk load grouped by supplier
    const supplierId = added[0].supplierId;
    const supplier = suppliers.find((s) => s.id === supplierId);
    const totalWeight = added.reduce((sum, b) => sum + b.grossWeight, 0);

    const bulkTx: Transaction = {
      id: `TX-${Date.now()}`,
      type: 'IN',
      clientName: supplier ? supplier.name : 'Cliente Desconocido',
      clientId: supplierId,
      weight: Number(totalWeight.toFixed(2)),
      barsCount: added.length,
      barCodes: added.map((b) => b.code),
      date: new Date().toISOString(),
      reference: `BULK-IN-${added.length}`,
      status: 'CONFIRMADO',
    };

    setTransactions((prev) => [bulkTx, ...prev]);

    return {
      success: true,
      addedCount: added.length,
      error: duplicates.length > 0 ? `Se saltaron ${duplicates.length} códigos duplicados: ${duplicates.join(', ')}` : undefined,
    };
  };

  const deleteGoldBar = (code: string) => {
    setGoldBars((prev) => prev.filter((b) => b.code !== code));
    // Also remove any references in casting lots
    setCastingLots((prev) =>
      prev.map((lot) => {
        if (lot.barCodes.includes(code)) {
          const updatedBars = lot.barCodes.filter((c) => c !== code);
          // Recalculate totals
          const remainingBarsData = goldBars.filter((b) => updatedBars.includes(b.code));
          const grossWeightTotal = remainingBarsData.reduce((sum, b) => sum + b.grossWeight, 0);
          const analyticalTotal = remainingBarsData.reduce((sum, b) => sum + b.analytical, 0);
          const expectedTotal = remainingBarsData.reduce((sum, b) => sum + b.expected, 0);
          return {
            ...lot,
            barCodes: updatedBars,
            grossWeightTotal,
            analyticalTotal,
            expectedTotal,
          };
        }
        return lot;
      })
    );
  };

  const createCastingLot = (barCodes: string[], moldCode: string, operator: string) => {
    if (barCodes.length === 0) {
      return { success: false, error: 'Debe seleccionar al menos una barra de oro.' };
    }

    // Check if all selected bars are available
    const selectedBars = goldBars.filter((b) => barCodes.includes(b.code));
    const unavailableBars = selectedBars.filter((b) => !b.available);
    if (unavailableBars.length > 0) {
      return {
        success: false,
        error: `Las siguientes barras ya no están disponibles: ${unavailableBars.map((b) => b.code).join(', ')}`,
      };
    }

    const lotId = `LOT-${Date.now()}`;
    const lotCode = `LOTE-${moldCode.toUpperCase()}-${String(castingLots.length + 101)}`;

    const grossWeightTotal = selectedBars.reduce((sum, b) => sum + b.grossWeight, 0);
    const analyticalTotal = selectedBars.reduce((sum, b) => sum + b.analytical, 0);
    const expectedTotal = selectedBars.reduce((sum, b) => sum + b.expected, 0);

    const newLot: CastingLot = {
      id: lotId,
      code: lotCode,
      barCodes,
      createdAt: new Date().toISOString(),
      status: 'FUNDICION',
      grossWeightTotal: Number(grossWeightTotal.toFixed(2)),
      analyticalTotal: Number(analyticalTotal.toFixed(2)),
      expectedTotal: Number(expectedTotal.toFixed(2)),
      recovered: null,
      operator,
      castingTemp: 1064 + Math.floor(Math.random() * 40), // around melting point of gold 1064 Celsius
      moldCode: moldCode.toUpperCase(),
    };

    // Update gold bars status to 'PROCESANDO' and set available = false, processId = lotId
    setGoldBars((prev) =>
      prev.map((b) => {
        if (barCodes.includes(b.code)) {
          return {
            ...b,
            available: false,
            status: 'PROCESANDO',
            processId: lotId,
          };
        }
        return b;
      })
    );

    setCastingLots((prev) => [newLot, ...prev]);

    return { success: true, lotId };
  };

  const completeCastingLot = (lotId: string, recoveredWeight: number) => {
    const lot = castingLots.find((l) => l.id === lotId);
    if (!lot) {
      return { success: false, error: 'No se encontró el lote de fundición.' };
    }

    // Update lot status and recovered weight
    setCastingLots((prev) =>
      prev.map((l) => {
        if (l.id === lotId) {
          return {
            ...l,
            status: 'COMPLETADO',
            recovered: recoveredWeight,
          };
        }
        return l;
      })
    );

    // Distribute the recovered weight proportionally to each bar of this lot (for traceability reports)
    // Formula: bar's proportion of FA * recoveredWeight
    const barsInLot = goldBars.filter((b) => lot.barCodes.includes(b.code));
    const totalAnalytical = lot.analyticalTotal || 1;

    setGoldBars((prev) =>
      prev.map((b) => {
        if (lot.barCodes.includes(b.code)) {
          const proportion = b.analytical / totalAnalytical;
          const barRecovered = proportion * recoveredWeight;

          return {
            ...b,
            status: 'COMPLETADO',
            recovered: Number(barRecovered.toFixed(2)),
          };
        }
        return b;
      })
    );

    return { success: true };
  };

  const createEgreso = (clientId: string, selectedLotIds: string[], reference: string, customWeights?: Record<string, number>) => {
    if (selectedLotIds.length === 0) {
      return { success: false, error: 'Debe seleccionar al menos un lote para egresar.' };
    }

    const client = suppliers.find((s) => s.id === clientId);
    if (!client) {
      return { success: false, error: 'Cliente no válido.' };
    }

    // Generate a unique egreso ID for this transaction session to avoid collisions
    const uniqueTxId = `TX-OUT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Find all bars linked to these completed lots that are ready for egress (recovered != null, and egresadoG < recovered)
    const lotsToEgress = castingLots.filter((l) => selectedLotIds.includes(l.id));
    const lotCodes = lotsToEgress.map((l) => l.code);

    let totalEgressedWeight = 0;
    const affectedBarCodes: string[] = [];

    // Update gold bars: set status to 'EGRESADO', update egresadoG and egresoId
    setGoldBars((prev) =>
      prev.map((b) => {
        if (b.processId && selectedLotIds.includes(b.processId) && b.status === 'COMPLETADO') {
          const recoveredVal = b.recovered || 0;
          const remainingToEgress = recoveredVal - b.egresadoG;

          // If customWeight is passed for this specific bar or we default to the entire remaining recovered weight
          // (Since egreso is usually "todo o nada", but we support custom weights)
          const weightToEgress = customWeights && customWeights[b.code] !== undefined
            ? Math.min(customWeights[b.code], remainingToEgress)
            : remainingToEgress;

          if (weightToEgress > 0) {
            totalEgressedWeight += weightToEgress;
            affectedBarCodes.push(b.code);

            const newEgresadoG = b.egresadoG + weightToEgress;
            const isFullyEgressed = Math.abs(newEgresadoG - recoveredVal) < 0.1 || newEgresadoG >= recoveredVal;

            return {
              ...b,
              egresadoG: Number(newEgresadoG.toFixed(2)),
              status: isFullyEgressed ? 'EGRESADO' : 'COMPLETADO',
              egresoId: uniqueTxId,
            } as GoldBar;
          }
        }
        return b;
      })
    );

    // Create a new OUT transaction
    const newTx: Transaction = {
      id: uniqueTxId,
      type: 'OUT',
      clientName: client.name,
      clientId: client.id,
      weight: Number(totalEgressedWeight.toFixed(2)),
      barsCount: affectedBarCodes.length,
      barCodes: affectedBarCodes,
      lotIds: selectedLotIds,
      date: new Date().toISOString(),
      reference,
      status: 'CONFIRMADO',
    };

    setTransactions((prev) => [newTx, ...prev]);

    return { success: true };
  };

  const resetData = () => {
    setSuppliers(INITIAL_SUPPLIERS);
    setGoldBars(INITIAL_GOLD_BARS);
    setCastingLots(INITIAL_LOTS);
    setTransactions(INITIAL_TRANSACTIONS);
    localStorage.removeItem('bandes_suppliers');
    localStorage.removeItem('bandes_gold_bars');
    localStorage.removeItem('bandes_casting_lots');
    localStorage.removeItem('bandes_transactions');
  };

  return (
    <GoldTraceabilityContext.Provider
      value={{
        suppliers,
        goldBars,
        castingLots,
        transactions,
        addSupplier,
        addGoldBar,
        addGoldBarsBulk,
        deleteGoldBar,
        createCastingLot,
        completeCastingLot,
        createEgreso,
        resetData,
      }}
    >
      {children}
    </GoldTraceabilityContext.Provider>
  );
};

export const useGoldTraceability = () => {
  const context = useContext(GoldTraceabilityContext);
  if (!context) {
    throw new Error('useGoldTraceability must be used within a GoldTraceabilityProvider');
  }
  return context;
};
