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

    const [recibidoAgg, procesoAgg, recoveredAgg, exitedAgg, mermaFAAgg, porRefundirAgg, dailyFlow] =
      await Promise.all([
        // 1. ORO RECIBIDO
        this.prisma.bar.aggregate({
          where: { ...barBaseWhere },
          _sum: { fineWeight: true },
          _count: true,
        }),

        // 2. ORO EN PROCESO
        this.prisma.bar.aggregate({
          where: { ...barBaseWhere, ...clientFilter, status: 'PROCESANDO' },
          _sum: { fineWeight: true },
          _count: true,
        }),

        // 3. Recovered desde procesos CLOSED (excluye lotes ya despachados)
        this.prisma.lot.aggregate({
          where: {
            ...lotClientFilter,
            process: { status: 'CLOSED' },
            recovered: { not: null },
            exitDetails: { none: {} },
          },
          _sum: { recovered: true },
        }),

        // 4. EXITED
        this.prisma.bar.aggregate({
          where: { ...barBaseWhere, ...clientFilter, status: 'EXITED' },
          _sum: { fineWeight: true },
        }),

        // 5. FA que entró a fundir (en bóveda, no despachado)
        this.prisma.bar.aggregate({
          where: {
            ...barBaseWhere,
            ...clientFilter,
            status: 'COMPLETADO',
          },
          _sum: { fineWeight: true },
        }),

        // 6. POR REFUNDIR
        this.prisma.bar.aggregate({
          where: { ...barBaseWhere, ...clientFilter, status: 'IN_STOCK' },
          _sum: { fineWeight: true },
        }),

        // 7. DAILY FLOW — last 30 days (or filtered range)
        this.getDailyFlow(filters),
      ]);

    const oroRecibidoFA = Number(recibidoAgg._sum.fineWeight ?? 0);
    const oroEnProcesoFA = Number(procesoAgg._sum.fineWeight ?? 0);
    const oroEnProcesoCount = procesoAgg._count;
    const recoveredTotal = Number(recoveredAgg._sum.recovered ?? 0);
    const exitedFA = Number(exitedAgg._sum.fineWeight ?? 0);
    const mermaFA = Number(mermaFAAgg._sum.fineWeight ?? 0);
    const porRefundirFA = Number(porRefundirAgg._sum.fineWeight ?? 0);

    const oroEnBovedaFA = recoveredTotal + porRefundirFA;

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
        fundido: recoveredTotal,
        sinFundir: porRefundirFA,
      },
      porRefundir: {
        fineWeight: porRefundirFA,
      },
      merma: {
        gramos: mermaG,
        porcentaje: mermaPct,
      },
      dailyFlow,
    };
  }

  private async getDailyFlow(filters: MetricsFilters) {
    const start = filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const end = filters.endDate || new Date().toISOString().split('T')[0];

    const barWhereClauses: string[] = [`b."createdAt" >= '${start}'::timestamp`, `b."createdAt" <= '${end}'::timestamp + interval '1 day'`];
    const exitWhereClauses: string[] = [`e."createdAt" >= '${start}'::timestamp`, `e."createdAt" <= '${end}'::timestamp + interval '1 day'`];

    if (filters.supplierId) {
      barWhereClauses.push(`b."clientId" = '${filters.supplierId}'`);
    }

    const rows = await this.prisma.$queryRawUnsafe<{ date: string; ingresos: string; egresos: string }[]>(`
      SELECT
        d.date::text,
        COALESCE(ing.ingresos, 0) AS ingresos,
        COALESCE(eg.egresos, 0) AS egresos
      FROM generate_series(
        '${start}'::date,
        '${end}'::date,
        '1 day'::interval
      ) AS d(date)
      LEFT JOIN (
        SELECT DATE(b."createdAt") AS date, SUM(b."grossWeight") AS ingresos
        FROM "Bar" b
        WHERE ${barWhereClauses.join(' AND ')}
        GROUP BY DATE(b."createdAt")
      ) ing ON ing.date = d.date
      LEFT JOIN (
        SELECT date, SUM(egresos) AS egresos
        FROM (
          SELECT DATE(e."createdAt") AS date,
            COALESCE((
              SELECT SUM(b."grossWeight") FROM "Bar" b WHERE b."exitId" = e."id"
            ), 0)
            + COALESCE((
              SELECT SUM(b."grossWeight")
              FROM "ExitDetail" ed JOIN "Bar" b ON b."exitDetailId" = ed."id"
              WHERE ed."exitId" = e."id"
            ), 0) AS egresos
          FROM "MaterialExit" e
          WHERE ${exitWhereClauses.join(' AND ')}
        ) sub
        GROUP BY date
      ) eg ON eg.date = d.date
      ORDER BY d.date
    `);

    return rows.map(r => ({
      date: r.date,
      ingresos: Number(r.ingresos),
      egresos: Number(r.egresos),
    }));
  }
}
