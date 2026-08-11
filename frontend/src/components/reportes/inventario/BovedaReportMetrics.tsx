'use client';

import { formatNumber } from '@/lib/format';
import MetricCard from '@/components/reportes/MetricCard';

interface ProviderSummary {
  name: string;
  refundidasCount: number;
  sinRefundirCount: number;
  brutoRefundido: number;
  brutoSinRefundir: number;
  brutoTotal: number;
}

interface BovedaReportMetricsProps {
  summary: {
    totalLotes: number;
    totalBarrasSueltas: number;
    totalBarras: number;
    brutoRefundido: number;
    brutoSinRefundir: number;
    brutoTotal: number;
    providers: ProviderSummary[];
  };
}

export default function BovedaReportMetrics({ summary }: BovedaReportMetricsProps) {
  return (
    <div className="flex gap-4 flex-wrap">
      <MetricCard
        label="TOTAL PESO BRUTO"
        value={`${formatNumber(summary.brutoTotal)} g`}
        footnote={`Ref: ${formatNumber(summary.brutoRefundido)} g · S/R: ${formatNumber(summary.brutoSinRefundir)} g`}
      />
      <MetricCard
        label="TOTAL LOTES (REFUNDIDOS)"
        value={`${summary.totalLotes} Lotes`}
        footnote="Oro refundido en bóveda"
      />
      <MetricCard
        label="TOTAL BARRAS (SIN REFUNDIR)"
        value={`${summary.totalBarrasSueltas} Barras`}
        footnote="Piezas sueltas en bóveda"
      />
    </div>
  );
}