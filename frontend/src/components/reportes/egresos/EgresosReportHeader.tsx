'use client';

interface EgresosReportHeaderProps {
  onExportPDF: () => void;
  onExportExcel: () => void;
  reportId: string;
  generatedAt: string;
  clienteName: string;
  dateFrom: string;
  dateTo: string;
}

export default function EgresosReportHeader({
  onExportPDF,
  onExportExcel,
  reportId,
  generatedAt,
  clienteName,
  dateFrom,
  dateTo,
}: EgresosReportHeaderProps) {
  const formatDate = (d: string) => {
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };

  return (
    <>
      <div className="flex justify-between items-start mb-5">
        <div className="flex gap-2">
          <button
            onClick={onExportPDF}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-[11px] font-bold cursor-pointer transition-colors"
            style={{
              backgroundColor: 'var(--report-btn-pdf-bg)',
              color: 'var(--report-btn-pdf-text)',
              border: '1px solid var(--report-btn-pdf-border)',
            }}
          >
            PDF
          </button>
          <button
            onClick={onExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-[11px] font-bold cursor-pointer transition-colors"
            style={{
              backgroundColor: 'var(--report-btn-excel-bg)',
              color: 'var(--report-btn-excel-text)',
              border: '1px solid var(--report-btn-excel-border)',
            }}
          >
            EXCEL
          </button>
        </div>

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
          REPORTE DE EGRESOS DE MATERIAL
        </div>
        <div
          className="text-[10px] mt-1"
          style={{ color: 'var(--report-text-muted)' }}
        >
          Filtro aplicado: {clienteName} | Período: {formatDate(dateFrom)} al {formatDate(dateTo)}
        </div>
      </div>
    </>
  );
}
