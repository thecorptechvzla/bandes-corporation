import { Body, Controller, Get, Param, Patch, Post, InternalServerErrorException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ProcessesService } from './processes.service.js';

@Controller('processes')
export class ProcessesController {
  constructor(private service: ProcessesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('client/:clientId')
  findByClient(@Param('clientId') clientId: string) {
    return this.service.findByClient(clientId);
  }

  @Get('available-lots/:clientId')
  findAvailableLots(@Param('clientId') clientId: string) {
    return this.service.findAvailableLots(clientId);
  }

  @Get('available-lots')
  findAvailableLotsGlobal() {
    return this.service.findAvailableLotsGlobal();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() body: { name: string; clientId: string }) {
    return this.service.create(body);
  }

  @Post('full')
  async createFull(@Body() body: {
    clientId: string;
    barIds: string[];
    operator: string;
    moldCode: string;
    castingTemp?: number;
  }) {
    try {
      return await this.service.createFullProcess(body);
    } catch (err) {
      console.error('[Processes] createFull error:', err);
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new InternalServerErrorException(`Error de BD: ${err.message}`);
      }
      throw new InternalServerErrorException(err.message || 'Error al crear el proceso');
    }
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: { name?: string; status?: 'OPEN' | 'CLOSED' },
  ) {
    return this.service.update(id, body);
  }
}
