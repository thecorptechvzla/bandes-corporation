'use client';

import { formatWeight } from '@/lib/format';

interface ProviderSummary {
  name: string;
  refundidasCount: number;
  sinRefundirCount: number;
  brutoRefundido: number;
  brutoSinRefundir: number;
  brutoTotal: number;
}

interface BovedaReportTableProps {
  providers: ProviderSummary[];
  summary: {
    totalLotes: number;
    totalBarrasSueltas: number;
    totalBarras: number;
    brutoRefundido: number;
    brutoSinRefundir: number;
    brutoTotal: number;
  };
}

export default function BovedaReportTable({ providers, summary }: BovedaReportTableProps) {
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        border: '1px solid var(--report-border-color)',
      }}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr>
              {[
                { label: 'Proveedor', align: 'left' },
                { label: 'Cant. Barras', align: 'right' },
                { label: 'Refundidas', align: 'right' },
                { label: 'Sin Refundir', align: 'right' },
                { label: 'Bruto Ref. (g)', align: 'right' },
                { label: 'Bruto S/R (g)', align: 'right' },
                { label: 'Bruto Total (g)', align: 'right' },
              ].map((h) => (
                <th
                  key={h.label}
                  className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-${h.align}`}
                  style={{
                    backgroundColor: 'var(--report-bg-main)',
                    color: 'var(--report-text-muted)',
                    borderBottom: '1px solid var(--report-border-color)',
                  }}
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {providers.map((p, idx) => {
              const cantBarras = p.refundidasCount + p.sinRefundirCount;
              return (
                <tr
                  key={p.name}
                  style={{
                    backgroundColor: idx % 2 === 0 ? 'transparent' : 'var(--report-bg-table-row-even)',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                  }}
                >
                  <td className="px-4 py-3">
                    <span
                      className="text-[12px] font-semibold"
                      style={{ color: 'var(--report-text-table)' }}
                    >
                      {p.name}
                    </span>
                  </td>
                  <td
                    className="px-4 py-3 text-right text-[12px] font-medium"
                    style={{ color: 'var(--report-text-main)' }}
                  >
                    {cantBarras}
                  </td>
                  <td
                    className="px-4 py-3 text-right text-[12px] font-medium"
                    style={{ color: 'var(--report-text-main)' }}
                  >
                    {p.refundidasCount}
                  </td>
                  <td
                    className="px-4 py-3 text-right text-[12px] font-medium"
                    style={{ color: 'var(--report-text-main)' }}
                  >
                    {p.sinRefundirCount}
                  </td>
                  <td
                    className="px-4 py-3 text-right text-[12px] font-medium"
                    style={{ color: 'var(--report-text-main)' }}
                  >
                    {formatWeight(p.brutoRefundido)}
                  </td>
                  <td
                    className="px-4 py-3 text-right text-[12px] font-medium"
                    style={{ color: 'var(--report-text-main)' }}
                  >
                    {formatWeight(p.brutoSinRefundir)}
                  </td>
                  <td
                    className="px-4 py-3 text-right text-[12px] font-bold"
                    style={{ color: 'var(--report-color-primary)' }}
                  >
                    {formatWeight(p.brutoTotal)}
                  </td>
                </tr>
              );
            })}
            <tr
              style={{
                backgroundColor: 'var(--report-bg-main)',
                borderTop: '2px solid var(--report-color-primary)',
              }}
            >
              <td
                className="px-4 py-3 text-[12px] font-bold"
                style={{ color: 'var(--report-color-primary)' }}
              >
                TOTALES GENERALES
              </td>
              <td
                className="px-4 py-3 text-right text-[12px] font-bold"
                style={{ color: 'var(--report-color-primary)' }}
              >
                {summary.totalBarras}
              </td>
              <td
                className="px-4 py-3 text-right text-[12px] font-bold"
                style={{ color: 'var(--report-color-primary)' }}
              >
                {summary.totalLotes}
              </td>
              <td
                className="px-4 py-3 text-right text-[12px] font-bold"
                style={{ color: 'var(--report-color-primary)' }}
              >
                {summary.totalBarrasSueltas}
              </td>
              <td
                className="px-4 py-3 text-right text-[12px] font-bold"
                style={{ color: 'var(--report-color-primary)' }}
              >
                {formatWeight(summary.brutoRefundido)}
              </td>
              <td
                className="px-4 py-3 text-right text-[12px] font-bold"
                style={{ color: 'var(--report-color-primary)' }}
              >
                {formatWeight(summary.brutoSinRefundir)}
              </td>
              <td
                className="px-4 py-3 text-right text-[12px] font-bold"
                style={{ color: 'var(--report-color-primary)' }}
              >
                {formatWeight(summary.brutoTotal)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}