'use client';

import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import SaldoReportFilters from '@/components/reportes/saldos/SaldoReportFilters';
import SaldoReportHeader from '@/components/reportes/saldos/SaldoReportHeader';
import SaldoReportMetrics from '@/components/reportes/saldos/SaldoReportMetrics';
import SaldoReportTable from '@/components/reportes/saldos/SaldoReportTable';
import SaldoReportDetailTable from '@/components/reportes/saldos/SaldoReportDetailTable';
import type { SaldoRecord, SaldoDetailedRecord, SaldoReportType } from '@/components/reportes/saldos/types';
import { generateSaldosReportPDF } from '@/lib/generateSaldosReportPDF';
import { generateSaldosReportExcel } from '@/lib/generateSaldosReportExcel';
import ReportGuideCard from '@/components/reportes/ReportGuideCard';
import { useClients } from '@/hooks/useClients';
import { useBars } from '@/hooks/useBars';
import { useLots } from '@/hooks/useLots';
import { useMaterialExits } from '@/hooks/useExits';
import { usePackings } from '@/hooks/usePackings';
import { computeSaldosReport } from '@/hooks/useSaldosReport';

const toISODate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const firstOfMonth = () => {
  const d = new Date();
  return `${toISODate(d).slice(0, 8)}01`;
};

export default function SaldosReportPage() {
  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo] = useState(() => toISODate(new Date()));
  const [clienteId, setClienteId] = useState('');
  const [reportType, setReportType] = useState<SaldoReportType>('resumido');
  const [showReport, setShowReport] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { data: clients = [] } = useClients({ role: 'PROVEEDOR' });
  const { data: bars = [] } = useBars();
  const { data: lots = [] } = useLots();
  const { data: exits = [] } = useMaterialExits();
  const { data: packings = [] } = usePackings();

  const [filteredRecords, setFilteredRecords] = useState<SaldoRecord[]>([]);
  const [filteredDetailed, setFilteredDetailed] = useState<SaldoDetailedRecord[]>([]);
  const [appliedClienteName, setAppliedClienteName] = useState('Todos los Proveedores');
  const [appliedDateFrom, setAppliedDateFrom] = useState(dateFrom);
  const [appliedDateTo, setAppliedDateTo] = useState(dateTo);
  const [appliedReportType, setAppliedReportType] = useState<SaldoReportType>('resumido');

  const reportId = `#REP-SAL-BANDES-${appliedDateFrom.slice(0, 7)}`;
  const generatedAt = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const clienteName = clients.find((c) => c.id === clienteId)?.name || 'Todos los Proveedores';

  const handleGenerate = useCallback(() => {
    setIsGenerating(true);
    try {
      const { records, detailed } = computeSaldosReport({
        clients,
        bars,
        lots,
        exits,
        packings,
        from: dateFrom,
        to: dateTo,
        clientId: clienteId || undefined,
      });

      setFilteredRecords(records);
      setFilteredDetailed(detailed);
      setAppliedClienteName(clienteName);
      setAppliedDateFrom(dateFrom);
      setAppliedDateTo(dateTo);
      setAppliedReportType(reportType);
      setShowReport(true);
    } finally {
      setIsGenerating(false);
    }
  }, [clients, bars, lots, exits, packings, dateFrom, dateTo, clienteId, clienteName, reportType]);

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
        clients={clients}
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

          {isGenerating ? (
            <div
              className="mt-4 text-[12px] font-semibold"
              style={{ color: 'var(--report-text-muted)' }}
            >
              Generando reporte...
            </div>
          ) : (
            <>
              <SaldoReportMetrics records={filteredRecords} />

              <div className="mt-6">
                {appliedReportType === 'resumido' ? (
                  <SaldoReportTable records={filteredRecords} />
                ) : (
                  <SaldoReportDetailTable records={filteredDetailed} />
      )}

              </div>
            </>
          )}
        </motion.div>
      )}

      {!showReport && <ReportGuideCard entity="proveedor" />}
    </motion.div>
  );
}
