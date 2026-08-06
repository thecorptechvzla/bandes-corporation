'use client';

import type { ProcesoSummary } from './types';
import { formatNumber } from '@/lib/format';

interface ProcesosReportMetricsProps {
  summary: ProcesoSummary;
}

export default function ProcesosReportMetrics({ summary }: ProcesosReportMetricsProps) {
  return (
    <div className="flex gap-4 flex-wrap">
      <div
        className="flex-1 min-w-[220px] rounded-lg p-5 border"
        style={{
          background: 'var(--report-color-primary-bg-gradient)',
          borderColor: 'var(--report-color-primary)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }}
      >
        <div
          className="text-[11px] font-bold uppercase tracking-wider mb-2"
          style={{ color: 'var(--report-color-primary-light)' }}
        >
          TOTAL PROCESOS
        </div>
        <div className="text-[18px] font-bold text-white">
          {summary.totalProcesos} Procesos
        </div>
        <div
          className="text-[11px] mt-1"
          style={{ color: '#85e8c5' }}
        >
          Activos y Completados
        </div>
      </div>

      <div
        className="flex-1 min-w-[220px] rounded-lg p-5 border"
        style={{
          background: 'var(--report-color-primary-bg-gradient)',
          borderColor: 'var(--report-color-primary)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }}
      >
        <div
          className="text-[11px] font-bold uppercase tracking-wider mb-2"
          style={{ color: 'var(--report-color-primary-light)' }}
        >
          TOTAL BARRAS EN PROCESO
        </div>
        <div className="text-[18px] font-bold text-white">
          {summary.totalBarras} Barras
        </div>
        <div
          className="text-[11px] mt-1"
          style={{ color: '#85e8c5' }}
        >
          Ingresadas a procesamiento
        </div>
      </div>

      <div
        className="flex-1 min-w-[220px] rounded-lg p-5 border"
        style={{
          background: 'var(--report-color-primary-bg-gradient)',
          borderColor: 'var(--report-color-primary)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }}
      >
        <div
          className="text-[11px] font-bold uppercase tracking-wider mb-2"
          style={{ color: 'var(--report-color-primary-light)' }}
        >
          PESO RESULTANTE TOTAL
        </div>
        <div className="text-[18px] font-bold text-white">
          {formatNumber(summary.pesoResultanteTotal)} g
        </div>
        <div
          className="text-[11px] mt-1"
          style={{ color: '#85e8c5' }}
        >
          Rendimiento Promedio: {formatNumber(summary.rendimientoProm, 1)}%
        </div>
      </div>
    </div>
  );
}
