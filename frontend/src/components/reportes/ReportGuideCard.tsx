'use client';

import { Calendar, Building, FileText, Zap } from 'lucide-react';

interface ReportGuideCardProps {
  entity: 'cliente' | 'proveedor';
}

export default function ReportGuideCard({ entity }: ReportGuideCardProps) {
  const steps = [
    {
      icon: <Calendar size={22} color="#139169" />,
      title: 'Fechas',
      desc: 'Define el inicio y fin del período a consultar.',
    },
    {
      icon: entity === 'cliente' ? <Building size={22} color="#139169" /> : <Building size={22} color="#139169" />,
      title: entity === 'cliente' ? 'Cliente' : 'Proveedor',
      desc: 'Selecciona una entidad específica o deja "Todos".',
    },
    {
      icon: <FileText size={22} color="#139169" />,
      title: 'Tipo de Reporte',
      desc: 'Elige entre vista Resumen o desglosada Detallada.',
    },
    {
      icon: <Zap size={22} color="#139169" />,
      title: 'Generar Consulta',
      desc: 'Haz clic en "Generar" para procesar métricas y tablas.',
    },
  ];

  return (
    <div
      className="mx-auto mt-6"
      style={{
        maxWidth: '1100px',
        width: '100%',
        background: 'linear-gradient(180deg, #1b1e23 0%, #15181c 100%)',
        borderRadius: '12px',
        border: '1px solid #2d3139',
        padding: '24px',
      }}
    >
      <h3
        style={{
          fontSize: '13px',
          fontWeight: 700,
          color: '#139169',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          textAlign: 'center',
          marginBottom: '20px',
        }}
      >
        Instrucciones de consulta de reporte
      </h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
        }}
      >
        {steps.map((step, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: '#121417',
              border: '1px solid #2d3139',
              borderRadius: '8px',
              padding: '16px 14px',
              textAlign: 'center',
              transition: 'all 0.25s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'default',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.borderColor = '#139169';
              el.style.transform = 'translateY(-2px)';
              el.style.boxShadow = '0 4px 12px rgba(19, 145, 105, 0.15)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.borderColor = '#2d3139';
              el.style.transform = 'translateY(0)';
              el.style.boxShadow = 'none';
            }}
          >
            <div style={{ marginBottom: '10px' }}>{step.icon}</div>

            <span
              style={{
                fontSize: '13px',
                color: '#e1e3e6',
                fontWeight: 600,
                marginBottom: '6px',
              }}
            >
              {step.title}
            </span>

            <span
              style={{
                fontSize: '11px',
                color: '#8b949e',
                lineHeight: '1.4',
              }}
            >
              {step.desc}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
