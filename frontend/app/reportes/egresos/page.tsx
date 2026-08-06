'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import EgresosReportFilters from '@/components/reportes/egresos/EgresosReportFilters';
import EgresosReportHeader from '@/components/reportes/egresos/EgresosReportHeader';
import EgresosReportMetrics from '@/components/reportes/egresos/EgresosReportMetrics';
import EgresosReportTable from '@/components/reportes/egresos/EgresosReportTable';
import EgresosReportDetailTable from '@/components/reportes/egresos/EgresosReportDetailTable';
import EgresosReportPdfTemplate from '@/components/reportes/egresos/EgresosReportPdfTemplate';
import { MOCK_EGRESOS_DATA, MOCK_EGRESOS_DETAILED, MOCK_CLIENTES_EGRESOS, type EgresoRecord, type EgresoDetailedRecord, type EgresoSummary, type EgresoReportType } from '@/components/reportes/egresos/mockData';
import { generateEgresosReportPDF } from '@/lib/generateEgresosReportPDF';
import { generateEgresosReportExcel } from '@/lib/generateEgresosReportExcel';

function computeSummary(records: EgresoRecord[]): EgresoSummary {
  const totalEgresos = records.length;
  const totalLingotes = records.reduce((a, r) => a + r.lingotes, 0);
  const pesoFinoTotal = records.reduce((a, r) => a + r.pesoFino, 0);
  const pesoBrutoTotal = records.reduce((a, r) => a + r.pesoBruto, 0);
  return { totalEgresos, totalLingotes, pesoFinoTotal, pesoBrutoTotal };
}

export default function EgresosReportPage() {
  const [dateFrom, setDateFrom] = useState('2026-08-01');
  const [dateTo, setDateTo] = useState('2026-08-05');
  const [clienteId, setClienteId] = useState('');
  const [reportType, setReportType] = useState<EgresoReportType>('resumido');
  const [showReport, setShowReport] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  const [filteredRecords, setFilteredRecords] = useState<EgresoRecord[]>(MOCK_EGRESOS_DATA.records);
  const [filteredDetailed, setFilteredDetailed] = useState<EgresoDetailedRecord[]>(MOCK_EGRESOS_DETAILED);
  const [filteredSummary, setFilteredSummary] = useState<EgresoSummary>(MOCK_EGRESOS_DATA.summary);

  const [appliedClienteName, setAppliedClienteName] = useState('Todos los Clientes');
  const [appliedDateFrom, setAppliedDateFrom] = useState('2026-08-01');
  const [appliedDateTo, setAppliedDateTo] = useState('2026-08-05');
  const [appliedReportType, setAppliedReportType] = useState<EgresoReportType>('resumido');

  const reportId = '#REP-EGR-BANDES-2026-08';
  const generatedAt = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const clienteName = MOCK_CLIENTES_EGRESOS.find((c) => c.id === clienteId)?.name || 'Todos los Clientes';

  const handleGenerate = useCallback(() => {
    const selectedCliente = MOCK_CLIENTES_EGRESOS.find((c) => c.id === clienteId);
    const matchName = selectedCliente && selectedCliente.id !== '' ? selectedCliente.name : '';

    const records = MOCK_EGRESOS_DATA.records.filter((item) => {
      if (matchName === '') return true;
      return item.cliente === matchName;
    });

    const detailed = MOCK_EGRESOS_DETAILED.filter((item) => {
      if (matchName === '') return true;
      return item.cliente === matchName;
    });

    setFilteredRecords(records);
    setFilteredDetailed(detailed);
    setFilteredSummary(computeSummary(records));
    setAppliedClienteName(clienteName);
    setAppliedDateFrom(dateFrom);
    setAppliedDateTo(dateTo);
    setAppliedReportType(reportType);
    setShowReport(true);
  }, [clienteId, clienteName, dateFrom, dateTo, reportType]);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await generateEgresosReportPDF({
        data: { summary: filteredSummary, records: filteredRecords },
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
        data: { summary: filteredSummary, records: filteredRecords },
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
              />
            ) : (
              <EgresosReportDetailTable
                records={filteredDetailed}
                summary={filteredSummary}
              />
            )}
          </div>
        </motion.div>
      )}

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
          data={{ summary: filteredSummary, records: filteredRecords }}
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
