'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import EgresosReportFilters from '@/components/reportes/egresos/EgresosReportFilters';
import EgresosReportHeader from '@/components/reportes/egresos/EgresosReportHeader';
import EgresosReportMetrics from '@/components/reportes/egresos/EgresosReportMetrics';
import EgresosReportTable from '@/components/reportes/egresos/EgresosReportTable';
import EgresosReportDetailTable from '@/components/reportes/egresos/EgresosReportDetailTable';
import EgresosReportPdfTemplate from '@/components/reportes/egresos/EgresosReportPdfTemplate';
import ReportGuideCard from '@/components/reportes/ReportGuideCard';
import type { EgresoRecord, EgresoDetailedRecord, EgresoSummary, EgresoReportType } from '@/components/reportes/egresos/types';
import { fetchEgresosReport } from '@/hooks/useEgresosReport';
import { useClients } from '@/hooks/useClients';
import { generateEgresosReportPDF } from '@/lib/generateEgresosReportPDF';
import { generateEgresosReportExcel } from '@/lib/generateEgresosReportExcel';
import { convertExitToDispatchResult, generateDispatchPDF } from '@/lib/generateDispatchPDF';
import type { CopyType } from '@/lib/generateDispatchPDF';

const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function EgresosReportPage() {
  const [dateFrom, setDateFrom] = useState(() => {
    const now = new Date();
    return `${toISODate(now).slice(0, 7)}-01`;
  });
  const [dateTo, setDateTo] = useState(() => toISODate(new Date()));
  const [clienteId, setClienteId] = useState('');
  const [reportType, setReportType] = useState<EgresoReportType>('resumido');
  const [showReport, setShowReport] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  const { data: clients = [] } = useClients();

  const [filteredRecords, setFilteredRecords] = useState<EgresoRecord[]>([]);
  const [filteredDetailed, setFilteredDetailed] = useState<EgresoDetailedRecord[]>([]);
  const [filteredSummary, setFilteredSummary] = useState<EgresoSummary>({
    totalEgresos: 0,
    totalLingotes: 0,
    pesoFinoTotal: 0,
    pesoBrutoTotal: 0,
    pesoBrutoBalanzaTotal: 0,
    mermaTotal: 0,
  });

  const [appliedClienteName, setAppliedClienteName] = useState('Todos los Clientes');
  const [appliedDateFrom, setAppliedDateFrom] = useState(() => {
    const now = new Date();
    return `${toISODate(now).slice(0, 7)}-01`;
  });
  const [appliedDateTo, setAppliedDateTo] = useState(() => toISODate(new Date()));
  const [appliedReportType, setAppliedReportType] = useState<EgresoReportType>('resumido');

  const reportId = '#REP-EGR-BANDES-2026-08';
  const generatedAt = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const clienteName = clients.find((c) => c.id === clienteId)?.name || 'Todos los Clientes';

  const handleReportTypeChange = useCallback((t: EgresoReportType) => {
    setReportType(t);
  }, []);

  const handleReprint = useCallback((record: EgresoRecord, copyType: CopyType) => {
    if (!record.exit) return;
    const destinatario = clients.find((c) => c.id === record.clienteId);
    const destinoClient = destinatario
      ? { rif: destinatario.rif, contactInfo: destinatario.contactInfo }
      : undefined;
    generateDispatchPDF(convertExitToDispatchResult(record.exit), destinoClient, copyType, appliedReportType === 'detallado');
  }, [clients, appliedReportType]);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    try {
      const reportData = await fetchEgresosReport({
        from: dateFrom,
        to: dateTo,
        reportType,
        clientId: clienteId || undefined,
      });
      setFilteredRecords(reportData.records);
      setFilteredDetailed(reportData.detailed ?? []);
      setFilteredSummary(reportData.summary);
      setAppliedClienteName(clienteName);
      setAppliedDateFrom(dateFrom);
      setAppliedDateTo(dateTo);
      setAppliedReportType(reportType);
      setShowReport(true);
    } finally {
      setIsGenerating(false);
    }
  }, [clienteId, clienteName, dateFrom, dateTo, reportType]);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await generateEgresosReportPDF({
        data: { summary: filteredSummary, records: filteredRecords, detailed: filteredDetailed },
        reportId,
        generatedAt,
        dateFrom: appliedDateFrom,
        dateTo: appliedDateTo,
        clienteName: appliedClienteName,
        reportType: appliedReportType,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      await generateEgresosReportExcel({
        data: { summary: filteredSummary, records: filteredRecords, detailed: filteredDetailed },
        reportId,
        generatedAt,
        dateFrom: appliedDateFrom,
        dateTo: appliedDateTo,
        clienteName: appliedClienteName,
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
      <EgresosReportFilters
        dateFrom={dateFrom}
        dateTo={dateTo}
        clienteId={clienteId}
        reportType={reportType}
        clients={clients}
        isLoading={isGenerating}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onClienteChange={setClienteId}
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
          <EgresosReportHeader
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportExcel}
            reportId={reportId}
            generatedAt={generatedAt}
            clienteName={appliedClienteName}
            dateFrom={appliedDateFrom}
            dateTo={appliedDateTo}
          />

          <EgresosReportMetrics summary={filteredSummary} />

          <div className="mt-6">
            {appliedReportType === 'resumido' ? (
              <EgresosReportTable
                records={filteredRecords}
                summary={filteredSummary}
                dateFrom={appliedDateFrom}
                dateTo={appliedDateTo}
                onReprint={handleReprint}
              />
            ) : (
              <EgresosReportDetailTable
                records={filteredDetailed}
                summary={filteredSummary}
                onReprint={handleReprint}
              />
            )}
          </div>
        </motion.div>
      )}

      {!showReport && <ReportGuideCard entity="cliente" />}

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
        <EgresosReportPdfTemplate
          data={{ summary: filteredSummary, records: filteredRecords, detailed: filteredDetailed }}
          reportId={reportId}
          generatedAt={generatedAt}
          dateFrom={appliedDateFrom}
          dateTo={appliedDateTo}
          clienteName={appliedClienteName}
          reportType={appliedReportType}
        />
      </div>
    </motion.div>
  );
}
