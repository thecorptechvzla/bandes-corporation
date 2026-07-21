import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class ProcessesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.process.findMany({
      include: { client: { select: { id: true, name: true } }, lots: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const process = await this.prisma.process.findUnique({
      where: { id },
      include: { client: { select: { id: true, name: true } }, lots: true },
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
        const count = await tx.process.count({
          where: { clientId: data.clientId },
        });
        const seq = count + 1;
        const name = `P-${seq}`;

        const process = await tx.process.create({
          data: { name, clientId: data.clientId },
        });

        const lot = await tx.lot.create({
          data: {
            name: `LOTE-${data.moldCode}`,
            processId: process.id,
            operator: data.operator,
            castingTemp: data.castingTemp ?? 1064,
            moldCode: data.moldCode,
          },
        });

        const bars = await tx.bar.findMany({
          where: { id: { in: data.barIds } },
        });

        const invalid = bars.filter(
          (b) => b.status !== 'IN_STOCK' && b.status !== 'POR_VALIDAR',
        );
        if (invalid.length > 0) {
          throw new Error(
            `Barras no disponibles: ${invalid.map((b) => b.barNumber).join(', ')} (status: ${invalid.map((b) => b.status).join(', ')})`,
          );
        }

        await tx.bar.updateMany({
          where: { id: { in: data.barIds } },
          data: { status: 'PROCESANDO', lotId: lot.id },
        });

        return {
          process,
          lot,
          barCount: data.barIds.length,
          barNumbers: bars.map((b) => b.barNumber),
        };
      },
      { timeout: 10_000 },
    );
  }

  async update(id: string, data: { name?: string; status?: 'OPEN' | 'CLOSED' }) {
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

  async findAvailableLots(clientId: string) {
    const processes = await this.prisma.process.findMany({
      where: { clientId, status: 'CLOSED' },
      include: {
        lots: {
          include: {
            bars: {
              where: { status: { in: ['IN_STOCK', 'COMPLETADO'] } },
              select: { fineWeight: true, leyAg: true, fineWeightAg: true },
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
        .map((l) => ({
          id: l.id,
          name: l.name,
          availableWeight: Number(
            l.bars.reduce((sum, b) => sum + Number(b.fineWeight), 0),
          ),
          barCount: l.bars.length,
        })),
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
              select: { fineWeight: true, leyAg: true, fineWeightAg: true },
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
          .map((l) => ({
            id: l.id,
            name: l.name,
            availableWeight: Number(
              l.bars.reduce((sum, b) => sum + Number(b.fineWeight), 0),
            ),
            barCount: l.bars.length,
          })),
      }))
      .filter((p) => p.lots.length > 0);
  }
}
