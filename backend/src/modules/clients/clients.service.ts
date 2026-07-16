import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.client.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async create(data: { name: string }) {
    return this.prisma.client.create({ data });
  }

  async balance(id: string) {
    const client = await this.findOne(id);

    const [barsResult, exitsResult, inStockResult] = await Promise.all([
      this.prisma.bar.aggregate({
        where: { clientId: id },
        _sum: { fineWeight: true },
      }),
      this.prisma.exitDetail.aggregate({
        where: { clientId: id },
        _sum: { weightAported: true },
      }),
      this.prisma.bar.aggregate({
        where: { clientId: id, status: 'IN_STOCK' },
        _sum: { fineWeight: true },
      }),
    ]);

    const totalReceived = Number(barsResult._sum.fineWeight ?? 0);
    const totalExited = Number(exitsResult._sum.weightAported ?? 0);
    const inStock = Number(inStockResult._sum.fineWeight ?? 0);

    return {
      clientId: id,
      clientName: client.name,
      totalReceived,
      totalExited,
      inStock,
      currentBalance: totalReceived - totalExited,
    };
  }
}
