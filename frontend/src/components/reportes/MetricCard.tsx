'use client';

interface MetricCardProps {
  label: string;
  value: string;
  footnote?: string;
}

export default function MetricCard({ label, value, footnote }: MetricCardProps) {
  return (
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
        {label}
      </div>
      <div className="text-[18px] font-bold text-white">{value}</div>
      {footnote && (
        <div
          className="text-[11px] mt-1"
          style={{ color: '#85e8c5' }}
        >
          {footnote}
        </div>
      )}
    </div>
  );
}