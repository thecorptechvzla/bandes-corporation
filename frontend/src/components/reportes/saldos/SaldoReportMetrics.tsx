'use client';

import { formatNumber } from '@/lib/format';
import type { SaldoRecord } from './types';

interface SaldoReportMetricsProps {
  records: SaldoRecord[];
}

export default function SaldoReportMetrics({ records }: SaldoReportMetricsProps) {
  const totalIngresado = records.reduce((a, r) => a + r.totalRecibido, 0);
  const totalEgresadoBR = records.reduce((a, r) => a + r.totalEgresadoBR, 0);
  const totalEgresadoBI = records.reduce((a, r) => a + r.totalEgresado, 0);
  const mermaTotal = records.reduce((a, r) => a + r.merma, 0);
  const saldoActual = records.reduce((a, r) => a + r.saldoActual, 0);

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
          TOTAL PESO BRUTO INGRESADO
        </div>
        <div className="text-[18px] font-bold text-white">
          {formatNumber(totalIngresado)} g
        </div>
        <div
          className="text-[11px] mt-1"
          style={{ color: '#85e8c5' }}
        >
          Peso Bruto Recibido
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
          TOTAL PESO BRUTO EGRESADO (BR)
        </div>
        <div className="text-[18px] font-bold text-white">
          {formatNumber(totalEgresadoBR)} g
        </div>
        <div
          className="text-[11px] mt-1"
          style={{ color: '#85e8c5' }}
        >
          BI: {formatNumber(totalEgresadoBI)} g · M: {formatNumber(mermaTotal)} g
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
          BALANCE PESO BRUTO
        </div>
        <div className="text-[18px] font-bold text-white">
          {formatNumber(saldoActual)} g
        </div>
        <div
          className="text-[11px] mt-1"
          style={{ color: '#85e8c5' }}
        >
          Peso Bruto Restante Disponible
        </div>
      </div>
    </div>
  );
}
