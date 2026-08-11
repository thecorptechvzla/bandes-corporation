'use client';

interface ExportButtonsProps {
  onExportPDF: () => void;
  onExportExcel: () => void;
  isExporting?: boolean;
}

export default function ExportButtons({
  onExportPDF,
  onExportExcel,
  isExporting = false,
}: ExportButtonsProps) {
  return (
    <div className="flex gap-2">
      <button
        onClick={onExportPDF}
        disabled={isExporting}
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-[11px] font-bold cursor-pointer transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
        disabled={isExporting}
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-[11px] font-bold cursor-pointer transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: 'var(--report-btn-excel-bg)',
          color: 'var(--report-btn-excel-text)',
          border: '1px solid var(--report-btn-excel-border)',
        }}
      >
        EXCEL
      </button>
    </div>
  );
}