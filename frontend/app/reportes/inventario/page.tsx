'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import BovedaReportMetrics from '@/components/reportes/inventario/BovedaReportMetrics';
import BovedaReportTable from '@/components/reportes/inventario/BovedaReportTable';
import BovedaReportDetailTable from '@/components/reportes/inventario/BovedaReportDetailTable';
import ReportHeader from '@/components/reportes/ReportHeader';
import ReportGuideCard from '@/components/reportes/ReportGuideCard';
import { useProcesses } from '@/hooks/useProcesses';
import { useBars } from '@/hooks/useBars';
import { useClients } from '@/hooks/useClients';
import { useMaterialExits } from '@/hooks/useExits';
import {
  generateBovedaReportPDF,
  type BovedaLotData,
  type BovedaBarData,
  type BovedaReportType,
} from '@/lib/generateBovedaReportPDF';
import { generateBovedaReportExcel } from '@/lib/generateBovedaReportExcel';
import { RefreshCw } from 'lucide-react';
import type { Lot, Process } from '@/types/api';

interface BovedaLot extends Lot {
  process: Process & { client?: { id: string; name: string } };
  client?: { id: string; name: string };
}

export default function BovedaReportPage() {
  const [clienteId, setClienteId] = useState('');
  const [reportType, setReportType] = useState<BovedaReportType>('RESUMEN');
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const { data: processes = [] } = useProcesses();
  const { data: allBars = [] } = useBars();
  const { data: clients = [] } = useClients({ role: 'PROVEEDOR' });
  const { data: exits = [] } = useMaterialExits();

  const [appliedClienteName, setAppliedClienteName] = useState('Todos los Proveedores');
  const [appliedReportType, setAppliedReportType] = useState<BovedaReportType>('RESUMEN');
  const [appliedFechaDesde, setAppliedFechaDesde] = useState('');
  const [appliedFechaHasta, setAppliedFechaHasta] = useState('');

  const reportId = '#REP-INV-BANDES-2026-08';
  const generatedAt = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const clienteName = clients.find((c) => c.id === clienteId)?.name || 'Todos los Proveedores';

  const formatDate = (d: string) => {
    if (!d) return '—';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };

  const dispatchedLotIds = useMemo(
    () =>
      new Set(
        exits.flatMap((e) =>
          (e.exitDetails ?? []).map((d) => d.lotId).filter(Boolean),
        ),
      ),
    [exits],
  );

  const bovedaLots = useMemo(() => {
    return processes
      .filter((p) => p.status === 'CLOSED')
      .flatMap((p) =>
        (p.lots ?? [])
          .filter((l) => l.recovered != null && !dispatchedLotIds.has(l.id))
          .map((l) => ({ ...l, process: p, client: p.client })),
      )
      .filter((l) => {
        if (clienteId) return l.client?.id === clienteId;
        return true;
      })
      .filter((l) => {
        if (fechaDesde) {
          const lotDate = new Date(l.createdAt);
          const desde = new Date(fechaDesde);
          if (lotDate < desde) return false;
        }
        if (fechaHasta) {
          const lotDate = new Date(l.createdAt);
          const hasta = new Date(fechaHasta);
          hasta.setHours(23, 59, 59, 999);
          if (lotDate > hasta) return false;
        }
        return true;
      });
  }, [processes, clienteId, fechaDesde, fechaHasta, dispatchedLotIds]);

  const standaloneBars = useMemo(() => {
    return allBars.filter(
      (b) => b.status === 'IN_STOCK' && !b.lotId && !b.exitId && !b.exitDetailId,
    );
  }, [allBars]);

  const filteredStandaloneBars = useMemo(() => {
    let result = standaloneBars;
    if (clienteId) {
      result = result.filter((b) => b.clientId === clienteId);
    }
    if (fechaDesde) {
      const desde = new Date(fechaDesde);
      result = result.filter((b) => new Date(b.createdAt) >= desde);
    }
    if (fechaHasta) {
      const hasta = new Date(fechaHasta);
      hasta.setHours(23, 59, 59, 999);
      result = result.filter((b) => new Date(b.createdAt) <= hasta);
    }
    return result;
  }, [standaloneBars, clienteId, fechaDesde, fechaHasta]);

  const summary = useMemo(() => {
    const providerMap = new Map<string, {
      name: string;
      refundidasCount: number;
      sinRefundirCount: number;
      brutoRefundido: number;
      brutoSinRefundir: number;
      brutoTotal: number;
    }>();

    const ensure = (name: string) => {
      if (!providerMap.has(name)) {
        providerMap.set(name, {
          name, refundidasCount: 0, sinRefundirCount: 0,
          brutoRefundido: 0, brutoSinRefundir: 0, brutoTotal: 0,
        });
      }
      return providerMap.get(name)!;
    };

    for (const lot of bovedaLots) {
      const providerName = lot.client?.name ?? lot.process?.client?.name ?? 'DESCONOCIDO';
      const s = ensure(providerName);
      s.refundidasCount++;
      s.brutoRefundido += Number(lot.recovered ?? 0);
    }

    for (const bar of filteredStandaloneBars) {
      const providerName = bar.client?.name ?? 'DESCONOCIDO';
      const s = ensure(providerName);
      s.sinRefundirCount++;
      s.brutoSinRefundir += Number(bar.grossWeight ?? 0);
    }

    for (const s of providerMap.values()) {
      s.brutoTotal = s.brutoRefundido + s.brutoSinRefundir;
    }

    const providers = Array.from(providerMap.values()).sort((a, b) => b.brutoTotal - a.brutoTotal);
    const totalLotes = providers.reduce((a, s) => a + s.refundidasCount, 0);
    const totalBarrasSueltas = providers.reduce((a, s) => a + s.sinRefundirCount, 0);
    const brutoRefundido = providers.reduce((a, s) => a + s.brutoRefundido, 0);
    const brutoSinRefundir = providers.reduce((a, s) => a + s.brutoSinRefundir, 0);

    return {
      totalLotes,
      totalBarrasSueltas,
      totalBarras: totalLotes + totalBarrasSueltas,
      brutoRefundido,
      brutoSinRefundir,
      brutoTotal: brutoRefundido + brutoSinRefundir,
      providers,
    };
  }, [bovedaLots, filteredStandaloneBars]);

  const handleGenerate = useCallback(() => {
    setAppliedClienteName(clienteName);
    setAppliedReportType(reportType);
    setAppliedFechaDesde(fechaDesde);
    setAppliedFechaHasta(fechaHasta);
    setHasGenerated(true);
  }, [clienteName, reportType, fechaDesde, fechaHasta]);

  const bovedaReportData = useMemo(() => {
    const mappedLots: BovedaLotData[] = bovedaLots.map((l) => ({
      id: l.id,
      name: l.name,
      processName: l.process?.name ?? '—',
      clientName: l.client?.name ?? l.process?.client?.name ?? 'Desconocido',
      recovered: Number(l.recovered ?? 0),
      grossWeight: Number(l.fineWeight ?? 0),
      purity: Number(l.purity ?? 0),
      bars: allBars
        .filter((b) => b.lotId === l.id && !b.exitId && !b.exitDetailId)
        .map((b) => ({
          barNumber: b.barNumber,
          grossWeight: Number(b.grossWeight ?? 0),
          purity: Number(b.purity ?? 0),
          clientId: b.clientId,
          clientName: b.client?.name ?? clients.find((c) => c.id === b.clientId)?.name ?? 'DESCONOCIDO',
        })),
    }));

    const mappedBars: BovedaBarData[] = filteredStandaloneBars.map((b) => ({
      barNumber: b.barNumber,
      grossWeight: Number(b.grossWeight ?? 0),
      purity: Number(b.purity ?? 0),
      fineWeight: Number(b.fineWeight ?? 0),
      clientName: b.client?.name ?? clients.find((c) => c.id === b.clientId)?.name ?? 'DESCONOCIDO',
    }));

    return {
      lots: mappedLots,
      bars: mappedBars,
      totalRecovered: bovedaLots.reduce((s, l) => s + Number(l.recovered ?? 0), 0),
      totalGrossWeight: filteredStandaloneBars.reduce((s, b) => s + Number(b.grossWeight ?? 0), 0),
      totalFineWeight: filteredStandaloneBars.reduce((s, b) => s + Number(b.fineWeight ?? 0), 0),
      generatedAt,
    };
  }, [bovedaLots, filteredStandaloneBars, allBars, clients, generatedAt]);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      generateBovedaReportPDF(bovedaReportData, appliedReportType);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      await generateBovedaReportExcel({
        data: bovedaReportData,
        reportId,
        generatedAt,
        reportType: appliedReportType,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const subtitle =
    `Filtro aplicado: ${appliedClienteName} | ` +
    `Período: ${formatDate(appliedFechaDesde)} al ${formatDate(appliedFechaHasta)}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-5"
    >
      {/* Filtros */}
      <div
        className="rounded-lg p-4 flex flex-wrap items-end gap-4"
        style={{
          backgroundColor: 'var(--report-bg-card)',
          border: '1px solid var(--report-border-color)',
        }}
      >
        <div className="flex-1 min-w-[200px]">
          <label
            className="block text-[11px] font-bold uppercase tracking-wider mb-1"
            style={{ color: 'var(--report-text-muted)' }}
          >
            Proveedor
          </label>
          <select
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
            className="w-full rounded-md px-3 py-2 text-[12px] border"
            style={{
              backgroundColor: 'var(--report-input-bg)',
              color: 'var(--report-text-main)',
              borderColor: 'var(--report-border-color)',
            }}
          >
            <option value="">Todos los Proveedores</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[160px]">
          <label
            className="block text-[11px] font-bold uppercase tracking-wider mb-1"
            style={{ color: 'var(--report-text-muted)' }}
          >
            Tipo de Reporte
          </label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as BovedaReportType)}
            className="w-full rounded-md px-3 py-2 text-[12px] border"
            style={{
              backgroundColor: 'var(--report-input-bg)',
              color: 'var(--report-text-main)',
              borderColor: 'var(--report-border-color)',
            }}
          >
            <option value="RESUMEN">Resumen</option>
            <option value="DETALLADO">Detallado</option>
          </select>
        </div>

        <div className="flex-1 min-w-[150px]">
          <label
            className="block text-[11px] font-bold uppercase tracking-wider mb-1"
            style={{ color: 'var(--report-text-muted)' }}
          >
            Fecha Desde
          </label>
          <input
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            className="w-full rounded-md px-3 py-2 text-[12px] border [color-scheme:dark]"
            style={{
              backgroundColor: 'var(--report-input-bg)',
              color: 'var(--report-text-main)',
              borderColor: 'var(--report-border-color)',
            }}
          />
        </div>

        <div className="flex-1 min-w-[150px]">
          <label
            className="block text-[11px] font-bold uppercase tracking-wider mb-1"
            style={{ color: 'var(--report-text-muted)' }}
          >
            Fecha Hasta
          </label>
          <input
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            className="w-full rounded-md px-3 py-2 text-[12px] border [color-scheme:dark]"
            style={{
              backgroundColor: 'var(--report-input-bg)',
              color: 'var(--report-text-main)',
              borderColor: 'var(--report-border-color)',
            }}
          />
        </div>

        <button
          onClick={handleGenerate}
          className="flex items-center gap-2 rounded-md px-4 py-2 text-[12px] font-bold text-white transition-all"
          style={{ backgroundColor: 'var(--report-color-primary)' }}
        >
          <RefreshCw size={14} />
          Generar
        </button>
      </div>

      {/* Empty State */}
      {!hasGenerated && <ReportGuideCard entity="proveedor" />}

      {/* Reporte */}
      {hasGenerated && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-lg p-6"
          style={{
            backgroundColor: 'var(--report-bg-card)',
            border: '1px solid var(--report-border-color)',
          }}
        >
          <ReportHeader
            title="REPORTE DE INVENTARIO EN BÓVEDA"
            subtitle={subtitle}
            reportId={reportId}
            generatedAt={generatedAt}
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportExcel}
            isExporting={isExporting}
          />

          <BovedaReportMetrics summary={summary} />

          <div className="mt-6">
            {appliedReportType === 'RESUMEN' ? (
              <BovedaReportTable providers={summary.providers} summary={summary} />
            ) : (
              <BovedaReportDetailTable lots={bovedaReportData.lots} bars={bovedaReportData.bars} />
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}