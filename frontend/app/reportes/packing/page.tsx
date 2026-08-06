'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import PackingReportFilters from '@/components/reportes/packing/PackingReportFilters';
import PackingReportHeader from '@/components/reportes/packing/PackingReportHeader';
import PackingReportMetrics from '@/components/reportes/packing/PackingReportMetrics';
import PackingReportTable from '@/components/reportes/packing/PackingReportTable';
import PackingReportDetailTable from '@/components/reportes/packing/PackingReportDetailTable';
import PackingReportPdfTemplate from '@/components/reportes/packing/PackingReportPdfTemplate';
import { MOCK_PACKING_DATA, MOCK_DETAILED_DATA, MOCK_CLIENTS, type PackingRecord, type PackingDetailedRecord, type PackingSummary, type ReportType } from '@/components/reportes/packing/mockData';
import { generatePackingReportPDF } from '@/lib/generatePackingReportPDF';
import { generatePackingReportExcel } from '@/lib/generatePackingReportExcel';

function computeSummary(records: PackingRecord[]): PackingSummary {
  const totalPackings = records.length;
  const totalBarras = records.reduce((acc, r) => acc + r.barras, 0);
  const pesoBrutoTotal = records.reduce((acc, r) => acc + r.pesoBruto, 0);
  const pesoFinoTotal = records.reduce((acc, r) => acc + r.pesoFino, 0);
  const leyProm = pesoBrutoTotal > 0 ? pesoFinoTotal / pesoBrutoTotal : 0;
  return { totalPackings, totalBarras, pesoBrutoTotal, pesoFinoTotal, leyProm };
}

export default function PackingReportPage() {
  const [dateFrom, setDateFrom] = useState('2026-08-01');
  const [dateTo, setDateTo] = useState('2026-08-05');
  const [clientId, setClientId] = useState('');
  const [reportType, setReportType] = useState<ReportType>('resumido');
  const [showReport, setShowReport] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  const [filteredRecords, setFilteredRecords] = useState<PackingRecord[]>(MOCK_PACKING_DATA.records);
  const [filteredDetailed, setFilteredDetailed] = useState<PackingDetailedRecord[]>(MOCK_DETAILED_DATA);
  const [filteredSummary, setFilteredSummary] = useState<PackingSummary>(MOCK_PACKING_DATA.summary);

  const [appliedClientName, setAppliedClientName] = useState('Todos los Clientes');
  const [appliedDateFrom, setAppliedDateFrom] = useState('2026-08-01');
  const [appliedDateTo, setAppliedDateTo] = useState('2026-08-05');
  const [appliedReportType, setAppliedReportType] = useState<ReportType>('resumido');

  const reportId = '#REP-BANDES-2026-08';
  const generatedAt = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const clientName = MOCK_CLIENTS.find((c) => c.id === clientId)?.name || 'Todos los Clientes';

  const handleGenerate = useCallback(() => {
    const selectedClient = MOCK_CLIENTS.find((c) => c.id === clientId);
    const matchName = selectedClient && selectedClient.id !== '' ? selectedClient.name : '';

    const records = MOCK_PACKING_DATA.records.filter((item) => {
      return matchName === '' || item.client === matchName;
    });

    const detailed = MOCK_DETAILED_DATA.filter((item) => {
      return matchName === '' || item.client === matchName;
    });

    setFilteredRecords(records);
    setFilteredDetailed(detailed);
    setFilteredSummary(computeSummary(records));
    setAppliedClientName(clientName);
    setAppliedDateFrom(dateFrom);
    setAppliedDateTo(dateTo);
    setAppliedReportType(reportType);
    setShowReport(true);
  }, [clientId, clientName, dateFrom, dateTo, reportType]);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await generatePackingReportPDF({
        data: { summary: filteredSummary, records: filteredRecords },
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
        data: { summary: filteredSummary, records: filteredRecords },
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
          data={{ summary: filteredSummary, records: filteredRecords }}
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
