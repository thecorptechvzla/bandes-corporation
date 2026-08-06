'use client';

import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import SaldoReportFilters from '@/components/reportes/saldos/SaldoReportFilters';
import SaldoReportHeader from '@/components/reportes/saldos/SaldoReportHeader';
import SaldoReportMetrics from '@/components/reportes/saldos/SaldoReportMetrics';
import SaldoReportTable from '@/components/reportes/saldos/SaldoReportTable';
import SaldoReportDetailTable from '@/components/reportes/saldos/SaldoReportDetailTable';
import {
  MOCK_CLIENTES_SALDOS,
  MOCK_SALDOS_RECORDS,
  MOCK_SALDOS_DETAILED,
  type SaldoRecord,
  type SaldoDetailedRecord,
  type SaldoReportType,
} from '@/components/reportes/saldos/mockData';
import { generateSaldosReportPDF } from '@/lib/generateSaldosReportPDF';
import { generateSaldosReportExcel } from '@/lib/generateSaldosReportExcel';

export default function SaldosReportPage() {
  const [dateFrom, setDateFrom] = useState('2026-08-01');
  const [dateTo, setDateTo] = useState('2026-08-05');
  const [clienteId, setClienteId] = useState('');
  const [reportType, setReportType] = useState<SaldoReportType>('resumido');
  const [showReport, setShowReport] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [filteredRecords, setFilteredRecords] = useState<SaldoRecord[]>(MOCK_SALDOS_RECORDS);
  const [filteredDetailed, setFilteredDetailed] = useState<SaldoDetailedRecord[]>(MOCK_SALDOS_DETAILED);
  const [appliedClienteName, setAppliedClienteName] = useState('Todos los Clientes');
  const [appliedDateFrom, setAppliedDateFrom] = useState('2026-08-01');
  const [appliedDateTo, setAppliedDateTo] = useState('2026-08-05');
  const [appliedReportType, setAppliedReportType] = useState<SaldoReportType>('resumido');

  const reportId = '#REP-SAL-BANDES-2026-08';
  const generatedAt = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const clienteName = MOCK_CLIENTES_SALDOS.find((c) => c.id === clienteId)?.name || 'Todos los Clientes';

  const handleGenerate = useCallback(() => {
    const selectedCliente = MOCK_CLIENTES_SALDOS.find((c) => c.id === clienteId);
    const matchName = selectedCliente && selectedCliente.id !== '' ? selectedCliente.name : '';

    const records = MOCK_SALDOS_RECORDS.filter((item) => {
      if (matchName === '') return true;
      return item.cliente === matchName;
    });

    const detailed = MOCK_SALDOS_DETAILED.filter((item) => {
      if (matchName === '') return true;
      return item.cliente === matchName;
    });

    setFilteredRecords(records);
    setFilteredDetailed(detailed);
    setAppliedClienteName(clienteName);
    setAppliedDateFrom(dateFrom);
    setAppliedDateTo(dateTo);
    setAppliedReportType(reportType);
    setShowReport(true);
  }, [clienteId, clienteName, dateFrom, dateTo, reportType]);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      generateSaldosReportPDF({
        records: filteredRecords,
        detailedRecords: filteredDetailed,
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
      await generateSaldosReportExcel({
        records: filteredRecords,
        detailedRecords: filteredDetailed,
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
      <SaldoReportFilters
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
          <SaldoReportHeader
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportExcel}
            reportId={reportId}
            generatedAt={generatedAt}
            clienteName={appliedClienteName}
            dateFrom={appliedDateFrom}
            dateTo={appliedDateTo}
          />

          <SaldoReportMetrics records={filteredRecords} />

          <div className="mt-6">
            {appliedReportType === 'resumido' ? (
              <SaldoReportTable records={filteredRecords} />
            ) : (
              <SaldoReportDetailTable records={filteredDetailed} />
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
