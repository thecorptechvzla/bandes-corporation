import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class BarsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters?: { status?: string; clientId?: string; lotId?: string }) {
    return this.prisma.bar.findMany({
      where: {
        ...(filters?.status && { status: filters.status as any }),
        ...(filters?.clientId && { clientId: filters.clientId }),
        ...(filters?.lotId && { lotId: filters.lotId }),
      },
      include: { client: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const bar = await this.prisma.bar.findUnique({
      where: { id },
      include: { client: { select: { id: true, name: true } } },
    });
    if (!bar) throw new NotFoundException('Bar not found');
    return bar;
  }

  async create(data: {
    barNumber: string;
    grossWeight: number;
    purity: number;
    clientId: string;
    leyAg?: number;
  }) {
    const fineWeight = data.grossWeight * (data.purity / 1000);
    const fineWeightAg = data.leyAg
      ? data.grossWeight * (data.leyAg / 1000)
      : null;

    return this.prisma.bar.create({
      data: {
        barNumber: data.barNumber,
        grossWeight: data.grossWeight,
        purity: data.purity,
        fineWeight,
        leyAg: data.leyAg ?? null,
        fineWeightAg,
        clientId: data.clientId,
      },
      include: { client: { select: { id: true, name: true } } },
    });
  }

  async remove(id: string) {
    const bar = await this.findOne(id);
    if (bar.status === 'EXITED' || bar.exitDetailId) {
      throw new BadRequestException('No se puede eliminar una barra que ya ha sido egresada');
    }
    return this.prisma.bar.delete({
      where: { id },
    });
  }

  async update(
    id: string,
    data: {
      lotId?: string | null;
      status?: 'IN_STOCK' | 'PROCESANDO' | 'COMPLETADO' | 'EXITED';
    },
  ) {
    const bar = await this.findOne(id);
    return this.prisma.bar.update({
      where: { id },
      data,
      include: { client: { select: { id: true, name: true } } },
    });
  }
}
