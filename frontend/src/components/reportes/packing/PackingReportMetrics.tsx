'use client';

import { formatLey, formatNumber } from '@/lib/format';
import type { PackingSummary } from './types';

interface PackingReportMetricsProps {
  summary: PackingSummary;
}

export default function PackingReportMetrics({ summary }: PackingReportMetricsProps) {
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
          TOTAL PACKINGS
        </div>
        <div className="text-[18px] font-bold text-white">
          {summary.totalPackings} Packings
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
          TOTAL BARRAS
        </div>
        <div className="text-[18px] font-bold text-white">
          {summary.totalBarras} Barras ({summary.totalValidadas} / {summary.totalPendientes})
        </div>
        <div
          className="text-[11px] mt-1"
          style={{ color: '#85e8c5' }}
        >
          Recibidas en total — Validadas / Pendientes
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
          TOTAL PESO BRUTO
        </div>
        <div className="text-[18px] font-bold text-white">
          {formatNumber(summary.pesoBrutoTotal)} g
        </div>
        <div
          className="text-[11px] mt-1"
          style={{ color: '#85e8c5' }}
        >
          Ley Promedio General (‰): {formatLey(summary.leyProm)}
        </div>
      </div>
    </div>
  );
}
