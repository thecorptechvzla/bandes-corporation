'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import PackingReportFilters from '@/components/reportes/packing/PackingReportFilters';
import PackingReportHeader from '@/components/reportes/packing/PackingReportHeader';
import PackingReportMetrics from '@/components/reportes/packing/PackingReportMetrics';
import PackingReportTable from '@/components/reportes/packing/PackingReportTable';
import PackingReportDetailTable from '@/components/reportes/packing/PackingReportDetailTable';
import PackingReportPdfTemplate from '@/components/reportes/packing/PackingReportPdfTemplate';
import ReportGuideCard from '@/components/reportes/ReportGuideCard';
import { useClients } from '@/hooks/useClients';
import { fetchPackingReport } from '@/hooks/usePackingReport';
import type { PackingRecord, PackingDetailedRecord, PackingSummary, ReportType } from '@/components/reportes/packing/types';
import { generatePackingReportPDF } from '@/lib/generatePackingReportPDF';
import { generatePackingReportExcel } from '@/lib/generatePackingReportExcel';

const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function PackingReportPage() {
  const [dateFrom, setDateFrom] = useState(() => {
    const now = new Date();
    return `${toISODate(now).slice(0, 7)}-01`;
  });
  const [dateTo, setDateTo] = useState(() => toISODate(new Date()));
  const [clientId, setClientId] = useState('');
  const [reportType, setReportType] = useState<ReportType>('resumido');
  const [showReport, setShowReport] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  const { data: proveedores = [] } = useClients({ role: 'PROVEEDOR' });

  const [filteredRecords, setFilteredRecords] = useState<PackingRecord[]>([]);
  const [filteredDetailed, setFilteredDetailed] = useState<PackingDetailedRecord[]>([]);
  const [filteredSummary, setFilteredSummary] = useState<PackingSummary>({
    totalPackings: 0,
    totalBarras: 0,
    totalValidadas: 0,
    totalPendientes: 0,
    pesoBrutoTotal: 0,
    leyProm: 0,
    pesoFinoTotal: 0,
  });

  const [appliedClientName, setAppliedClientName] = useState('Todos los Proveedores');
  const [appliedDateFrom, setAppliedDateFrom] = useState(() => {
    const now = new Date();
    return `${toISODate(now).slice(0, 7)}-01`;
  });
  const [appliedDateTo, setAppliedDateTo] = useState(() => toISODate(new Date()));
  const [appliedReportType, setAppliedReportType] = useState<ReportType>('resumido');

  const reportId = '#REP-BANDES-2026-08';
  const generatedAt = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const clientName = proveedores.find((c) => c.id === clientId)?.name || 'Todos los Proveedores';

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    try {
      const reportData = await fetchPackingReport({
        from: dateFrom,
        to: dateTo,
        reportType,
        clientId,
      });
      setFilteredRecords(reportData.records);
      setFilteredDetailed(reportData.detailed ?? []);
      setFilteredSummary(reportData.summary);
      setAppliedClientName(clientName);
      setAppliedDateFrom(dateFrom);
      setAppliedDateTo(dateTo);
      setAppliedReportType(reportType);
      setShowReport(true);
    } finally {
      setIsGenerating(false);
    }
  }, [clientId, clientName, dateFrom, dateTo, reportType]);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await generatePackingReportPDF({
        data: { summary: filteredSummary, records: filteredRecords, detailed: filteredDetailed },
        reportId,
        generatedAt,
        dateFrom: appliedDateFrom,
        dateTo: appliedDateTo,
        clientName: appliedClientName,
        reportType: appliedReportType,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      await generatePackingReportExcel({
        data: { summary: filteredSummary, records: filteredRecords, detailed: filteredDetailed },
        reportId,
        generatedAt,
        dateFrom: appliedDateFrom,
        dateTo: appliedDateTo,
        clientName: appliedClientName,
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
      <PackingReportFilters
        dateFrom={dateFrom}
        dateTo={dateTo}
        clientId={clientId}
        reportType={reportType}
        clients={proveedores}
        isLoading={isGenerating}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onClientChange={setClientId}
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
          {/* Acciones de exportación y metadatos */}
          <PackingReportHeader
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportExcel}
            reportId={reportId}
            generatedAt={generatedAt}
            clientName={appliedClientName}
            dateFrom={appliedDateFrom}
            dateTo={appliedDateTo}
          />

          {/* Métricas resumen */}
          <PackingReportMetrics summary={filteredSummary} />

          {/* Tabla según tipo de reporte */}
          <div className="mt-6">
            {appliedReportType === 'resumido' ? (
              <PackingReportTable
                records={filteredRecords}
                summary={filteredSummary}
              />
            ) : (
              <PackingReportDetailTable
                records={filteredDetailed}
                summary={filteredSummary}
              />
            )}
          </div>
        </motion.div>
      )}

      {!showReport && <ReportGuideCard entity="proveedor" />}

      {/* PDF Template (oculto, para captura) */}
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
        <PackingReportPdfTemplate
          data={{ summary: filteredSummary, records: filteredRecords, detailed: filteredDetailed }}
          reportId={reportId}
          generatedAt={generatedAt}
          dateFrom={appliedDateFrom}
          dateTo={appliedDateTo}
          clientName={appliedClientName}
          reportType={appliedReportType}
        />
      </div>
    </motion.div>
  );
}
