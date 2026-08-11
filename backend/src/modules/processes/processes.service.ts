import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class ProcessesService {
  constructor(private prisma: PrismaService) {}

  private buildLotComposition(
    bars: {
      clientId: string;
      client?: { name?: string } | null;
      fineWeight: number | string | { toString(): string };
    }[],
  ) {
    const byClient = new Map<
      string,
      { clientId: string; clientName: string; weight: number }
    >();
    let total = 0;

    for (const b of bars) {
      const weight = Number(b.fineWeight) || 0;
      total += weight;
      const prev = byClient.get(b.clientId) || {
        clientId: b.clientId,
        clientName: b.client?.name || 'DESCONOCIDO',
        weight: 0,
      };
      prev.weight += weight;
      byClient.set(b.clientId, prev);
    }

    const composition = Array.from(byClient.values()).map((c) => ({
      clientId: c.clientId,
      clientName: c.clientName,
      weight: Number(c.weight.toFixed(4)),
      percentage: total > 0 ? Number(((c.weight / total) * 100).toFixed(2)) : 0,
    }));

    return { isMixed: composition.length > 1, composition };
  }

  async findAll() {
    return this.prisma.process.findMany({
      include: {
        client: { select: { id: true, name: true } },
        lots: {
          include: {
            bars: { include: { client: { select: { id: true, name: true } } } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const process = await this.prisma.process.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true } },
        lots: {
          include: {
            bars: { include: { client: { select: { id: true, name: true } } } },
          },
        },
      },
    });
    if (!process) throw new NotFoundException('Process not found');
    return process;
  }

  async findByClient(clientId: string) {
    return this.prisma.process.findMany({
      where: { clientId },
      include: { lots: true },
      orderBy: { name: 'asc' },
    });
  }

  async getReportData(from: string, to: string, clientId?: string) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      throw new BadRequestException('Rango de fechas inválido');
    }
    toDate.setUTCHours(23, 59, 59, 999);

    const where = {
      createdAt: { gte: fromDate, lte: toDate },
      ...(clientId
        ? {
            OR: [
              { clientId },
              { lots: { some: { bars: { some: { clientId } } } } },
            ],
          }
        : {}),
    };

    return this.prisma.process.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: {
        client: { select: { id: true, name: true } },
        lots: {
          orderBy: { createdAt: 'asc' as const },
          include: {
            bars: {
              orderBy: { createdAt: 'asc' as const },
              include: {
                client: { select: { id: true, name: true } },
                packing: { select: { id: true, fileName: true, packingNumber: true } },
              },
            },
          },
        },
      },
    });
  }

  async create(data: { name: string; clientId: string }) {
    return this.prisma.process.create({
      data,
      include: { client: { select: { id: true, name: true } } },
    });
  }

  async createFullProcess(data: {
    clientId: string;
    barIds: string[];
    operator: string;
    moldCode: string;
    castingTemp?: number;
  }) {
    return this.prisma.$transaction(
      async (tx) => {
        const bars = await tx.bar.findMany({
          where: { id: { in: data.barIds } },
          include: { client: { select: { id: true, name: true } } },
        });

        const invalid = bars.filter(
          (b) => b.status !== 'IN_STOCK' && b.status !== 'POR_VALIDAR',
        );
        if (invalid.length > 0) {
          throw new Error(
            `Barras no disponibles: ${invalid.map((b) => b.barNumber).join(', ')} (status: ${invalid.map((b) => b.status).join(', ')})`,
          );
        }

        // Detect mixed (bars from >1 supplier)
        const uniqueClientIds = [...new Set(bars.map((b) => b.clientId))];
        const isMixed = uniqueClientIds.length > 1;

        // Representative clientId = first bar's client (required FK)
        const representativeClientId = data.clientId;

        // Generate sequential name (unique per type)
        let name: string;
        if (isMixed) {
          const mixedCount = await tx.process.count({
            where: { isMixed: true },
          });
          name = `PROCESO MIXTO - ${String(mixedCount + 1).padStart(2, '0')}`;
        } else {
          const seq = (await tx.process.count({
            where: { clientId: representativeClientId },
          })) + 1;
          name = `P-${seq}`;
        }

        // Create single master process
        const process = await tx.process.create({
          data: {
            name,
            clientId: representativeClientId,
            isMixed,
          },
        });

        // Create ONE consolidated lot for all bars
        const lot = await tx.lot.create({
          data: {
            name: `LOTE-${data.moldCode}`,
            processId: process.id,
            operator: data.operator,
            castingTemp: data.castingTemp ?? 1064,
            moldCode: data.moldCode,
          },
        });

        // Assign ALL bars to the single lot
        await tx.bar.updateMany({
          where: { id: { in: data.barIds } },
          data: { status: 'PROCESANDO', lotId: lot.id },
        });

        return {
          process,
          lots: [lot],
          barCount: bars.length,
          barNumbers: bars.map((b) => b.barNumber),
        };
      },
      { timeout: 15_000 },
    );
  }

  async update(
    id: string,
    data: { name?: string; status?: 'OPEN' | 'CLOSED' },
  ) {
    const process = await this.findOne(id);

    if (data.status === 'CLOSED' && process.status === 'CLOSED') {
      throw new BadRequestException('El proceso ya está cerrado');
    }

    return this.prisma.process.update({
      where: { id },
      data,
      include: { client: { select: { id: true, name: true } }, lots: true },
    });
  }

  async cancel(id: string) {
    return this.prisma.$transaction(
      async (tx) => {
        const process = await tx.process.findUnique({
          where: { id },
          include: {
            lots: { select: { id: true } },
          },
        });

        if (!process) {
          throw new NotFoundException('Proceso no encontrado');
        }

        if (process.status !== 'OPEN') {
          throw new BadRequestException(
            `Solo se pueden cancelar procesos abiertos (estado actual: ${process.status})`,
          );
        }

        const lotIds = process.lots.map((l) => l.id);

        // Liberar todas las barras del proceso: PROCESANDO → IN_STOCK y desvincular del lote
        const freed = await tx.bar.updateMany({
          where: { lotId: { in: lotIds } },
          data: { status: 'IN_STOCK', lotId: null },
        });

        const cancelled = await tx.process.update({
          where: { id },
          data: { status: 'CANCELLED' },
          include: {
            client: { select: { id: true, name: true } },
            lots: true,
          },
        });

        return { process: cancelled, freedBars: freed.count };
      },
      { timeout: 15_000 },
    );
  }

  async findAvailableLots(clientId: string) {
    const processes = await this.prisma.process.findMany({
      where: { clientId, status: 'CLOSED' },
      include: {
        lots: {
          include: {
            bars: {
              where: { status: { in: ['IN_STOCK', 'COMPLETADO'] } },
              select: {
                grossWeight: true,
                fineWeight: true,
                purity: true,
                leyAg: true,
                fineWeightAg: true,
                clientId: true,
                client: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return processes.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      clientId: p.clientId,
      lots: p.lots
        .filter((l) => l.bars.length > 0)
        .map((l) => {
          const meta = this.buildLotComposition(l.bars);
          const fineFromBars = l.bars.reduce((sum, b) => sum + Number(b.fineWeight), 0);
          const grossFromBars = l.bars.reduce((sum, b) => sum + Number(b.grossWeight), 0);
          const calibrated = l.fineWeight != null;
          return {
            id: l.id,
            name: l.name,
            availableWeight: Number(
              l.fineWeight != null ? l.fineWeight : fineFromBars,
            ),
            grossWeight: Number(
              l.recovered != null ? l.recovered : grossFromBars,
            ),
            purity: l.purity != null ? Number(l.purity) : null,
            barCount: l.bars.length,
            isMixed: meta.isMixed,
            composition: meta.composition,
          };
        }),
    }));
  }

  async findAvailableLotsGlobal() {
    const processes = await this.prisma.process.findMany({
      where: { status: 'CLOSED' },
      include: {
        client: { select: { id: true, name: true } },
        lots: {
          include: {
            bars: {
              where: { status: { in: ['IN_STOCK', 'COMPLETADO'] } },
              select: {
                grossWeight: true,
                fineWeight: true,
                purity: true,
                leyAg: true,
                fineWeightAg: true,
                clientId: true,
                client: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return processes
      .map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        clientId: p.clientId,
        clientName: p.client.name,
        lots: p.lots
          .filter((l) => l.bars.length > 0)
          .map((l) => {
            const meta = this.buildLotComposition(l.bars);
            const fineFromBars = l.bars.reduce((sum, b) => sum + Number(b.fineWeight), 0);
            const grossFromBars = l.bars.reduce((sum, b) => sum + Number(b.grossWeight), 0);
            const calibrated = l.fineWeight != null;
            return {
              id: l.id,
              name: l.name,
              availableWeight: Number(
                l.fineWeight != null ? l.fineWeight : fineFromBars,
              ),
              grossWeight: Number(
                l.recovered != null ? l.recovered : grossFromBars,
              ),
              purity: l.purity != null ? Number(l.purity) : null,
              barCount: l.bars.length,
              isMixed: meta.isMixed,
              composition: meta.composition,
            };
          }),
      }))
      .filter((p) => p.lots.length > 0);
  }
}
