import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class PackingsService {
  constructor(private prisma: PrismaService) {}

  async getNextInfo(clientId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: { name: true },
    });
    if (!client) throw new NotFoundException('Cliente no encontrado');

    const existing = await this.prisma.packing.findFirst({
      where: { clientId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, packingNumber: true },
    });

    if (existing) {
      return {
        packingNumber: existing.packingNumber,
        packingId: existing.id,
        clientName: client.name,
      };
    }

    const last = await this.prisma.packing.findFirst({
      where: { clientId, packingNumber: { not: null } },
      orderBy: { packingNumber: 'desc' },
      select: { packingNumber: true },
    });
    const nextNumber = (last?.packingNumber ?? 0) + 1;

    return {
      packingNumber: nextNumber,
      packingId: null,
      clientName: client.name,
    };
  }

  async getReportData(
    from: string,
    to: string,
    type: 'resumido' | 'detallado',
    clientId?: string,
  ) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      throw new BadRequestException('Rango de fechas inválido');
    }
    toDate.setUTCHours(23, 59, 59, 999);

    const where = {
      createdAt: { gte: fromDate, lte: toDate },
      ...(clientId ? { clientId } : {}),
    };

    const includeBars = type === 'detallado';

    if (includeBars) {
      const packings = await this.prisma.packing.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        include: {
          client: { select: { id: true, name: true } },
          bars: {
            include: { lot: { select: { name: true } } },
            orderBy: { createdAt: 'asc' as const },
          },
        },
      });
      return packings.map((p) => this.withPackingAggregates(p, p.bars ?? []));
    }

    // Modo resumido: no se traen las relaciones de barras; los agregados
    // por packing se calculan con una sola consulta de groupBy.
    const packings = await this.prisma.packing.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: { client: { select: { id: true, name: true } } },
    });

    const ids = packings.map((p) => p.id);
    const grouped = ids.length
      ? await this.prisma.bar.groupBy({
          by: ['packingId'],
          where: { packingId: { in: ids } },
          _sum: { grossWeight: true, fineWeight: true },
          _count: { _all: true },
        })
      : [];

    const sumsByPacking = new Map(grouped.map((g) => [g.packingId, g]));

    // Conteo por estado para el desglose VAL. / PEND. del resumen.
    const groupedByStatus = ids.length
      ? await this.prisma.bar.groupBy({
          by: ['packingId', 'status'],
          where: { packingId: { in: ids } },
          _count: { _all: true },
        })
      : [];

    const countsByPacking = new Map<string, { validadas: number; pendientes: number }>();
    for (const g of groupedByStatus) {
      if (g.packingId == null) continue;
      const entry = countsByPacking.get(g.packingId) ?? { validadas: 0, pendientes: 0 };
      if (g.status === 'POR_VALIDAR') {
        entry.pendientes = g._count._all ?? 0;
      } else {
        entry.validadas = g._count._all ?? 0;
      }
      countsByPacking.set(g.packingId, entry);
    }

    return packings.map((p) => {
      const g = sumsByPacking.get(p.id);
      const barras = g?._count._all ?? 0;
      const pesoBruto = Number(g?._sum.grossWeight ?? 0);
      const pesoFino = Number(g?._sum.fineWeight ?? 0);
      const ley = pesoBruto > 0 ? (pesoFino / pesoBruto) * 1000 : 0;
      const counts = countsByPacking.get(p.id) ?? { validadas: 0, pendientes: 0 };
      return { ...p, barras, pesoBruto, pesoFino, ley, barrasValidadas: counts.validadas, barrasPendientes: counts.pendientes };
    });
  }

  private withPackingAggregates<T extends object>(
    p: T,
    bars: Array<{ grossWeight: unknown; fineWeight: unknown; status: string }>,
  ): T & { barras: number; pesoBruto: number; pesoFino: number; ley: number; barrasValidadas: number; barrasPendientes: number } {
    const pesoBruto = bars.reduce((s, b) => s + Number(b.grossWeight ?? 0), 0);
    const pesoFino = bars.reduce((s, b) => s + Number(b.fineWeight ?? 0), 0);
    const ley = pesoBruto > 0 ? (pesoFino / pesoBruto) * 1000 : 0;
    const validadas = bars.filter((b) => b.status !== 'POR_VALIDAR').length;
    return {
      ...p,
      barras: bars.length,
      pesoBruto,
      pesoFino,
      ley,
      barrasValidadas: validadas,
      barrasPendientes: bars.length - validadas,
    };
  }

  async findAll() {
    const packings = await this.prisma.packing.findMany({
      include: {
        client: { select: { id: true, name: true } },
        _count: {
          select: { bars: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(
      packings.map(async (p) => {
        const pending = await this.prisma.bar.count({
          where: { packingId: p.id, status: 'POR_VALIDAR' },
        });
        const validated = await this.prisma.bar.count({
          where: { packingId: p.id, status: { not: 'POR_VALIDAR' } },
        });
        return {
          ...p,
          _count: { ...p._count, pending, validated },
        };
      }),
    );
  }

  async findOne(id: string) {
    const packing = await this.prisma.packing.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true } },
        bars: {
          include: { client: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!packing) throw new NotFoundException('Packing no encontrado');
    return packing;
  }

  async create(data: { fileName: string; clientId: string }) {
    const last = await this.prisma.packing.findFirst({
      where: { clientId: data.clientId, packingNumber: { not: null } },
      orderBy: { packingNumber: 'desc' },
      select: { packingNumber: true },
    });
    const packingNumber = (last?.packingNumber ?? 0) + 1;

    return this.prisma.packing.create({
      data: {
        fileName: data.fileName.toUpperCase(),
        clientId: data.clientId,
        packingNumber,
        totalRows: 0,
        created: 0,
        skipped: 0,
        status: 'PENDING',
      },
      include: { client: { select: { id: true, name: true } } },
    });
  }

  async validate(
    packingId: string,
    barsData: Array<{
      barId: string;
      barNumber?: string;
      grossWeight: number;
      purity: number;
      leyAg?: number;
      photoUrl?: string;
    }>,
  ) {
    const packing = await this.prisma.packing.findUnique({
      where: { id: packingId },
      include: { bars: true },
    });
    if (!packing) throw new NotFoundException('Packing no encontrado');
    if (packing.status !== 'PENDING') {
      throw new BadRequestException('Este packing ya fue validado');
    }

    const results: Array<{ barId: string; success: boolean; error?: string }> = [];

    await this.prisma.$transaction(async (tx) => {
      for (const data of barsData) {
        const bar = packing.bars.find((b) => b.id === data.barId);
        if (!bar) {
          results.push({ barId: data.barId, success: false, error: 'Barra no encontrada en este packing' });
          continue;
        }
        if (bar.status !== 'POR_VALIDAR') {
          results.push({ barId: data.barId, success: false, error: `Barra ya fue procesada (${bar.status})` });
          continue;
        }

        const fineWeight = Math.round(data.grossWeight * (data.purity / 1000) * 100) / 100;
        const fineWeightAg = data.leyAg != null
          ? Math.round(data.grossWeight * (data.leyAg / 1000) * 100) / 100
          : null;

        await tx.bar.update({
          where: { id: data.barId },
          data: {
            barNumber: data.barNumber ?? bar.barNumber,
            grossWeight: data.grossWeight,
            purity: data.purity,
            fineWeight,
            ...(data.leyAg != null && { leyAg: data.leyAg, fineWeightAg }),
            ...(data.photoUrl != null && { photoUrl: data.photoUrl }),
            status: 'IN_STOCK',
          },
        });

        results.push({ barId: data.barId, success: true });
      }
    });

    return { validated: results.filter((r) => r.success).length, errors: results.filter((r) => !r.success), results };
  }

  async finalize(packingId: string) {
    const packing = await this.prisma.packing.findUnique({
      where: { id: packingId },
      include: { bars: true },
    });
    if (!packing) throw new NotFoundException('Packing no encontrado');
    if (packing.status !== 'PENDING') {
      throw new BadRequestException('Este packing ya fue validado');
    }

    const remaining = packing.bars.filter(b => b.status === 'POR_VALIDAR');
    if (remaining.length > 0) {
      throw new BadRequestException(`Faltan ${remaining.length} barra(s) por validar`);
    }

    return this.prisma.packing.update({
      where: { id: packingId },
      data: { status: 'VALIDATED' },
      include: { client: { select: { id: true, name: true } } },
    });
  }
}
