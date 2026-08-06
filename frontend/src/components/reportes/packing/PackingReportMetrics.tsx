'use client';

import { formatNumber } from '@/lib/format';
import type { PackingSummary } from './mockData';

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
          {summary.totalBarras} Barras
        </div>
        <div
          className="text-[11px] mt-1"
          style={{ color: '#85e8c5' }}
        >
          Recibidas en total
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
          TOTAL PESO FINO
        </div>
        <div className="text-[18px] font-bold text-white">
          {formatNumber(summary.pesoFinoTotal)} g
        </div>
        <div
          className="text-[11px] mt-1"
          style={{ color: '#85e8c5' }}
        >
          Ley Promedio General: {formatNumber(summary.leyProm, 4)}
        </div>
      </div>
    </div>
  );
}
