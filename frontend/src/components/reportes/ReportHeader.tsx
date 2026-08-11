'use client';

import ExportButtons from './ExportButtons';

interface ReportHeaderProps {
  title: string;
  subtitle: string;
  onExportPDF: () => void;
  onExportExcel: () => void;
  reportId: string;
  generatedAt: string;
  isExporting?: boolean;
}

export default function ReportHeader({
  title,
  subtitle,
  onExportPDF,
  onExportExcel,
  reportId,
  generatedAt,
  isExporting = false,
}: ReportHeaderProps) {
  return (
    <>
      <div className="flex justify-between items-start mb-5">
        <ExportButtons
          onExportPDF={onExportPDF}
          onExportExcel={onExportExcel}
          isExporting={isExporting}
        />

        <div
          className="text-right text-[11px] leading-relaxed"
          style={{ color: 'var(--report-text-muted)' }}
        >
          <div>
            <strong>Fecha:</strong>{' '}
            {new Date().toLocaleDateString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}
          </div>
          <div>
            <strong>ID Reporte:</strong> {reportId}
          </div>
          <div>
            <strong>Generado:</strong> {generatedAt}
          </div>
        </div>
      </div>

      <div
        className="pb-3 mb-5"
        style={{ borderBottom: '2px solid var(--report-color-primary)' }}
      >
        <div
          className="text-[16px] font-bold tracking-wide"
          style={{ color: 'var(--report-color-primary)' }}
        >
          {title}
        </div>
        <div
          className="text-[10px] mt-1"
          style={{ color: 'var(--report-text-muted)' }}
        >
          {subtitle}
        </div>
      </div>
    </>
  );
}