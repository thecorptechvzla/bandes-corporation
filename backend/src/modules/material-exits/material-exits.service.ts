import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class MaterialExitsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    destination: string;
    clientId?: string;
    lotIds?: string[];
    barIds?: string[];
  }) {
    const hasLots = data.lotIds?.length;
    const hasBars = data.barIds?.length;

    if (!hasLots && !hasBars) {
      throw new BadRequestException('Debe proporcionar lotIds o barIds');
    }

    const clientId = await this.resolveClientId(data.clientId);

    if (hasLots && hasBars) {
      return this.createFromMixed(
        data.destination,
        clientId,
        data.lotIds!,
        data.barIds!,
      );
    }

    if (hasLots) {
      return this.createFromLots(data.destination, clientId, data.lotIds!);
    }

    return this.createFromBars(data.destination, clientId, data.barIds!);
  }

  private async resolveClientId(clientId?: string): Promise<string | null> {
    if (!clientId) return null;
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true },
    });
    if (!client) {
      throw new BadRequestException('El cliente destinatario no existe');
    }
    return client.id;
  }

  private async createFromLots(
    destination: string,
    clientId: string | null,
    lotIds: string[],
  ) {
    return this.prisma.$transaction(async (tx) => {
      const lots = await tx.lot.findMany({
        where: { id: { in: lotIds } },
        include: {
          process: { select: { status: true, clientId: true } },
          bars: { where: { status: { in: ['IN_STOCK', 'COMPLETADO'] } } },
        },
      });

      if (lots.length !== lotIds.length) {
        throw new BadRequestException('Uno o más lotes no existen');
      }

      for (const lot of lots) {
        if (lot.process.status !== 'CLOSED') {
          throw new BadRequestException(
            `El lote ${lot.name} pertenece a un proceso no cerrado`,
          );
        }
        if (lot.bars.length === 0) {
          throw new BadRequestException(
            `El lote ${lot.name} no tiene barras disponibles para egresar`,
          );
        }
      }

      const totalWeight = lots.reduce(
        (sum, lot) =>
          sum + lot.bars.reduce((s, b) => s + Number(b.grossWeight), 0),
        0,
      );

      const exit = await tx.materialExit.create({
        data: { destination, clientId, totalWeight },
      });

      for (const lot of lots) {
        const lotWeight = lot.bars.reduce(
          (s, b) => s + Number(b.grossWeight),
          0,
        );

        const detail = await tx.exitDetail.create({
          data: {
            exitId: exit.id,
            lotId: lot.id,
            weightAported: lotWeight,
          },
        });

        await tx.bar.updateMany({
          where: { id: { in: lot.bars.map((b) => b.id) } },
          data: { status: 'EXITED', exitDetailId: detail.id },
        });
      }

      return tx.materialExit.findUnique({
        where: { id: exit.id },
        include: {
          exitDetails: {
            include: {
              lot: {
                include: {
                  process: {
                    include: { client: { select: { id: true, name: true } } },
                  },
                },
              },
              bars: {
                select: {
                  id: true,
                  barNumber: true,
                  fineWeight: true,
                  clientId: true,
                  client: { select: { id: true, name: true } },
                },
              },
            },
          },
          bars: true,
        },
      });
    });
  }

  private async createFromBars(
    destination: string,
    clientId: string | null,
    barIds: string[],
  ) {
    return this.prisma.$transaction(async (tx) => {
      const bars = await tx.bar.findMany({
        where: { id: { in: barIds } },
        include: { client: { select: { id: true, name: true } } },
      });

      if (bars.length !== barIds.length) {
        throw new BadRequestException('Una o más barras no existen');
      }

      const invalidBars = bars.filter(
        (b) => b.status !== 'IN_STOCK' && b.status !== 'COMPLETADO',
      );
      if (invalidBars.length > 0) {
        throw new BadRequestException(
          `Las siguientes barras no están disponibles para egresar: ${invalidBars.map((b) => b.barNumber).join(', ')}`,
        );
      }

      const assignedBars = bars.filter((b) => b.lotId);
      if (assignedBars.length > 0) {
        throw new BadRequestException(
          `Las siguientes barras están asignadas a un lote y deben egresarse como parte del lote: ${assignedBars.map((b) => b.barNumber).join(', ')}`,
        );
      }

      const totalWeight = bars.reduce(
        (sum, b) => sum + Number(b.grossWeight),
        0,
      );

      const exit = await tx.materialExit.create({
        data: { destination, clientId, totalWeight },
      });

      await tx.bar.updateMany({
        where: { id: { in: barIds } },
        data: { status: 'EXITED', exitId: exit.id },
      });

      return tx.materialExit.findUnique({
        where: { id: exit.id },
        include: {
          exitDetails: {
            include: {
              lot: {
                include: {
                  process: {
                    include: { client: { select: { id: true, name: true } } },
                  },
                },
              },
              bars: {
                select: {
                  id: true,
                  barNumber: true,
                  fineWeight: true,
                  clientId: true,
                  client: { select: { id: true, name: true } },
                },
              },
            },
          },
          bars: {
            include: { client: { select: { id: true, name: true } } },
          },
        },
      });
    });
  }

  private async createFromMixed(
    destination: string,
    clientId: string | null,
    lotIds: string[],
    barIds: string[],
  ) {
    return this.prisma.$transaction(async (tx) => {
      const lots = await tx.lot.findMany({
        where: { id: { in: lotIds } },
        include: {
          process: { select: { status: true, clientId: true } },
          bars: { where: { status: { in: ['IN_STOCK', 'COMPLETADO'] } } },
        },
      });

      if (lots.length !== lotIds.length) {
        throw new BadRequestException('Uno o más lotes no existen');
      }

      for (const lot of lots) {
        if (lot.process.status !== 'CLOSED') {
          throw new BadRequestException(
            `El lote ${lot.name} pertenece a un proceso no cerrado`,
          );
        }
        if (lot.bars.length === 0) {
          throw new BadRequestException(
            `El lote ${lot.name} no tiene barras disponibles para egresar`,
          );
        }
      }

      const bars = await tx.bar.findMany({
        where: { id: { in: barIds } },
        include: { client: { select: { id: true, name: true } } },
      });

      if (bars.length !== barIds.length) {
        throw new BadRequestException('Una o más barras no existen');
      }

      const invalidBars = bars.filter(
        (b) => b.status !== 'IN_STOCK' && b.status !== 'COMPLETADO',
      );
      if (invalidBars.length > 0) {
        throw new BadRequestException(
          `Las siguientes barras no están disponibles para egresar: ${invalidBars.map((b) => b.barNumber).join(', ')}`,
        );
      }

      const assignedBars = bars.filter((b) => b.lotId);
      if (assignedBars.length > 0) {
        throw new BadRequestException(
          `Las siguientes barras están asignadas a un lote y deben egresarse como parte del lote: ${assignedBars.map((b) => b.barNumber).join(', ')}`,
        );
      }

      const lotsWeight = lots.reduce(
        (sum, lot) =>
          sum + lot.bars.reduce((s, b) => s + Number(b.grossWeight), 0),
        0,
      );
      const barsWeight = bars.reduce((sum, b) => sum + Number(b.grossWeight), 0);
      const totalWeight = lotsWeight + barsWeight;

      const exit = await tx.materialExit.create({
        data: { destination, clientId, totalWeight },
      });

      for (const lot of lots) {
        const lotWeight = lot.bars.reduce(
          (s, b) => s + Number(b.grossWeight),
          0,
        );

        const detail = await tx.exitDetail.create({
          data: {
            exitId: exit.id,
            lotId: lot.id,
            weightAported: lotWeight,
          },
        });

        await tx.bar.updateMany({
          where: { id: { in: lot.bars.map((b) => b.id) } },
          data: { status: 'EXITED', exitDetailId: detail.id },
        });
      }

      await tx.bar.updateMany({
        where: { id: { in: barIds } },
        data: { status: 'EXITED', exitId: exit.id },
      });

      return tx.materialExit.findUnique({
        where: { id: exit.id },
        include: {
          exitDetails: {
            include: {
              lot: {
                include: {
                  process: {
                    include: { client: { select: { id: true, name: true } } },
                  },
                },
              },
              bars: {
                select: {
                  id: true,
                  barNumber: true,
                  fineWeight: true,
                  clientId: true,
                  client: { select: { id: true, name: true } },
                },
              },
            },
          },
          bars: {
            include: { client: { select: { id: true, name: true } } },
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
            lot: {
              include: {
                process: {
                  include: { client: { select: { id: true, name: true } } },
                },
              },
            },
            bars: {
              select: {
                id: true,
                barNumber: true,
                grossWeight: true,
                fineWeight: true,
                clientId: true,
                client: { select: { id: true, name: true } },
              },
            },
          },
        },
        bars: {
          include: { client: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getReportData(from: string, to: string, clientId?: string) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      throw new BadRequestException('Rango de fechas inválido');
    }
    toDate.setUTCHours(23, 59, 59, 999);

    const where: any = {
      createdAt: { gte: fromDate, lte: toDate },
      ...(clientId ? { OR: [] } : {}),
    };

    if (clientId) {
      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
        select: { name: true },
      });
      const or: any[] = [
        { bars: { some: { clientId } } },
        { exitDetails: { some: { bars: { some: { clientId } } } } },
      ];
      if (client?.name) {
        const destName = client.name.toUpperCase();
        or.push({ destination: { contains: destName } });
      }
      where.OR = or;
    }

    return this.prisma.materialExit.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: {
        client: { select: { id: true, name: true } },
        exitDetails: {
          include: {
            lot: {
              include: {
                process: {
                  include: { client: { select: { id: true, name: true } } },
                },
              },
            },
            bars: {
              select: {
                id: true,
                barNumber: true,
                grossWeight: true,
                purity: true,
                fineWeight: true,
                clientId: true,
                client: { select: { id: true, name: true } },
              },
            },
          },
        },
        bars: { include: { client: { select: { id: true, name: true } } } },
      },
    });
  }

  async traceability(id: string) {
    const exit = await this.prisma.materialExit.findUnique({
      where: { id },
      include: {
        exitDetails: {
          include: {
            lot: {
              include: {
                process: {
                  include: { client: { select: { id: true, name: true } } },
                },
              },
            },
            bars: {
              select: {
                barNumber: true,
                fineWeight: true,
                clientId: true,
                client: { select: { id: true, name: true } },
              },
            },
          },
        },
        bars: {
          include: { client: { select: { id: true, name: true } } },
        },
      },
    });

    if (!exit) throw new NotFoundException('MaterialExit not found');
    return exit;
  }
}
