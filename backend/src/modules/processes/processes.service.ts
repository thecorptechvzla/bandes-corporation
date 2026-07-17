import { Injectable, NotFoundException } from '@nestjs/common';
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
}
