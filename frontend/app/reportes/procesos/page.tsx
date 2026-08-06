'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import ProcesosReportFilters from '@/components/reportes/procesos/ProcesosReportFilters';
import ProcesosReportHeader from '@/components/reportes/procesos/ProcesosReportHeader';
import ProcesosReportMetrics from '@/components/reportes/procesos/ProcesosReportMetrics';
import ProcesosReportTable from '@/components/reportes/procesos/ProcesosReportTable';
import ProcesosReportDetailTable from '@/components/reportes/procesos/ProcesosReportDetailTable';
import ProcesosReportPdfTemplate from '@/components/reportes/procesos/ProcesosReportPdfTemplate';
import { MOCK_PROCESOS_DATA, MOCK_PROCESOS_DETAILED, MOCK_PROVEEDORES, type ProcesoRecord, type ProcesoDetailedRecord, type ProcesoSummary, type ProcesoReportType } from '@/components/reportes/procesos/mockData';
import { generateProcesosReportPDF } from '@/lib/generateProcesosReportPDF';
import { generateProcesosReportExcel } from '@/lib/generateProcesosReportExcel';

function computeSummary(records: ProcesoRecord[]): ProcesoSummary {
  const totalProcesos = records.length;
  const totalBarras = records.reduce((a, r) => a + r.barras, 0);
  const pesoResultanteTotal = records.reduce((a, r) => a + r.pesoObtenido, 0);
  const pesoInicialTotal = records.reduce((a, r) => a + r.pesoInicial, 0);
  const rendimientoProm = pesoInicialTotal > 0 ? (pesoResultanteTotal / pesoInicialTotal) * 100 : 0;
  return { totalProcesos, totalBarras, pesoResultanteTotal, rendimientoProm };
}

export default function ProcesosReportPage() {
  const [dateFrom, setDateFrom] = useState('2026-08-01');
  const [dateTo, setDateTo] = useState('2026-08-05');
  const [proveedorId, setProveedorId] = useState('');
  const [reportType, setReportType] = useState<ProcesoReportType>('resumido');
  const [showReport, setShowReport] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  const [filteredRecords, setFilteredRecords] = useState<ProcesoRecord[]>(MOCK_PROCESOS_DATA.records);
  const [filteredDetailed, setFilteredDetailed] = useState<ProcesoDetailedRecord[]>(MOCK_PROCESOS_DETAILED);
  const [filteredSummary, setFilteredSummary] = useState<ProcesoSummary>(MOCK_PROCESOS_DATA.summary);

  const [appliedProveedorName, setAppliedProveedorName] = useState('Todos los Proveedores');
  const [appliedDateFrom, setAppliedDateFrom] = useState('2026-08-01');
  const [appliedDateTo, setAppliedDateTo] = useState('2026-08-05');
  const [appliedReportType, setAppliedReportType] = useState<ProcesoReportType>('resumido');

  const reportId = '#REP-PROC-BANDES-2026-08';
  const generatedAt = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const proveedorName = MOCK_PROVEEDORES.find((p) => p.id === proveedorId)?.name || 'Todos los Proveedores';

  const handleGenerate = useCallback(() => {
    const selectedProveedor = MOCK_PROVEEDORES.find((p) => p.id === proveedorId);
    const matchName = selectedProveedor && selectedProveedor.id !== '' ? selectedProveedor.name : '';

    const records = MOCK_PROCESOS_DATA.records.filter((item) => {
      if (matchName === '') return true;
      if (matchName === 'Mixtos') return item.esMixto;
      return item.proveedores.some((p) => p.toLowerCase().includes(matchName.toLowerCase().split(' ')[0]));
    });

    const detailed = MOCK_PROCESOS_DETAILED.filter((item) => {
      if (matchName === '') return true;
      if (matchName === 'Mixtos') return item.esMixto;
      return item.proveedores.some((p) => p.toLowerCase().includes(matchName.toLowerCase().split(' ')[0]));
    });

    setFilteredRecords(records);
    setFilteredDetailed(detailed);
    setFilteredSummary(computeSummary(records));
    setAppliedProveedorName(proveedorName);
    setAppliedDateFrom(dateFrom);
    setAppliedDateTo(dateTo);
    setAppliedReportType(reportType);
    setShowReport(true);
  }, [proveedorId, proveedorName, dateFrom, dateTo, reportType]);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await generateProcesosReportPDF({
        data: { summary: filteredSummary, records: filteredRecords },
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
        data: { summary: filteredSummary, records: filteredRecords },
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
          data={{ summary: filteredSummary, records: filteredRecords }}
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
