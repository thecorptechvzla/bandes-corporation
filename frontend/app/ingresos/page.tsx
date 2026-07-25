'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { useClients } from '@/hooks/useClients';
import { useBars, useCreateBar, useBulkUploadBars } from '@/hooks/useBars';
import { api } from '@/lib/api';
import { formatNumber } from '@/lib/format';
import type { Bar } from '@/types/api';
import { ClipboardList, Package } from 'lucide-react';
import { BarRegistrationForm } from '@/components/ingresos/BarRegistrationForm';
import { BarInventoryPanel } from '@/components/ingresos/BarInventoryPanel';
import { BulkUploadSection } from '@/components/ingresos/BulkUploadSection';
import { ConfirmDeleteModal } from '@/components/ingresos/ConfirmDeleteModal';
import { IngestStatusOverlay } from '@/components/ingresos/IngestStatusOverlay';
import { DeleteStatusOverlay } from '@/components/ingresos/DeleteStatusOverlay';

export default function V2IngresosPage() {
  const { data: clients = [] } = useClients({ role: 'PROVEEDOR' });
  const { data: bars = [] } = useBars();
  const createBar = useCreateBar();
  const bulkUploadMutation = useBulkUploadBars();

  const [clientId, setClientId] = useState('');
  const [bulkClientId, setBulkClientId] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<'idle' | 'deleting' | 'success'>('idle');
  const [ingestStatus, setIngestStatus] = useState<{ barNumber: string; status: 'ingesting' | 'success' } | null>(null);

  useEffect(() => {
    if (clients.length > 0) {
      if (!clientId) setClientId(clients[0].id);
      if (!bulkClientId) setBulkClientId(clients[0].id);
    }
  }, [clients]);

  const barsByClient = useMemo(() => {
    const groups: Record<string, Bar[]> = {};
    clients.forEach(c => { groups[c.id] = []; });
    bars.forEach(b => {
      if (groups[b.clientId]) groups[b.clientId].push(b);
    });
    return groups;
  }, [bars, clients]);

  const totalBars = bars.length;
  const totalFineWeight = bars.reduce((s, b) => s + Number(b.fineWeight), 0);

  const handleSubmitBar = async (data: { barNumber: string; grossWeight: number; purity: number; clientId: string; leyAg?: number }) => {
    const existing = bars.find(b => b.clientId === data.clientId && b.barNumber.toUpperCase() === data.barNumber);
    if (existing) {
      return;
    }

    try {
      await createBar.mutateAsync(data);
      setIngestStatus({ barNumber: data.barNumber, status: 'ingesting' });
      setTimeout(() => setIngestStatus({ barNumber: data.barNumber, status: 'success' }), 800);
      setTimeout(() => setIngestStatus(null), 2800);
    } catch (err: any) {
      // error handled by mutation
    }
  };

  const handleBulkUpload = async (fd: FormData) => {
    return await bulkUploadMutation.mutateAsync(fd);
  };

  const handleDeleteBar = async (id: string) => {
    setConfirmDeleteId(null); setDeleteStatus('deleting');
    try {
      await api.delete(`/bars/${id}`);
      setDeleteStatus('success');
      setTimeout(() => setDeleteStatus('idle'), 2000);
    } catch { setDeleteStatus('idle'); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div>
          <h1 className="text-xl font-semibold text-[var(--pm-text-primary)] font-sans flex items-center gap-2.5">
            <ClipboardList className="w-6 h-6 text-[var(--pm-accent-gold)]" />
            Ingreso de <span className="text-[var(--pm-accent-gold)]">Material</span>
          </h1>
          <p className="text-xs text-[var(--pm-text-dim)] mt-0.5">Recepción y registro de barras en bóveda.</p>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono text-[var(--pm-text-dim)]">
          <span className="flex items-center gap-1"><Package className="w-3 h-3 text-[var(--pm-accent-gold)]" />{totalBars} barras</span>
          <span className="hidden sm:inline">FA total: {formatNumber(totalFineWeight, 2)} g</span>
        </div>
      </motion.div>

      {/* Split pane */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* LEFT PANEL */}
        <div className="space-y-5">
          <BarRegistrationForm
            clients={clients} clientId={clientId} isPending={createBar.isPending}
            onClientIdChange={setClientId} onSubmit={handleSubmitBar}
          />
          <BulkUploadSection
            clients={clients} bulkClientId={bulkClientId} isPending={bulkUploadMutation.isPending}
            onBulkClientIdChange={setBulkClientId} onUpload={handleBulkUpload}
          />
        </div>

        {/* RIGHT PANEL */}
        <BarInventoryPanel
          clients={clients} barsByClient={barsByClient} totalBars={totalBars}
          onDeleteBar={(id) => setConfirmDeleteId(id)}
        />
      </div>

      {/* Modals */}
      <IngestStatusOverlay ingestStatus={ingestStatus} />
      <ConfirmDeleteModal barId={confirmDeleteId} bars={bars} onConfirm={handleDeleteBar} onCancel={() => setConfirmDeleteId(null)} />
      <DeleteStatusOverlay deleteStatus={deleteStatus} />

      <p className="text-[9px] text-[var(--pm-text-dim)] font-mono text-center opacity-50">
        Datos actualizados en tiempo real · Bandes v2 Premium · {totalBars} barras · {formatNumber(totalFineWeight, 2)} g FA
      </p>
    </motion.div>
  );
}
