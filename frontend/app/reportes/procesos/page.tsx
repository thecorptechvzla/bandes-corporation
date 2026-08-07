'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import ProcesosReportFilters from '@/components/reportes/procesos/ProcesosReportFilters';
import ProcesosReportHeader from '@/components/reportes/procesos/ProcesosReportHeader';
import ProcesosReportMetrics from '@/components/reportes/procesos/ProcesosReportMetrics';
import ProcesosReportTable from '@/components/reportes/procesos/ProcesosReportTable';
import ProcesosReportDetailTable from '@/components/reportes/procesos/ProcesosReportDetailTable';
import ProcesosReportPdfTemplate from '@/components/reportes/procesos/ProcesosReportPdfTemplate';
import ReportGuideCard from '@/components/reportes/ReportGuideCard';
import type { ProcesoRecord, ProcesoDetailedRecord, ProcesoSummary, ProcesoReportType } from '@/components/reportes/procesos/types';
import { fetchProcesosReport } from '@/hooks/useProcesosReport';
import { useClients } from '@/hooks/useClients';
import { generateProcesosReportPDF } from '@/lib/generateProcesosReportPDF';
import { generateProcesosReportExcel } from '@/lib/generateProcesosReportExcel';

const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function ProcesosReportPage() {
  const [dateFrom, setDateFrom] = useState(() => {
    const now = new Date();
    return `${toISODate(now).slice(0, 7)}-01`;
  });
  const [dateTo, setDateTo] = useState(() => toISODate(new Date()));
  const [proveedorId, setProveedorId] = useState('');
  const [reportType, setReportType] = useState<ProcesoReportType>('resumido');
  const [showReport, setShowReport] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  const { data: proveedores = [] } = useClients({ role: 'PROVEEDOR' });

  const [filteredRecords, setFilteredRecords] = useState<ProcesoRecord[]>([]);
  const [filteredDetailed, setFilteredDetailed] = useState<ProcesoDetailedRecord[]>([]);
  const [filteredSummary, setFilteredSummary] = useState<ProcesoSummary>({
    totalProcesos: 0,
    totalBarras: 0,
    pesoResultanteTotal: 0,
    rendimientoProm: 0,
  });

  const [appliedProveedorName, setAppliedProveedorName] = useState('Todos los Proveedores');
  const [appliedDateFrom, setAppliedDateFrom] = useState(() => {
    const now = new Date();
    return `${toISODate(now).slice(0, 7)}-01`;
  });
  const [appliedDateTo, setAppliedDateTo] = useState(() => toISODate(new Date()));
  const [appliedReportType, setAppliedReportType] = useState<ProcesoReportType>('resumido');

  const reportId = '#REP-PROC-BANDES-2026-08';
  const generatedAt = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const proveedorName = proveedores.find((p) => p.id === proveedorId)?.name || 'Todos los Proveedores';

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    try {
      const reportData = await fetchProcesosReport({
        from: dateFrom,
        to: dateTo,
        reportType,
        clientId: proveedorId || undefined,
      });
      setFilteredRecords(reportData.records);
      setFilteredDetailed(reportData.detailed ?? []);
      setFilteredSummary(reportData.summary);
      setAppliedProveedorName(proveedorName);
      setAppliedDateFrom(dateFrom);
      setAppliedDateTo(dateTo);
      setAppliedReportType(reportType);
      setShowReport(true);
    } finally {
      setIsGenerating(false);
    }
  }, [proveedorId, proveedorName, dateFrom, dateTo, reportType]);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await generateProcesosReportPDF({
        data: { summary: filteredSummary, records: filteredRecords, detailed: filteredDetailed },
        reportId,
        generatedAt,
        dateFrom: appliedDateFrom,
        dateTo: appliedDateTo,
        proveedorName: appliedProveedorName,
        reportType: appliedReportType,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      await generateProcesosReportExcel({
        data: { summary: filteredSummary, records: filteredRecords, detailed: filteredDetailed },
        reportId,
        generatedAt,
        dateFrom: appliedDateFrom,
        dateTo: appliedDateTo,
        proveedorName: appliedProveedorName,
        reportType: appliedReportType,
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-5"
    >
      {/* Filtros */}
      <ProcesosReportFilters
        dateFrom={dateFrom}
        dateTo={dateTo}
        proveedorId={proveedorId}
        reportType={reportType}
        clients={proveedores}
        isLoading={isGenerating}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onProveedorChange={setProveedorId}
        onReportTypeChange={setReportType}
        onGenerate={handleGenerate}
      />

      {/* Reporte */}
      {showReport && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-lg p-6"
          style={{
            backgroundColor: 'var(--report-bg-card)',
            border: '1px solid var(--report-border-color)',
          }}
        >
          <ProcesosReportHeader
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportExcel}
            reportId={reportId}
            generatedAt={generatedAt}
            proveedorName={appliedProveedorName}
            dateFrom={appliedDateFrom}
            dateTo={appliedDateTo}
          />

          <ProcesosReportMetrics summary={filteredSummary} />

          <div className="mt-6">
            {appliedReportType === 'resumido' ? (
              <ProcesosReportTable
                records={filteredRecords}
                summary={filteredSummary}
              />
            ) : (
              <ProcesosReportDetailTable
                records={filteredDetailed}
                summary={filteredSummary}
              />
            )}
          </div>
        </motion.div>
      )}

      {!showReport && <ReportGuideCard entity="proveedor" />}

      {/* PDF Template (oculto) */}
      <div
        ref={pdfRef}
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 0,
          width: '750px',
          minWidth: '750px',
          maxWidth: '750px',
          boxSizing: 'border-box',
          backgroundColor: '#ffffff',
          opacity: 0,
          pointerEvents: 'none',
        }}
      >
        <ProcesosReportPdfTemplate
          data={{ summary: filteredSummary, records: filteredRecords, detailed: filteredDetailed }}
          reportId={reportId}
          generatedAt={generatedAt}
          dateFrom={appliedDateFrom}
          dateTo={appliedDateTo}
          proveedorName={appliedProveedorName}
          reportType={appliedReportType}
        />
      </div>
    </motion.div>
  );
}
