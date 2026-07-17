import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class BarsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters?: { status?: string; clientId?: string }) {
    return this.prisma.bar.findMany({
      where: {
        ...(filters?.status && { status: filters.status as any }),
        ...(filters?.clientId && { clientId: filters.clientId }),
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

  async autoSelect(data: { clientId: string; requiredWeight: number }) {
    const bars = await this.prisma.bar.findMany({
      where: { clientId: data.clientId, status: 'IN_STOCK' },
      orderBy: { createdAt: 'asc' },
    });

    let accumulated = 0;
    const selected: typeof bars = [];

    for (const bar of bars) {
      if (accumulated >= data.requiredWeight) break;
      accumulated += Number(bar.fineWeight);
      selected.push(bar);
    }

    if (accumulated < data.requiredWeight) {
      throw new BadRequestException(
        `Saldo insuficiente. Disponible: ${accumulated.toFixed(4)} kg, requerido: ${data.requiredWeight.toFixed(4)} kg`,
      );
    }

    return { bars: selected, totalFineWeight: accumulated };
  }

  async create(data: {
    barNumber: string;
    grossWeight: number;
    purity: number;
    clientId: string;
  }) {
    const fineWeight = data.grossWeight * (data.purity / 1000);

    return this.prisma.bar.create({
      data: {
        barNumber: data.barNumber,
        grossWeight: data.grossWeight,
        purity: data.purity,
        fineWeight,
        clientId: data.clientId,
      },
      include: { client: { select: { id: true, name: true } } },
    });
  }
}
