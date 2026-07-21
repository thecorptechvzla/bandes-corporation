import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

interface MetricsFilters {
  startDate?: string;
  endDate?: string;
  supplierId?: string;
  clientId?: string;
}

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getMetrics(filters: MetricsFilters = {}) {
    const dateFilter =
      filters.startDate || filters.endDate
        ? {
            createdAt: {
              ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
              ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
            },
          }
        : {};

    const supplierFilter = filters.supplierId
      ? { clientId: filters.supplierId }
      : {};

    const clientFilter = filters.clientId
      ? { lot: { process: { clientId: filters.clientId } } }
      : {};

    const lotClientFilter = filters.clientId
      ? { process: { clientId: filters.clientId } }
      : {};

    const barBaseWhere = { ...dateFilter, ...supplierFilter };

    const [recibidoAgg, procesoAgg, recoveredAgg, exitedAgg, mermaFAAgg, porRefundirAgg] =
      await Promise.all([
        // 1. ORO RECIBIDO
        this.prisma.bar.aggregate({
          where: { ...barBaseWhere, status: { not: 'POR_VALIDAR' } },
          _sum: { fineWeight: true },
          _count: true,
        }),

        // 2. ORO EN PROCESO
        this.prisma.bar.aggregate({
          where: { ...barBaseWhere, ...clientFilter, status: 'PROCESANDO' },
          _sum: { fineWeight: true },
          _count: true,
        }),

        // 3. Recovered desde procesos CLOSED
        this.prisma.lot.aggregate({
          where: {
            ...lotClientFilter,
            process: { status: 'CLOSED' },
            recovered: { not: null },
          },
          _sum: { recovered: true },
        }),

        // 4. EXITED
        this.prisma.bar.aggregate({
          where: { ...barBaseWhere, ...clientFilter, status: 'EXITED' },
          _sum: { fineWeight: true },
        }),

        // 5. FA que entró a fundir (COMPLETADO + EXITED)
        this.prisma.bar.aggregate({
          where: {
            ...barBaseWhere,
            ...clientFilter,
            status: { in: ['COMPLETADO', 'EXITED'] },
          },
          _sum: { fineWeight: true },
        }),

        // 6. POR REFUNDIR
        this.prisma.bar.aggregate({
          where: { ...barBaseWhere, ...clientFilter, status: 'IN_STOCK' },
          _sum: { fineWeight: true },
        }),
      ]);

    const oroRecibidoFA = Number(recibidoAgg._sum.fineWeight ?? 0);
    const oroEnProcesoFA = Number(procesoAgg._sum.fineWeight ?? 0);
    const oroEnProcesoCount = procesoAgg._count;
    const recoveredTotal = Number(recoveredAgg._sum.recovered ?? 0);
    const exitedFA = Number(exitedAgg._sum.fineWeight ?? 0);
    const mermaFA = Number(mermaFAAgg._sum.fineWeight ?? 0);
    const porRefundirFA = Number(porRefundirAgg._sum.fineWeight ?? 0);

    const oroEnBovedaFA = Math.max(0, recoveredTotal - exitedFA);

    const mermaG = Math.max(0, mermaFA - recoveredTotal);
    const mermaPct = mermaFA > 0 ? (mermaG / mermaFA) * 100 : 0;

    return {
      oroRecibido: {
        fineWeight: oroRecibidoFA,
        barCount: recibidoAgg._count,
      },
      oroEnProceso: {
        fineWeight: oroEnProcesoFA,
        barCount: oroEnProcesoCount,
      },
      oroEnBoveda: {
        fineWeight: oroEnBovedaFA,
      },
      porRefundir: {
        fineWeight: porRefundirFA,
      },
      merma: {
        gramos: mermaG,
        porcentaje: mermaPct,
      },
    };
  }
}
