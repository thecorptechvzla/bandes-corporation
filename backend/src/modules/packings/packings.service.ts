import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class PackingsService {
  constructor(private prisma: PrismaService) {}

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
    return this.prisma.packing.create({
      data: {
        fileName: data.fileName.toUpperCase(),
        clientId: data.clientId,
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

        const fineWeight = data.grossWeight * (data.purity / 1000);
        const fineWeightAg = data.leyAg != null
          ? data.grossWeight * (data.leyAg / 1000)
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

      // Check if all bars are validated
      const remaining = await tx.bar.count({
        where: { packingId, status: 'POR_VALIDAR' },
      });
      if (remaining === 0) {
        await tx.packing.update({
          where: { id: packingId },
          data: { status: 'VALIDATED' },
        });
      }
    });

    return { validated: results.filter((r) => r.success).length, errors: results.filter((r) => !r.success), results };
  }
}
