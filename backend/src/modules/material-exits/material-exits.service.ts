import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class MaterialExitsService {
  constructor(private prisma: PrismaService) {}

  async create(data: { destination: string; contributions: { clientId: string; weightAported: number }[] }) {
    if (!data.contributions?.length) {
      throw new BadRequestException('At least one contribution is required');
    }

    const totalWeight = data.contributions.reduce((sum, c) => sum + c.weightAported, 0);

    return this.prisma.$transaction(async (tx) => {
      const exit = await tx.materialExit.create({
        data: {
          destination: data.destination,
          totalWeight,
        },
      });

      for (const contribution of data.contributions) {
        const detail = await tx.exitDetail.create({
          data: {
            exitId: exit.id,
            clientId: contribution.clientId,
            weightAported: contribution.weightAported,
          },
        });

        const bars = await tx.bar.findMany({
          where: {
            clientId: contribution.clientId,
            status: 'IN_STOCK',
          },
          orderBy: { createdAt: 'asc' },
        });

        let remaining = contribution.weightAported;
        const affectedBarIds: string[] = [];

        for (const bar of bars) {
          if (remaining <= 0) break;
          const barValue = Number(bar.fineWeight);

          if (barValue <= remaining) {
            await tx.bar.update({
              where: { id: bar.id },
              data: { status: 'EXITED', exitDetailId: detail.id },
            });
            affectedBarIds.push(bar.id);
            remaining -= barValue;
          } else {
            // Partial consumption of a bar's fine weight — for gold
            // the physical bar cannot be split, so we conceptually mark it
            // as fully consumed when any portion is used (standard gold
            // inventory practice: bars are indivisible).
            await tx.bar.update({
              where: { id: bar.id },
              data: { status: 'EXITED', exitDetailId: detail.id },
            });
            affectedBarIds.push(bar.id);
            remaining = 0;
          }
        }

        if (remaining > 0) {
          throw new BadRequestException(
            `Insufficient funds for client ${contribution.clientId}. ` +
            `Requested: ${contribution.weightAported}, ` +
            `Available: ${Number(contribution.weightAported) - Number(remaining)}`,
          );
        }
      }

      return tx.materialExit.findUnique({
        where: { id: exit.id },
        include: {
          exitDetails: {
            include: {
              client: { select: { id: true, name: true } },
              bars: { select: { id: true, barNumber: true } },
            },
          },
        },
      });
    });
  }

  async findAll() {
    return this.prisma.materialExit.findMany({
      include: {
        exitDetails: {
          include: {
            client: { select: { id: true, name: true } },
            bars: { select: { barNumber: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async traceability(id: string) {
    const exit = await this.prisma.materialExit.findUnique({
      where: { id },
      include: {
        exitDetails: {
          include: {
            client: { select: { id: true, name: true } },
            bars: { select: { barNumber: true, fineWeight: true } },
          },
        },
      },
    });

    if (!exit) throw new NotFoundException('MaterialExit not found');
    return exit;
  }
}
