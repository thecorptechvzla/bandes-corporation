'use client';

import type { EgresoSummary } from './types';
import { formatNumber } from '@/lib/format';

interface EgresosReportMetricsProps {
  summary: EgresoSummary;
}

export default function EgresosReportMetrics({ summary }: EgresosReportMetricsProps) {
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
          TOTAL EGRESOS
        </div>
        <div className="text-[18px] font-bold text-white">
          {summary.totalEgresos} Egresos
        </div>
        <div
          className="text-[11px] mt-1"
          style={{ color: '#85e8c5' }}
        >
          Procesados en el período
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
          TOTAL LINGOTES / BARRAS
        </div>
        <div className="text-[18px] font-bold text-white">
          {summary.totalLingotes} Lingotes
        </div>
        <div
          className="text-[11px] mt-1"
          style={{ color: '#85e8c5' }}
        >
          Salidas registradas
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
          TOTAL PESO BRUTO EGRESADO
        </div>
        <div className="text-[18px] font-bold text-white">
          {formatNumber(summary.pesoBrutoBalanzaTotal)} g
        </div>
        <div
          className="text-[11px] mt-1"
          style={{ color: '#85e8c5' }}
        >
          BR: {formatNumber(summary.pesoBrutoBalanzaTotal)} g · BI: {formatNumber(summary.pesoBrutoTotal)} g · M: {formatNumber(summary.mermaTotal)} g
        </div>
      </div>
    </div>
  );
}
