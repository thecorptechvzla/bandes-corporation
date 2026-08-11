'use client';

import type { ProcesoReportType } from './types';

interface ProcesosReportFiltersProps {
  dateFrom: string;
  dateTo: string;
  proveedorId: string;
  reportType: ProcesoReportType;
  clients: { id: string; name: string }[];
  isLoading?: boolean;
  onDateFromChange: (val: string) => void;
  onDateToChange: (val: string) => void;
  onProveedorChange: (val: string) => void;
  onReportTypeChange: (val: ProcesoReportType) => void;
  onGenerate: () => void;
}

export default function ProcesosReportFilters({
  dateFrom,
  dateTo,
  proveedorId,
  reportType,
  clients,
  isLoading = false,
  onDateFromChange,
  onDateToChange,
  onProveedorChange,
  onReportTypeChange,
  onGenerate,
}: ProcesosReportFiltersProps) {
  return (
    <div
      className="rounded-lg p-4"
      style={{
        backgroundColor: 'var(--report-bg-card)',
        border: '1px solid var(--report-border-color)',
      }}
    >
      <div className="flex items-end justify-center flex-wrap" style={{ gap: '15px' }}>
        <div className="flex flex-col" style={{ gap: '4px' }}>
          <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--report-text-muted)' }}>Fecha de Inicio</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="px-3 py-2 rounded-md text-[12px] outline-none [color-scheme:dark]"
            style={{
              backgroundColor: 'var(--report-bg-input)',
              border: '1px solid var(--report-border-input)',
              color: 'var(--report-text-main)',
              colorScheme: 'dark',
            }}
          />
        </div>

        <span className="font-bold self-end mb-2" style={{ color: 'var(--report-text-muted)' }}>→</span>

        <div className="flex flex-col" style={{ gap: '4px' }}>
          <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--report-text-muted)' }}>Fecha Fin</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className="px-3 py-2 rounded-md text-[12px] outline-none [color-scheme:dark]"
            style={{
              backgroundColor: 'var(--report-bg-input)',
              border: '1px solid var(--report-border-input)',
              color: 'var(--report-text-main)',
              colorScheme: 'dark',
            }}
          />
        </div>

        <div className="flex flex-col" style={{ gap: '4px' }}>
          <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--report-text-muted)' }}>Seleccione un proveedor</label>
          <select
            value={proveedorId}
            onChange={(e) => onProveedorChange(e.target.value)}
            className="px-3 py-2 rounded-md text-[12px] outline-none min-w-[220px]"
            style={{
              backgroundColor: 'var(--report-bg-input)',
              border: '1px solid var(--report-border-input)',
              color: 'var(--report-text-main)',
            }}
          >
            <option value="">Todos los Proveedores</option>
            {clients.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col" style={{ gap: '4px' }}>
          <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--report-text-muted)' }}>Tipo de Reporte</label>
          <select
            value={reportType}
            onChange={(e) => onReportTypeChange(e.target.value as ProcesoReportType)}
            className="px-3 py-2 rounded-md text-[12px] outline-none min-w-[140px]"
            style={{
              backgroundColor: 'var(--report-bg-input)',
              border: '1px solid var(--report-border-input)',
              color: 'var(--report-text-main)',
            }}
          >
            <option value="resumido">Resumen</option>
            <option value="detallado">Detallado</option>
          </select>
        </div>

        <button
          onClick={onGenerate}
          disabled={isLoading}
          className="px-6 py-2.5 rounded-md text-[13px] font-semibold text-white cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg, #139169, #0e6b4d)',
            boxShadow: '0 2px 8px rgba(19, 145, 105, 0.3)',
          }}
        >
          {isLoading ? 'Generando…' : 'Generar'}
        </button>
      </div>
    </div>
  );
}
