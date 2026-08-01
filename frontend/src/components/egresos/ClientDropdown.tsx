'use client';

import React, { useState, useMemo } from 'react';
import { ShoppingCart } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  rif: string;
  role?: string;
  contactInfo?: string;
}

interface ClientDropdownProps {
  value: Client | null;
  onChange: (client: Client | null) => void;
  buyers: Client[];
}

export function ClientDropdown({ value, onChange, buyers }: ClientDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return buyers;
    const q = search.toLowerCase();
    return buyers.filter(c =>
      c.name.toLowerCase().includes(q) || c.rif.toLowerCase().includes(q),
    );
  }, [buyers, search]);

  const handleToggle = () => {
    setOpen(prev => !prev);
    setSearch('');
  };

  return (
    <div className="space-y-1.5 relative">
      <label className="text-[11px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider flex items-center gap-1">
        <ShoppingCart className="w-3 h-3" /> ¿A quién se le vende? (Destinatario Final)
      </label>
      <div
        onClick={handleToggle}
        className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg px-3 py-2.5 text-xs font-mono text-[var(--pm-text-primary)] focus:outline-none cursor-pointer transition-colors flex items-center justify-between uppercase"
        style={{ borderColor: value ? 'rgba(212,175,55,0.3)' : 'var(--pm-border)' }}>
        <span className={value ? '' : 'text-[var(--pm-text-dim)]/30'}>
          {value ? value.name : 'Seleccione un cliente...'}
        </span>
        <span className="text-[var(--pm-text-dim)] text-[10px]">{open ? '▲' : '▼'}</span>
      </div>
      {value && (
        <div className="text-[10px] font-mono text-[var(--pm-text-dim)] mt-0.5 px-1">
          RIF: {value.rif}{value.contactInfo ? ` · ${value.contactInfo}` : ''}
        </div>
      )}
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 top-full mt-1 left-0 right-0 max-h-[250px] overflow-y-auto rounded-xl border border-[var(--pm-border)] bg-[var(--pm-bg-deepest)] shadow-xl v2-scroll">
            <div className="sticky top-0 bg-[var(--pm-bg-deepest)] p-2 border-b border-[var(--pm-border)]/20 z-10">
              <input type="text" placeholder="Buscar cliente o RIF..." value={search}
                onChange={e => setSearch(e.target.value)}
                onClick={e => e.stopPropagation()}
                className="w-full bg-[var(--pm-bg-base)]/50 border border-[var(--pm-border)] rounded-lg px-3 py-1.5 text-[11px] font-mono text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-gold)] placeholder:text-[var(--pm-text-dim)]/30" />
            </div>
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-[11px] font-mono text-[var(--pm-text-dim)]">Sin resultados</div>
            ) : (
              filtered.map(c => (
                <div key={c.id} onClick={() => { onChange(c); setOpen(false); }}
                  className={`px-4 py-3 cursor-pointer transition-all hover:bg-[var(--pm-accent-gold)]/12 text-[12px] font-sans border-b border-[var(--pm-border)]/15 last:border-0 ${value?.id === c.id ? 'bg-[var(--pm-accent-gold)]/12 text-[var(--pm-accent-gold)]' : 'text-[var(--pm-text-primary)]'}`}>
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-[10px] font-mono text-[var(--pm-text-dim)] mt-0.5">RIF: {c.rif}</div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
