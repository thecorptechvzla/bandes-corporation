import { Injectable, NotFoundException } from '@nestjs/common';
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
